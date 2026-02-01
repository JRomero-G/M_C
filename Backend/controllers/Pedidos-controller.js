const mongoose = require("mongoose");
const Pedido = require("../models/Pedidos");
const PedidoDetalle = require("../models/Pedido-detalle");
const Producto = require("../models/Producto");
const { obtenerProximoIdSecuencial } = require("./Contador-controller");

/**Crear pedido público (desde catálogo → carrito → facturación)*/
const crearPedidoPublico = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    console.log("🛒 Recibiendo pedido público...");
    const {
      cliente,
      metodo_pago,
      envio_info,
      carrito, // Array de productos del carrito
      notas,
    } = req.body;

    // ================================
    // VALIDACIONES
    // ================================
    console.log("🔍 Validando datos del pedido...");

    // Validar cliente
    if (!cliente || !cliente.nombre || !cliente.correo || !cliente.telefono) {
      throw new Error(
        "Información del cliente incompleta. Se requiere: nombre, correo y teléfono"
      );
    }

    // Validar método de pago
    if (!metodo_pago || !["tarjeta", "transferencia"].includes(metodo_pago)) {
      throw new Error("Método de pago inválido. Use: tarjeta o transferencia");
    }

    // Validar carrito
    if (!carrito || !Array.isArray(carrito) || carrito.length === 0) {
      throw new Error(
        "El carrito está vacío. Agregue productos antes de confirmar el pedido"
      );
    }

    // Validar correo
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(cliente.correo)) {
      throw new Error("Correo electrónico inválido");
    }

    // ================================
    // PROCESAR CARRITO (Agrupar y sumar productos)
    // ================================
    console.log("📦 Procesando carrito...");

    // Agrupar productos por ID para sumar cantidades
    const productosAgrupados = new Map();
    let subtotal = 0;
    const itemsProcesados = [];

    for (const item of carrito) {
      const productId = item.id_producto;

      // Obtener información actual del producto
      const producto = await Producto.findById(productId).session(session);
      if (!producto) {
        throw new Error(`Producto con ID ${productId} no encontrado`);
      }

      if (producto.activo === false) {
        throw new Error(
          `El producto "${producto.nombre}" no está disponible actualmente`
        );
      }

      // Verificar stock disponible
      const cantidadSolicitada = item.cantidad || 1;

      // Si ya tenemos este producto en el mapa, sumar cantidad
      if (productosAgrupados.has(productId.toString())) {
        const existente = productosAgrupados.get(productId.toString());
        existente.cantidad += cantidadSolicitada;

        // Verificar stock después de sumar
        if (existente.cantidad > producto.stock) {
          throw new Error(
            `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}, Solicitado: ${existente.cantidad}`
          );
        }
      } else {
        // Verificar stock para nueva cantidad
        if (cantidadSolicitada > producto.stock) {
          throw new Error(
            `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}, Solicitado: ${cantidadSolicitada}`
          );
        }

        productosAgrupados.set(productId.toString(), {
          producto: producto,
          cantidad: cantidadSolicitada,
          precio_unitario:
            item.precio_unitario ||
            producto.precio_final ||
            producto.precio_actual ||
            producto.precio_original,
        });
      }
    }

    // ================================
    // CALCULAR TOTALES Y REDUCIR STOCK
    // ================================
    console.log("🧮 Calculando totales y actualizando stock...");

    for (const [productId, item] of productosAgrupados) {
      const itemSubtotal = item.cantidad * item.precio_unitario;
      subtotal += itemSubtotal;

      // Reducir stock del producto
      item.producto.stock -= item.cantidad;
      await item.producto.save({ session });

      // Preparar item para guardar en detalles
      itemsProcesados.push({
        producto: item.producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: itemSubtotal,
      });

      console.log(
        `   ${item.producto.nombre} x ${item.cantidad} = HNL ${itemSubtotal}`
      );
    }

    // Redondear subtotal
    subtotal = Math.round(subtotal * 100) / 100;

    // Calcular costo de envío y total
    const costoEnvio = envio_info?.costo_extra || 0;
    const isv = Math.round(subtotal * 0.15 * 100) / 100;
    const total = Math.round((subtotal + costoEnvio + isv) * 100) / 100;

    console.log(`💰 Subtotal: HNL ${subtotal}`);
    console.log(`🚚 Envío: HNL ${costoEnvio}`);
    console.log(`💵 Total: HNL ${total}`);

    // ================================
    // GENERAR ID SECUENCIAL Y CREAR PEDIDO
    // ================================
    console.log("🔢 Generando ID secuencial...");
    const identificador_pedido = await obtenerProximoIdSecuencial();
    console.log(`   ID generado: ${identificador_pedido}`);

    console.log("📝 Creando pedido principal...");

    // Determinar estado inicial según método de pago
    let estado = "en_revision";
    if (metodo_pago === "transferencia") {
      estado = "comprobante_pendiente";
    }

    // Si es tarjeta y fue aprobada, cambiar estado
    if (metodo_pago === "tarjeta" && req.body.pago_aprobado === true) {
      estado = "confirmado";
    }

    // Crear pedido principal
    const nuevoPedido = new Pedido({
      identificador_pedido,
      cliente: {
        nombre: cliente.nombre.trim(),
        telefono: cliente.telefono,
        correo: cliente.correo.toLowerCase(),
      },
      metodo_pago,
      envio_info: {
        tipo: envio_info?.tipo || "recogida",
        costo_extra: costoEnvio,
        direccion: envio_info?.direccion || "",
        estado: "pendiente",
      },
      subtotal,
      total,
      estado,
      notas: notas || "",
      // Si es tarjeta, guardar info del pago
      ...(metodo_pago === "tarjeta" && req.body.pago_info
        ? {
            pago_info: req.body.pago_info,
          }
        : {}),
    });

    const pedidoGuardado = await nuevoPedido.save({ session });
    console.log(`✅ Pedido creado: ${pedidoGuardado.identificador_pedido}`);

    // ================================
    // CREAR DETALLES DEL PEDIDO (Colección separada)
    // ================================
    console.log("📋 Creando detalles del pedido...");

    for (const item of itemsProcesados) {
      const detalle = new PedidoDetalle({
        id_pedido: pedidoGuardado._id,
        id_producto: item.producto._id,
        nombre_producto: item.producto.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
      });

      await detalle.save({ session });
      console.log(`   ✅ ${item.producto.nombre} - ${item.cantidad} unidades`);
    }

    // ================================
    // FINALIZAR TRANSACCIÓN
    // ================================
    await session.commitTransaction();
    console.log("🎉 Transacción completada exitosamente");

    // ================================
    // PREPARAR RESPUESTA
    // ================================
    const respuesta = {
      success: true,
      message: "Pedido creado exitosamente",
      pedido: {
        id: pedidoGuardado._id,
        identificador_pedido: pedidoGuardado.identificador_pedido,
        total: pedidoGuardado.total,
        estado: pedidoGuardado.estado,
        cliente: {
          nombre: pedidoGuardado.cliente.nombre,
          correo: pedidoGuardado.cliente.correo,
          telefono: pedidoGuardado.cliente.telefono,
        },

        productos: itemsProcesados.length,
        fecha: pedidoGuardado.fecha_pedido,
      },
    };

    // Agregar instrucciones según método de pago
    if (metodo_pago === "transferencia") {
      respuesta.instrucciones = {
        mensaje:
          "Por favor, envíe el comprobante de transferencia al WhatsApp: +504 XXXX-XXXX",
        datos_transferencia: {
          banco: "BAC Credomatic",
          cuenta: "XXXX-XXXX-XXXX",
          nombre: "TIENDA DE MUEBLES S.A.",
          referencia: `PED-${identificador_pedido}`,
          monto: total,
        },
      };
    } else if (metodo_pago === "tarjeta") {
      respuesta.instrucciones = {
        mensaje:
          "Su pago con tarjeta ha sido procesado. Recibirá una confirmación por correo.",
        estado: estado === "confirmado" ? "Pago confirmado" : "En revisión",
      };
    }

    res.status(201).json(respuesta);
  } catch (error) {
    await session.abortTransaction();
    console.error("❌ Error al crear pedido público:", error.message);

    res.status(400).json({
      success: false,
      error: error.message || "Error al crear pedido",
    });
  } finally {
    session.endSession();
  }
};

/**
 * Obtener todos los pedidos con paginación (para admin y tienda) verson 2
 */
const obtenerPedidos = async (req, res) => {
  try {
    const usuario = req.usuario;
    const {
      identificador_pedido,
      estado,
      metodo_pago,
      fecha_inicio,
      fecha_fin,
      limit = 12, // Cambiado a 12 por página
      page = 1,
      buscar,
      ordenar = "fecha_pedido",
      direccion = "desc", // 'asc' o 'desc'
    } = req.query;

    console.log(`👤 ${usuario.rol} solicitando pedidos - Página ${page}`);

    // Construir filtros según rol
    const filtro = {};

    if (usuario.rol === "tienda") {
      // Tienda solo ve pendientes y en revisión
      filtro.estado = {
        $in: [
          "comprobante_pendiente",
          "en_revision",
          "confirmado",
          "cancelado",
          "completado",
        ],
      };
    }

    if (estado) filtro.estado = estado;
    if (metodo_pago) filtro.metodo_pago = metodo_pago;
    if (identificador_pedido) {
      filtro.identificador_pedido = {
        $regex: identificador_pedido.trim(),
        $options: "i",
      };
    }

    // Filtrar por fecha
    if (fecha_inicio || fecha_fin) {
      filtro.fecha_pedido = {};
      if (fecha_inicio) {
        filtro.fecha_pedido.$gte = new Date(fecha_inicio);
      }
      if (fecha_fin) {
        const fechaFin = new Date(fecha_fin);
        fechaFin.setHours(23, 59, 59, 999);
        filtro.fecha_pedido.$lte = fechaFin;
      }
    }

    // Búsqueda
    if (buscar) {
      const busquedaRegex = new RegExp(buscar, "i");
      filtro.$or = [
        { identificador_pedido: busquedaRegex },
        { "cliente.nombre": busquedaRegex },
        { "cliente.correo": busquedaRegex },
        { "cliente.telefono": busquedaRegex }, // Agregado búsqueda por teléfono
      ];
    }

    // Validar parámetros de paginación
    const pagina = parseInt(page);
    const limite = parseInt(limit);

    if (pagina < 1 || limite < 1 || limite > 50) {
      return res.status(400).json({
        success: false,
        error: "Parámetros de paginación inválidos. Límite máximo: 50",
      });
    }

    // Calcular salto
    const skip = (pagina - 1) * limite;

    // Validar campo de ordenamiento
    const camposOrdenamientoValidos = [
      "fecha_pedido",
      "total",
      "identificador_pedido",
      "estado",
    ];
    const campoOrdenamiento = camposOrdenamientoValidos.includes(ordenar)
      ? ordenar
      : "fecha_pedido";
    const direccionOrden = direccion === "asc" ? 1 : -1;

    // Obtener total de pedidos con filtros
    const totalPedidos = await Pedido.countDocuments(filtro);
    const totalPaginas = Math.ceil(totalPedidos / limite);

    // Obtener pedidos con paginación y ordenamiento
    const pedidos = await Pedido.find(filtro)
      .sort({ [campoOrdenamiento]: direccionOrden })
      .skip(skip)
      .limit(limite)
      .lean();

    // Obtener detalles para cada pedido
    const pedidosConDetalles = await Promise.all(
      pedidos.map(async (pedido) => {
        const detalles = await PedidoDetalle.find({ id_pedido: pedido._id })
          .select(
            "nombre_producto cantidad precio_unitario subtotal imagen_url"
          )
          .lean();

        return {
          ...pedido,
          detalles: detalles || [],
        };
      })
    );

    // Información de paginación
    const tieneSiguiente = pagina < totalPaginas;
    const tieneAnterior = pagina > 1;

    res.json({
      success: true,
      pedidos: pedidosConDetalles,
      paginacion: {
        total: totalPedidos,
        pagina_actual: pagina,
        total_paginas: totalPaginas,
        limite_por_pagina: limite,
        tiene_siguiente: tieneSiguiente,
        tiene_anterior: tieneAnterior,
        inicio: skip + 1,
        fin: Math.min(skip + pedidosConDetalles.length, totalPedidos),
      },
      filtros: {
        estado,
        metodo_pago,
        fecha_inicio,
        fecha_fin,
        buscar,
        ordenar: campoOrdenamiento,
        direccion,
      },
    });
  } catch (error) {
    console.error("❌ Error al obtener pedidos:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener pedidos",
      detalles:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Obtener pedido por ID
 */
const obtenerPedidoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = req.usuario;

    console.log(`🔍 Buscando pedido: ${id}`);

    let pedido;
    if (mongoose.Types.ObjectId.isValid(id)) {
      pedido = await Pedido.findById(id);
    } else {
      pedido = await Pedido.findOne({ identificador_pedido: id.toUpperCase() });
    }

    if (!pedido) {
      return res.status(404).json({
        success: false,
        error: "Pedido no encontrado",
      });
    }

    // Verificar permisos (tienda solo ve ciertos estados)
    if (
      usuario.rol === "tienda" &&
      !["comprobante_pendiente", "en_revision", "confirmado"].includes(
        pedido.estado
      )
    ) {
      return res.status(403).json({
        success: false,
        error: "No tiene permiso para ver este pedido",
      });
    }

    // Obtener detalles
    const detalles = await PedidoDetalle.find({ id_pedido: pedido._id })
      .select("nombre_producto cantidad precio_unitario subtotal")
      .lean();

    // Obtener información de productos
    const detallesConProductos = await Promise.all(
      detalles.map(async (detalle) => {
        const producto = await Producto.findById(detalle.id_producto).select(
          "nombre categoria imagenes"
        );

        return {
          ...detalle,
          producto: producto || null,
        };
      })
    );

    res.json({
      success: true,
      pedido: {
        ...pedido.toObject(),
        detalles: detallesConProductos,
      },
    });
  } catch (error) {
    console.error("❌ Error al obtener pedido:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener pedido",
    });
  }
};

/* Actualizar estado de pedido v1
 
const actualizarEstadoPedido = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { id } = req.params;
    const { estado, notas } = req.body;
    const usuario = req.usuario;

    console.log(
      `🔄 ${usuario.rol} actualizando estado pedido ${id} a ${estado}`
    );

    // Validar estado
    const estadosValidos = [
      "comprobante_pendiente",
      "en_revision",
      "confirmado",
      "cancelado",
      "completado",
    ];
    if (!estadosValidos.includes(estado)) {
      throw new Error(`Estado inválido. Use: ${estadosValidos.join(", ")}`);
    }

    // Buscar pedido
    let pedido;
    if (mongoose.Types.ObjectId.isValid(id)) {
      pedido = await Pedido.findById(id).session(session);
    } else {
      pedido = await Pedido.findOne({
        identificador_pedido: id.toUpperCase(),
      }).session(session);
    }

    if (!pedido) {
      throw new Error("Pedido no encontrado");
    }

    // ============================================
    // MODIFICADO: TIENDA PUEDE CAMBIAR A CUALQUIER ESTADO
    // ============================================

    // Verificar permisos según rol
    if (usuario.rol === "tienda") {
      // TIENDA: Permite cualquier cambio de estado
      console.log(`🛒 Tienda cambiando estado: ${pedido.estado} → ${estado}`);
    } else if (usuario.rol === "admin") {
      // Admin puede hacer cualquier transición
      console.log(`👑 Admin cambiando estado: ${pedido.estado} → ${estado}`);

      // Si cancela sin motivo, usar motivo por defecto
      if (estado === "cancelado" && !notas) {
        notas = "Cancelado por administrador";
      }
    }

    // Registrar quién actualizo y cuándo (deshabilitado para simplificar)
    
      pedido.actualizado_por = {
        usuario: usuario.email,
        nombre: usuario.nombre || usuario.email.split("@")[0],
        rol: usuario.rol,
        fecha: new Date(),
      };

    
      pedido.historial_actualizaciones = pedido.historial_actualizaciones || [];
      pedido.historial_actualizaciones.push({
        campo: "estado",
        valor_anterior: pedido.estado,
        valor_nuevo: estado,
        usuario: usuario.email,
        nombre_usuario: usuario.nombre || usuario.email,
        rol: usuario.rol,
        fecha: new Date(),
        notas: notas || null,
      });

    // Si se completa, registrar información
    if (estado === "completado") {
      pedido.completado_info = {
        completado_por: usuario.email,
        nombre_completador: usuario.nombre || usuario.email,
        fecha_completado: new Date(),
      };
    }

    // Si se confirma y es transferencia, registrar verificación
    if (estado === "confirmado" && pedido.metodo_pago === "transferencia") {
      pedido.comprobante_info = {
        ...pedido.comprobante_info,
        verificado_por: usuario.email,
        fecha_verificacion: new Date(),
      };
    }

    // Actualizar estado
    pedido.estado = estado;
    if (notas) {
      pedido.notas = notas;
    }

    // Historial de estados
    pedido.historial_estados = pedido.historial_estados || [];
    pedido.historial_estados.push({
      estado: estado,
      fecha: new Date(),
      usuario: usuario.email,
      nombre_usuario: usuario.nombre || usuario.email,
      rol: usuario.rol,
      notas: notas || null,
    });
    

    // Si se cancela, restaurar stock
    if (estado === "cancelado") {
      await restaurarStockPedido(pedido._id, session);

      pedido.cancelacion_info = {
        motivo: notas || "Cancelado por el sistema",
        cancelado_por: usuario.email,
        nombre_cancelador: usuario.nombre || usuario.email,
        fecha_cancelacion: new Date(),
      };
    }


    await pedido.save({ session });
    await session.commitTransaction();

    console.log(
      `✅ Estado actualizado por ${usuario.nombre || usuario.email} (${
        usuario.rol
      }): ${pedido.identificador_pedido} → ${estado}`
    );

    // Formato para respuesta
    const fechaActualizacion = new Date().toLocaleString("es-HN", {
      timeZone: "America/Tegucigalpa",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    res.json({
      success: true,
      message: `Estado del pedido actualizado a ${estado}`,
      actualizacion: {
        fecha: fechaActualizacion,
        usuario: usuario.nombre || usuario.email,
        rol: usuario.rol,
        estado_anterior:
          pedido.historial_estados.length > 1
            ? pedido.historial_estados[pedido.historial_estados.length - 2]
                .estado
            : "nuevo",
        estado_nuevo: estado,
      },
      pedido: {
        identificador_pedido: pedido.identificador_pedido,
        estado: pedido.estado,
        cliente: pedido.cliente,
        total: pedido.total,
        metodo_pago: pedido.metodo_pago,
        actualizado_por: pedido.actualizado_por,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("❌ Error al actualizar estado:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Error al actualizar estado",
    });
  } finally {
    session.endSession();
  }
};

*/


/**
 * Actualizar estado de pedido v2
 */
const actualizarEstadoPedido = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { id } = req.params;
    const { estado, notas } = req.body;
    const usuario = req.usuario;

    console.log(
      `🔄 ${usuario.rol} actualizando estado pedido ${id} a ${estado}`
    );

    // Validar estado
    const estadosValidos = [
      "comprobante_pendiente",
      "en_revision",
      "confirmado",
      "cancelado",
      "completado",
    ];
    if (!estadosValidos.includes(estado)) {
      throw new Error(`Estado inválido. Use: ${estadosValidos.join(", ")}`);
    }

    // Buscar pedido
    let pedido;
    if (mongoose.Types.ObjectId.isValid(id)) {
      pedido = await Pedido.findById(id).session(session);
    } else {
      pedido = await Pedido.findOne({
        identificador_pedido: id.toUpperCase(),
      }).session(session);
    }

    if (!pedido) {
      throw new Error("Pedido no encontrado");
    }

    // ============================================
    // MODIFICADO: TIENDA PUEDE CAMBIAR A CUALQUIER ESTADO
    // ============================================

    // Verificar permisos según rol
    if (usuario.rol === "tienda") {
      // TIENDA: Permite cualquier cambio de estado
      console.log(`🛒 Tienda cambiando estado: ${pedido.estado} → ${estado}`);
    } else if (usuario.rol === "admin") {
      // Admin puede hacer cualquier transición
      console.log(`👑 Admin cambiando estado: ${pedido.estado} → ${estado}`);
      console.log(`Notas de actualización: ${notas || 'N/A'}`);

      // Si cancela sin motivo, usar motivo por defecto
      if (estado === "cancelado" && !notas) {
        notas = "Cancelado por administrador";
      }
    }

    // Registrar quién actualizó y cuándo (versión simplificada)
    pedido.actualizado_por = {
      usuario: usuario.email,
      nombre: usuario.nombre || usuario.email.split("@")[0],
      rol: usuario.rol,
      fecha: new Date(),
    };

    // Actualizar estado
    pedido.estado = estado;
    
    // Actualizar notas si se proporcionan
    if (notas && notas.trim() !== '') {
      pedido.notas = notas;
    }

    // Si se completa, registrar información básica
    if (estado === "completado") {
      pedido.completado_info = {
        completado_por: usuario.email,
        nombre_completador: usuario.nombre || usuario.email,
        fecha_completado: new Date(),
      };
    }

    // Si se confirma y es transferencia, registrar verificación básica
    if (estado === "confirmado" && pedido.metodo_pago === "transferencia") {
      pedido.comprobante_info = {
        motivo:notas || "",
        ...pedido.comprobante_info,
        verificado_por: usuario.email,
        fecha_verificacion: new Date(),
      };
    }

    // Si se cancela, restaurar stock
    if (estado === "cancelado") {
      await restaurarStockPedido(pedido._id, session);

      pedido.cancelacion_info = {
        motivo: notas || "Cancelado por el sistema",
        cancelado_por: usuario.email,
        nombre_cancelador: usuario.nombre || usuario.email,
        fecha_cancelacion: new Date(),
      };
    }

    await pedido.save({ session });
    await session.commitTransaction();

    console.log(
      `✅ Estado actualizado por ${usuario.nombre || usuario.email} (${
        usuario.rol
      }): ${pedido.identificador_pedido} → ${estado}: Notas: ${notas || 'N/A'}`
    );

    // Formato para respuesta
    const fechaActualizacion = new Date().toLocaleString("es-HN", {
      timeZone: "America/Tegucigalpa",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    res.json({
      success: true,
      message: `Estado del pedido actualizado a ${estado}`,
      actualizacion: {
        fecha: fechaActualizacion,
        usuario: usuario.nombre || usuario.email,
        rol: usuario.rol,
        estado_anterior: pedido.estado_anterior || "nuevo",
        estado_nuevo: estado,
        notas: notas || null,
      },
      pedido: {
        identificador_pedido: pedido.identificador_pedido,
        estado: pedido.estado,
        cliente: pedido.cliente,
        total: pedido.total,
        metodo_pago: pedido.metodo_pago,
        actualizado_por: pedido.actualizado_por,
        notas: pedido.notas,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("❌ Error al actualizar estado:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Error al actualizar estado",
    });
  } finally {
    session.endSession();
  }
};

// Función auxiliar para enviar notificaciones
async function enviarNotificacionEstadoPedido(pedido, usuario) {
  // Aquí implementarías el envío de notificaciones
  // Por ejemplo: email, WhatsApp, etc.

  const mensajes = {
    confirmado: `Su pedido ${pedido.identificador_pedido} ha sido confirmado y está en proceso de preparación.`,
    completado: `¡Felicidades! Su pedido ${pedido.identificador_pedido} ha sido completado y entregado.`,
    cancelado: `Su pedido ${
      pedido.identificador_pedido
    } ha sido cancelado. Motivo: ${
      pedido.cancelacion_info?.motido || "No especificado"
    }`,
  };

  if (mensajes[pedido.estado]) {
    console.log(
      `📧 Notificación enviada para pedido ${pedido.identificador_pedido}: ${
        mensajes[pedido.estado]
      }`
    );
  }
}

// ========== FUNCIONES AUXILIARES ==========

/**
 * Cancelar pedido
 */
const cancelarPedido = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const { id } = req.params;
    const { motivo } = req.body;
    const usuario = req.usuario;

    console.log(`❌ ${usuario.rol} cancelando pedido: ${id}`);

    // Buscar pedido
    let pedido;
    if (mongoose.Types.ObjectId.isValid(id)) {
      pedido = await Pedido.findById(id).session(session);
    } else {
      pedido = await Pedido.findOne({
        identificador_pedido: id.toUpperCase(),
      }).session(session);
    }

    if (!pedido) {
      throw new Error("Pedido no encontrado");
    }

    // Verificar que no esté ya cancelado
    if (pedido.estado === "cancelado") {
      throw new Error("El pedido ya está cancelado");
    }

    // Verificar que no esté completado
    if (pedido.estado === "completado") {
      throw new Error("No se puede cancelar un pedido completado");
    }

    // Restaurar stock
    await restaurarStockPedido(pedido._id, session);

    // Actualizar pedido
    pedido.estado = "cancelado";
    pedido.cancelacion_info = {
      motivo: motivo || "Cancelado por administrador",
      cancelado_por: usuario.email,
      fecha_cancelacion: new Date(),
    };

    // Registrar actualización
    pedido.actualizado_por = {
      usuario: usuario.email,
      rol: usuario.rol,
      fecha: new Date(),
    };

    await pedido.save({ session });
    await session.commitTransaction();

    console.log(`✅ Pedido cancelado: ${pedido.identificador_pedido}`);

    res.json({
      success: true,
      message: "Pedido cancelado exitosamente",
      pedido: {
        identificador_pedido: pedido.identificador_pedido,
        estado: pedido.estado,
        cliente: pedido.cliente,
        total: pedido.total,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("❌ Error al cancelar pedido:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Error al cancelar pedido",
    });
  } finally {
    session.endSession();
  }
};

/**
 * Restaurar stock al cancelar pedido
 */
async function restaurarStockPedido(idPedido, session) {
  try {
    const detalles = await PedidoDetalle.find({ id_pedido: idPedido }).session(
      session
    );

    for (const detalle of detalles) {
      const producto = await Producto.findById(detalle.id_producto).session(
        session
      );
      if (producto) {
        producto.stock += detalle.cantidad;
        await producto.save({ session });
      }
    }

    console.log(`📦 Stock restaurado para pedido: ${idPedido}`);
  } catch (error) {
    console.error("Error al restaurar stock:", error);
    throw error;
  }
}
// ============================================
//     OBTENER TOTAL DE PEDIDOS POR MES (MEJORADO)
// ============================================
const obtenerTotalPedidosPorMes = async (req, res) => {
  try {
    const { fecha } = req.query; // Aceptar fecha completa (YYYY-MM-DD)
    const usuario = req.usuario;

    let fechaConsulta;

    // Si se proporciona fecha, usarla; si no, usar fecha actual
    if (fecha) {
      fechaConsulta = new Date(fecha);
      if (isNaN(fechaConsulta.getTime())) {
        return res.status(400).json({
          success: false,
          error: "Formato de fecha inválido. Use YYYY-MM-DD",
        });
      }
    } else {
      fechaConsulta = new Date();
    }

    // Calcular rango de fechas del mes
    const añoConsulta = fechaConsulta.getFullYear();
    const mesConsulta = fechaConsulta.getMonth(); // 0-11

    const primerDiaMes = new Date(añoConsulta, mesConsulta, 1);
    const ultimoDiaMes = new Date(añoConsulta, mesConsulta + 1, 0);
    ultimoDiaMes.setHours(23, 59, 59, 999);

    // Construir filtro
    const filtro = {
      fecha_pedido: {
        $gte: primerDiaMes,
        $lte: ultimoDiaMes,
      },
    };

    // Filtrar por rol si es necesario
    if (usuario.rol === "tienda") {
      filtro.estado = {
        $in: [
          "comprobante_pendiente",
          "en_revision",
          "confirmado",
          "cancelado",
          "completado",
        ],
      };
    }

    // Obtener solo el total
    const totalPedidos = await Pedido.countDocuments(filtro);

    res.json({
      success: true,
      totalPedidos,
      periodo: {
        año: añoConsulta,
        mes: mesConsulta,
        mesNombre: primerDiaMes.toLocaleDateString("es-HN", { month: "long" }),
        rango_inicio: primerDiaMes,
        rango_fin: ultimoDiaMes,
      },
    });
  } catch (error) {
    console.error("❌ Error al obtener total de pedidos por mes:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener total de pedidos",
    });
  }
};

// ============================================
//     OBTENER TOTAL DE VENTAS POR MES
// ============================================
const obtenerTotalVentasPorMes = async (req, res) => {
  try {
    const { fecha } = req.query;
    const usuario = req.usuario;

    let fechaConsulta;

    if (fecha) {
      fechaConsulta = new Date(fecha);
      if (isNaN(fechaConsulta.getTime())) {
        return res.status(400).json({
          success: false,
          error: "Formato de fecha inválido",
        });
      }
    } else {
      fechaConsulta = new Date();
    }

    // Calcular rango de fechas del mes
    const añoConsulta = fechaConsulta.getFullYear();
    const mesConsulta = fechaConsulta.getMonth();

    const primerDiaMes = new Date(añoConsulta, mesConsulta, 1);
    const ultimoDiaMes = new Date(añoConsulta, mesConsulta + 1, 0);
    ultimoDiaMes.setHours(23, 59, 59, 999);

    // Construir filtro (solo pedidos confirmados)
    const filtro = {
      fecha_pedido: {
        $gte: primerDiaMes,
        $lte: ultimoDiaMes,
      },
      estado: "confirmado", // Solo pedidos confirmados para ventas
    };

    // Si es tienda, puede ver más estados
    if (usuario.rol === "tienda") {
      filtro.estado = {
        $in: ["confirmado", "completado", "entregado"],
      };
    }

    // Obtener total de ventas (suma de todos los pedidos confirmados)
    const resultado = await Pedido.aggregate([
      { $match: filtro },
      {
        $group: {
          _id: null,
          totalVentas: { $sum: "$total" },
          cantidadPedidos: { $sum: 1 },
        },
      },
    ]);

    const totalVentas = resultado.length > 0 ? resultado[0].totalVentas : 0;
    const cantidadPedidos =
      resultado.length > 0 ? resultado[0].cantidadPedidos : 0;

    res.json({
      success: true,
      totalVentas,
      cantidadPedidos,
      periodo: {
        año: añoConsulta,
        mes: mesConsulta,
        mesNombre: primerDiaMes.toLocaleDateString("es-HN", { month: "long" }),
      },
    });
  } catch (error) {
    console.error("❌ Error al obtener total de ventas por mes:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener total de ventas",
    });
  }
};

const obtenerVentasPorDia = async (req, res) => {
  try {
    const { fecha } = req.query;

    if (!fecha) {
      return res
        .status(400)
        .json({ success: false, message: "Fecha requerida" });
    }

    const inicio = new Date(`${fecha}T00:00:00`);
    const fin = new Date(`${fecha}T23:59:59.999`);

    const pedidos = await Pedido.find({
      estado: "confirmado",
      fecha_pedido: { $gte: inicio, $lte: fin },
    });

    const total = pedidos.reduce((sum, p) => sum + (p.total || 0), 0);

    res.json({
      success: true,
      fecha,
      totalVentas: total,
      totalPedidos: pedidos.length,
    });
  } catch (error) {
    console.error("Error ventas por día:", error);
    res.status(500).json({ success: false, message: "Error interno" });
  }
};

// Exportar funciones
module.exports = {
  crearPedidoPublico,
  obtenerPedidos,
  obtenerPedidoPorId,
  actualizarEstadoPedido,
  cancelarPedido,
  obtenerTotalPedidosPorMes,
  obtenerTotalVentasPorMes,
  obtenerVentasPorDia,
};
