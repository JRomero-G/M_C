// ============================================
//     CONFIGURACIÓN
// ============================================

// ============================================
//     VARIABLES GLOBALES
// ============================================
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
//let envioCosto = parseFloat(localStorage.getItem("costo_envio")) || 0;
//let tipoEnvio = localStorage.getItem("tipo_envio") || "Recoger en tienda";
let facturaDescargada = false; // Nueva variable para rastrear si se intentó descargar
let costo_envio = 0;

// ============================================
//     INICIALIZACIÓN
// ============================================

// Modifica tu evento DOMContentLoaded:
document.addEventListener("DOMContentLoaded", function () {
  /*PRUEBAS */
  console.log("📦 Datos cargados:", {
    productos: carrito.length,
    //envioCosto: envioCosto,
    //tipoEnvio: tipoEnvio,
  });

  // Verificar si hay un modal pendiente
  verificarModalPendiente();

  // Verificar que hay productos en el carrito
  if (carrito.length === 0) {
    mostrarNotificacionFacturacion('error', 'No hay productos en el carrito');
    setTimeout(() => {
      window.location.href = "../Pages/Carrito.html";
    }, 2000);
    return;
  }
  
  // Mostrar notificación de bienvenida
  mostrarNotificacionFacturacion('info', ` ${carrito.length} producto(s) listos para facturar`);
  

  calcularResumen();
  configurarEventos();
  configurarSelectEnvio();
});

// ============================================
//     ACTUALIZAR INFORMACIÓN DE ENVÍO EN PANTALLA
// ============================================
function actualizarInfoEnvio() {
  const ciudadInput = document.getElementById("ciudadCliente");
  const direccionInput = document.getElementById("direccionCliente");

  // Si es recoger en tienda, los campos de dirección no son obligatorios
  if (costo_envio === 0) {
    if (ciudadInput) {
      ciudadInput.required = false;
      ciudadInput.placeholder = "Opcional (solo para envíos)";
    }
    if (direccionInput) {
      direccionInput.required = false;
      direccionInput.placeholder = "Opcional (solo para envíos)";
    }

    // Mostrar mensaje informativo
    const mensajeEnvio = document.createElement("div");
    mensajeEnvio.className = "info-envio";
    mensajeEnvio.innerHTML = `
            <p><i class="fas fa-info-circle"></i> <strong>Recoger en tienda:</strong> 
            Puedes recoger tu pedido en nuestra tienda física.</p>
        `;

    const formulario = document.querySelector(".formulario");
    if (formulario) {
      formulario.insertBefore(
        mensajeEnvio,
        formulario.querySelector("h2:nth-of-type(2)"),
      );
    }
  }
}

function configurarSelectEnvio() {
  const envioSelect = document.getElementById("tipoEnvio");
  const opcion1 = document.getElementById("Recoger");
  const opcion2 = document.getElementById("Envio-estandar");
  const opcion3 = document.getElementById("Envio-express");

  if (envioSelect) {
    // Configurar valores para cada opción
    if (opcion1) opcion1.value = "0";
    if (opcion2) opcion2.value = "670";
    if (opcion3) opcion3.value = "1400";

    // Establecer valor por defecto si no hay uno guardado
    if (costo_envio === 0) {
      envioSelect.value = "0"; // Recoger en tienda por defecto
    } else {
      envioSelect.value = costo_envio.toString();
    }

    // Evento para actualizar cuando cambia la selección
    envioSelect.addEventListener("change", function () {
      const nuevoCosto = parseFloat(this.value) || 0;
      const opcionTexto = this.options[this.selectedIndex]?.text;
      
      costo_envio = nuevoCosto;

      calcularResumen();
      mostrarNotificacionFacturacion('info', 
        `Método de entrega: ${opcionTexto} - Costo: HNL ${nuevoCosto.toFixed(2)}`
      );
    });

    // Llamar a actualizarResumen inicialmente
    calcularResumen();
  }
}

// ============================================
//     FUNCIONES DE RESUMEN
// ============================================

function calcularResumen() {
  const subtotal = carrito.reduce((t, p) => t + p.precio * p.cantidad, 0);
  const impuestos = subtotal * 0.15; // IVA 15% en Honduras\

  // Obtener costo de envío del select
  const envioSelect = document.getElementById("tipoEnvio");
  if (envioSelect) {
    // Actualizar variable global con el valor seleccionado
    costo_envio = parseFloat(envioSelect.value) || 0;

    console.log(
      "📦 Costo de envío actualizado:",
      costo_envio,
      "tipo:",
      envioSelect.options[envioSelect.selectedIndex]?.text,
    );
  }
  const total = subtotal + costo_envio + impuestos;

  document.getElementById("resumenSubtotal").textContent =
    `HNL ${subtotal.toFixed(2)}`;
  document.getElementById("resumenImpuestos").textContent =
    `HNL ${impuestos.toFixed(2)}`;
  document.getElementById("resumenTotal").textContent = `HNL ${total.toFixed(
    2,
  )}`;

  console.log("💰 Resumen calculado:", {
    subtotal: subtotal,
    envio: costo_envio,
    impuestos: impuestos,
    total: total,
  });

  return { subtotal, impuestos, total };
}

// ============================================
//     CONFIGURAR EVENTOS
// ============================================
function configurarEventos() {
  // Cambiar entre métodos de pago
  const radiosPago = document.querySelectorAll("input[name='pago']");
  const bloqueTransferencia = document.getElementById("bloqueTransferencia");
  const bloqueTarjeta = document.getElementById("bloqueTarjeta");

  radiosPago.forEach((r) => {
    r.addEventListener("change", function () {
      if (this.value === "transferencia") {
        if (bloqueTransferencia) bloqueTransferencia.style.display = "block";
        if (bloqueTarjeta) bloqueTarjeta.style.display = "none";
      } else {
        if (bloqueTransferencia) bloqueTransferencia.style.display = "none";
        if (bloqueTarjeta) bloqueTarjeta.style.display = "block";
      }
    });
  });

  // Mostrar transferencia por defecto
  if (bloqueTransferencia) bloqueTransferencia.style.display = "block";

  // Botón Confirmar Pedido
  document
    .getElementById("btnConfirmarCompra")
    .addEventListener("click", function (e) {
      e.preventDefault();
      confirmarPedido();
    });

  // Botón Volver
  document.getElementById("btn-volver").addEventListener("click", function () {
    window.location.href = "../Pages/Carrito.html";
  });
}

// ============================================
//     CONFIRMAR PEDIDO - ACTUALIZADO PARA ENVÍO
// ============================================
async function confirmarPedido() {
  // Obtener datos del formulario
  const nombre = document.getElementById("nombreCliente").value.trim();
  const correo = document.getElementById("correoCliente").value.trim();
  const telefono = document.getElementById("telefonoCliente").value.trim();
  const ciudad = document.getElementById("ciudadCliente").value.trim();
  const direccion = document.getElementById("direccionCliente").value.trim();
  const metodoPago = document.querySelector("input[name='pago']:checked").value;

  // Validaciones básicas
  if (!nombre || !correo || !telefono) {
    mostrarNotificacionFacturacion('warning', 
      'Completa los campos obligatorios: Nombre, Correo y Teléfono'
    );
    return;
  }

  // Validar correo
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(correo)) {
    mostrarNotificacionFacturacion('error', 'Por favor ingresa un correo electrónico válido.');
    return;
  }

  // Si hay costo de envío, validar dirección
  let direccionCompleta = "";
  if (costo_envio > 0) {
    if (!ciudad || !direccion) {
      mostrarNotificacionFacturacion('warning', 
        'Para envío a domicilio, completa los campos de Ciudad y Dirección.'
      );
      return;
    }
    direccionCompleta = `${direccion}, ${ciudad}`;
  } else {
    // Si es recoger en tienda, usar dirección por defecto o vacía
    direccionCompleta = ciudad || "Recoger en tienda";
  }

  // Determinar tipo de envío para el backend
  let tipoEnvioBackend = "recogida";
  if (costo_envio === 670) {
    tipoEnvioBackend = "domicilio";
  } else if (costo_envio === 1400) {
    tipoEnvioBackend = "domicilio";
  }

  // Preparar datos para el backend
  const datosPedido = {
    cliente: {
      nombre: nombre,
      correo: correo,
      telefono: telefono,
    },
    metodo_pago: metodoPago,
    envio_info: {
      tipo: tipoEnvioBackend, // Cambiado para enviar tipo específico
      costo_extra: costo_envio, // ¡ESTO ES IMPORTANTE!
      direccion: direccionCompleta,
      estado: "pendiente",
    },
    carrito: carrito.map((item) => ({
      id_producto: item.id,
      cantidad: item.cantidad,
    })),
    notas: `Ciudad: ${
      ciudad || "Recoger en tienda"
    } | Tipo envío: ${tipoEnvio}`,
  };

  console.log("📤 Enviando pedido al backend:", datosPedido);
  
  const notifCarga = mostrarNotificacionCarga('🔄 Procesando tu pedido...');

  console.log("💰 Costo de envío incluido:", costo_envio);

  // Deshabilitar botón durante el envío
  const btnConfirmar = document.getElementById("btnConfirmarCompra");
  const textoOriginal = btnConfirmar.innerHTML;
  btnConfirmar.disabled = true;
  btnConfirmar.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> Procesando...';

  try {
    // Enviar al backend
    const response = await fetch(`${BACKEND_URL}/pedidos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datosPedido),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Error al procesar el pedido");
    }

    ocultarNotificacionCarga(notifCarga);
    console.log("✅ Pedido creado exitosamente:", result);

    mostrarNotificacionFacturacion('success', 
      `✅ ¡Pedido #${result.pedido.identificador_pedido} creado exitosamente!`
    );
    console.log("💰 Costo de envío registrado:", result.pedido?.total);

    // Mostrar confirmación con datos del pedido
    mostrarConfirmacionExitosa(result);
  } catch (error) {
    ocultarNotificacionCarga(notifCarga);
    mostrarNotificacionFacturacion('error', `❌ ${error.message || "Error al procesar el pedido"}`);
  } finally {
    // Restaurar botón
    btnConfirmar.disabled = false;
    btnConfirmar.innerHTML = textoOriginal;
  }
}

// ============================================
//     MOSTRAR CONFIRMACIÓN - ACTUALIZADO PARA MOSTRAR ENVÍO
// ============================================
function mostrarConfirmacionExitosa(resultado) {
  const pedido = resultado.pedido;
  const instrucciones = resultado.instrucciones;

  // AGREGAR ESTA LÍNEA: Asignar el pedido al scope global
  window.pedidoFacturacion = pedido;

  // Guardar estado del pedido en localStorage
  localStorage.setItem(
    "pedidoConfirmado",
    JSON.stringify({
      pedido: pedido,
      instrucciones: instrucciones,
      timestamp: new Date().getTime(),
      facturaDescargada: false,
      // También guardar el pedido como string para recuperarlo
      pedidoData: JSON.stringify(pedido),
    }),
  );

  // Guardar también información del carrito para limpiar después
  localStorage.setItem("carritoPendienteLimpiar", JSON.stringify(carrito));

  // Obtener tipo de envío para mostrar
  let textoEnvio = "";
  if (costo_envio === 0) {
    textoEnvio = "Recoger en tienda";
  } else if (costo_envio === 670) {
    textoEnvio = "Envío estándar";
  } else if (costo_envio === 1400) {
    textoEnvio = "Envío express";
  }

  // Crear modal de confirmación
  const modalHTML = `
        <div id="modalConfirmacion" class="modal-confirmacion">
            <div class="modal-contenido">
                <div class="modal-header">
                    <h2><i class="fas fa-check-circle"></i> ¡Pedido Confirmado!</h2>
                    <button class="cerrar-modal">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="confirmacion-exitosa">
                        <div class="icono-exito">
                            <i class="fas fa-check"></i>
                        </div>
                        
                        <h3>Pedido N°: <span class="pedido-id">${
                          pedido.identificador_pedido
                        }</span></h3>
                        <p class="mensaje-exito">Tu pedido ha sido registrado exitosamente.</p>
                        
                        <div class="info-transferencia">
                            <h4><i class="fas fa-university"></i> Instrucciones para Transferencia</h4>
                            <div class="datos-bancarios">
                            <h4><i class="fas fa-university"></i> Bancos Disponibles</h4>
                                <p><strong>BANCO ATLANTIDA</strong> </p>
                                <p><strong>Cuenta:</strong> ${
                                  EMPRESA_INFO.cuentasBancarias[0].cuenta
                                }</p>
                                <p><strong>Titular:</strong> ${
                                  EMPRESA_INFO.cuentasBancarias[0].titular
                                }</p>
                                <p><strong>BANCO DE OCCIDENTE</strong></p>
                                <p><strong>Cuenta:</strong> ${
                                  EMPRESA_INFO.cuentasBancarias[1].cuenta
                                }</p>
                                <p><strong>Titular:</strong> ${
                                  EMPRESA_INFO.cuentasBancarias[1].titular
                                }</p>
                                <p><strong>Referencia:</strong> PED-${
                                  pedido.identificador_pedido
                                }</p>
                                <p><strong>Monto a Transferir:</strong> HNL ${pedido.total.toFixed(
                                  2,
                                )}</p>
                            </div>
                            <p class="advertencia">
                                <i class="fas fa-exclamation-triangle"></i>
                                <strong>IMPORTANTE:</strong> Envía el comprobante al WhatsApp: ${
                                  EMPRESA_INFO.whatsapp
                                }
                            </p>
                        </div>
                        
                        <div class="resumen-confirmacion">
                            <h4><i class="fas fa-receipt"></i> Resumen del Pedido</h4>
                            <div class="resumen-detalles">
                                <div class="resumen-linea">
                                    <span>Cliente:</span>
                                    <span>${pedido.cliente.nombre}</span>
                                </div>
                                <div class="resumen-linea">
                                    <span>Correo:</span>
                                    <span>${pedido.cliente.correo}</span>
                                </div>
                                <div class="resumen-linea">
                                    <span>Telefono:</span>
                                    <span>${pedido.cliente.telefono}</span>
                                </div>
                                <div class="resumen-linea">
                                    <span>Tipo de entrega:</span>
                                    <span>${textoEnvio}</span>
                                </div>
                                <div class="resumen-linea">
                                    <span>Costo de envío:</span>
                                    <span>HNL ${costo_envio.toFixed(2)}</span>
                                </div>
                                <div class="resumen-linea">
                                    <span>Total:</span>
                                    <span>HNL ${pedido.total.toFixed(2)}</span>
                                </div>
                                <div class="resumen-linea">
                                    <span>Estado:</span>
                                    <span class="estado-pedido">${
                                      pedido.estado
                                    }</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Mensaje de recordatorio -->
                        <div id="mensajeRecordatorio" class="mensaje-recordatorio" style="display: none;">
                            <div class="recordatorio-contenido">
                                <i class="fas fa-exclamation-triangle"></i>
                                <div>
                                    <strong>¡Descarga la factura!</strong>
                                    <p>Necesitas la factura para realizar el pago y saber dónde enviar el comprobante.</p>
                                    <p><small>Puedes descargarla cuantas veces necesites.</small></p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="acciones-confirmacion">
                            <button type="button" id="btnDescargarPDF" class="btn-pdf">
                                <i class="fas fa-file-pdf"></i> Descargar Factura (PDF)
                            </button>
                            <button type="button" id="btnVolverInicio" class="btn-inicio">
                                <i class="fas fa-home"></i> Volver al Inicio
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Agregar modal al DOM
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Configurar eventos del modal
  const modal = document.getElementById("modalConfirmacion");
  const cerrarBtn = modal.querySelector(".cerrar-modal");
  const mensajeRecordatorio = modal.querySelector("#mensajeRecordatorio");

  // Función para mostrar mensaje de advertencia
  function mostrarAdvertencia() {
    if (!facturaDescargada) {
      mensajeRecordatorio.style.display = "block";

      // Agregar animación de sacudida
      mensajeRecordatorio.style.animation = "shake 0.5s ease-in-out";
      setTimeout(() => {
        mensajeRecordatorio.style.animation = "";
      }, 500);

      return true; // Indica que se mostró advertencia
    }
    return false; // No se mostró advertencia
  }

  // Función para cerrar modal con validación
  
  function intentarCerrarModal() {
    if (!facturaDescargada) {
      mostrarNotificacionFacturacion('warning', 
        'Por favor, descarga la factura antes de salir. Es necesaria para realizar el pago.'
      );
      return false;
    }
    cerrarModal();
    return true;
  }

  // Función para cerrar el modal
  function cerrarModal() {
    const modal = document.getElementById("modalConfirmacion");
    if (modal) {
      modal.remove();
    }

    // Limpiar datos persistentes
    limpiarEstadoModal();

    // Limpiar carrito
    limpiarDatos();
    window.location.href = "../index.html";
  }

  // Nueva función para limpiar estado del modal
  function limpiarEstadoModal() {
    localStorage.removeItem("pedidoConfirmado");
    localStorage.removeItem("carritoPendienteLimpiar");
  }

  // Evento para el botón cerrar (X)
  cerrarBtn.addEventListener("click", intentarCerrarModal);

  // Evento para hacer clic fuera del modal
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      if (intentarCerrarModal()) {
        // El modal se cerrará desde la función intentarCerrarModal
      }
    }
  });

  /* Botón Descargar PDF - MEJORADO PARA MÚLTIPLES DESCARGAS v1
  document.getElementById("btnDescargarPDF").addEventListener("click", () => {
    descargarFacturaCliente(pedido, () => {
      // Callback que se ejecuta después de generar el PDF
      facturaDescargada = true; // Marcar que se intentó descargar la factura

      // Actualizar el botón para mostrar que ya se descargó al menos una vez
      const btnPDF = document.getElementById("btnDescargarPDF");
      btnPDF.innerHTML =
        '<i class="fas fa-check"></i> Factura Descargada (Puedes descargar nuevamente)';
      btnPDF.style.background = "#27ae60";

      // Ocultar mensaje de recordatorio si está visible
      mensajeRecordatorio.style.display = "none";

      // Agregar un pequeño delay y luego cambiar de nuevo a rojo para indicar que se puede descargar otra vez
      setTimeout(() => {
        btnPDF.style.background = "#e74c3c";
        btnPDF.innerHTML =
          '<i class="fas fa-redo"></i> Descargar Factura Nuevamente';
      }, 1000);
    });
  });
*/

  // Botón Volver al Inicio
  document.getElementById("btnVolverInicio").addEventListener("click", () => {
    if (!facturaDescargada) {
      if (mostrarAdvertencia()) {
        return; // No continuar si se mostró advertencia
      }
    }
    cerrarModal();
  });

  // Mostrar modal
  modal.style.display = "flex";
}

function verificarModalPendiente() {
  const pedidoConfirmado = JSON.parse(localStorage.getItem("pedidoConfirmado"));

  if (pedidoConfirmado) {
    // Verificar si el pedido es reciente (menos de 30 minutos)
    const tiempoTranscurrido =
      new Date().getTime() - pedidoConfirmado.timestamp;
    const treintaMinutos = 30 * 60 * 1000;

    if (tiempoTranscurrido < treintaMinutos) {
      // AGREGAR ESTA LÍNEA: Restaurar el pedido en el scope global
      window.pedidoFacturacion = JSON.parse(
        JSON.stringify(pedidoConfirmado.pedido),
      );

      // Restaurar el carrito si está guardado
      if (pedidoConfirmado.carrito) {
        console.log("🛒 Restaurando carrito desde localStorage");
        // No sobreescribimos carrito global, pero lo tenemos como referencia
      }

      mostrarNotificacionFacturacion('info', 
        '🔄 Recuperando pedido pendiente...'
      );
      
      mostrarConfirmacionExitosa({
        pedido: pedidoConfirmado.pedido,
        instrucciones: pedidoConfirmado.instrucciones,
      });

      // Restaurar el estado de descarga si es necesario
      facturaDescargada = pedidoConfirmado.facturaDescargada || false;
    } else {
      // Limpiar si ha pasado mucho tiempo
      limpiarEstadoModal();
    }
  }
}

// ============================================
//     LIMPIAR CARRITO
// ============================================
function limpiarDatos() {
  localStorage.removeItem("carrito");
  localStorage.removeItem("carrito_total");
  localStorage.removeItem("costo_envio");
  localStorage.removeItem("tipo_envio");
  carrito = [];
  costo_envio = 0;
  tipoEnvio = "";

  // Actualizar badge en otras pestañas si existe la función
  if (typeof actualizarContadorCarritoGlobal === "function") {
    actualizarContadorCarritoGlobal();
  }
}

// ============================================
//     FUNCIONES DE MENSAJES
// ============================================

// ============================================
//     SISTEMA DE NOTIFICACIONES UNIFICADO
// ============================================

// ELIMINA las funciones 'mostrarError' y 'mostrarExito' completamente
// y REEMPLAZA con estas:

function mostrarNotificacionFacturacion(tipo = 'info', mensaje = null) {
  // Eliminar notificaciones existentes para evitar acumulación
  const notificacionesExistentes = document.querySelectorAll('.carrito-notificacion');
  notificacionesExistentes.forEach(notif => notif.remove());
  
  // Mapeo de tipos a configuraciones
  const config = {
    success: {
      icono: '<i class="fas fa-check-circle"></i>',
      defaultMsg: 'Operación completada exitosamente'
    },
    error: {
      icono: '<i class="fas fa-exclamation-triangle"></i>',
      defaultMsg: 'Error al procesar la solicitud'
    },
    warning: {
      icono: '<i class="fas fa-exclamation-triangle"></i>',
      defaultMsg: 'Verifica la información'
    },
    info: {
      icono: '<i class="fas fa-info-circle"></i>',
      defaultMsg: 'Información actualizada'
    }
  };
  
  const cfg = config[tipo] || config.info;
  const texto = mensaje || cfg.defaultMsg;
  
  // Crear notificación
  const notificacion = document.createElement('div');
  notificacion.className = `carrito-notificacion ${tipo}`;
  notificacion.innerHTML = `${cfg.icono}<span>${texto}</span>`;
  
  document.body.appendChild(notificacion);
  
  // Auto-eliminar después de 3 segundos
  setTimeout(() => {
    if (notificacion && notificacion.parentNode) {
      notificacion.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => {
        if (notificacion && notificacion.parentNode) {
          notificacion.remove();
        }
      }, 300);
    }
  }, 3000);
}

// Función para notificaciones de carga
function mostrarNotificacionCarga(mensaje = 'Procesando...') {
  const notificacion = document.createElement('div');
  notificacion.className = 'carrito-notificacion info';
  notificacion.innerHTML = `<i class="fas fa-spinner fa-pulse"></i><span>${mensaje}</span>`;
  document.body.appendChild(notificacion);
  return notificacion;
}

function ocultarNotificacionCarga(notificacion) {
  if (notificacion && notificacion.parentNode) {
    notificacion.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notificacion.remove(), 300);
  }
}

function descargarFacturaCliente(pedido, callback) {
  console.log("📄 Descargando factura cliente...", pedido);

  // CLONAR el pedido para no modificar el original
  const pedidoParaPDF = { ...pedido };

  // Verificar que el pedido tenga la estructura mínima
  if (!pedidoParaPDF.identificador_pedido && !pedidoParaPDF.id) {
    // Crear un ID temporal
    pedidoParaPDF.identificador_pedido = "PED-" + Date.now();
  }

  // Configuración para cliente
  const config = {
    tipo: "factura",
    mostrarInstruccionesPago: true,
    mostrarIVA: true,
    mostrarNotas: true,
    tituloPersonalizado: "FACTURA DE COMPRA",
    callback: callback,
  };

  // CORRECCIÓN: Verificar si productos es un array válido
  console.log("🔍 Analizando estructura de productos:", {
    productos: pedidoParaPDF.productos,
    tipo: typeof pedidoParaPDF.productos,
    esArray: Array.isArray(pedidoParaPDF.productos),
    longitud: Array.isArray(pedidoParaPDF.productos)
      ? pedidoParaPDF.productos.length
      : "no es array",
  });

  // Si productos no es un array válido o está vacío, usar el carrito
  if (
    !pedidoParaPDF.productos ||
    !Array.isArray(pedidoParaPDF.productos) ||
    pedidoParaPDF.productos.length === 0
  ) {
    console.log("🛒 Usando productos del carrito local");

    // Asegurarse de que carrito existe y tiene elementos
    if (carrito && carrito.length > 0) {
      pedidoParaPDF.productos = carrito.map((item) => ({
        nombre_producto: item.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal: item.precio * item.cantidad,
      }));
    } else {
      // Si no hay carrito, crear un array vacío
      pedidoParaPDF.productos = [];
      console.warn("⚠️ Carrito vacío, productos serán vacíos en la factura");
    }
  }

  // Si productos es un número (como "productos: 1"), convertirlo usando detalles o carrito
  if (typeof pedidoParaPDF.productos === "number") {
    console.log(
      `🔢 Productos es un número (${pedidoParaPDF.productos}), buscando detalles...`,
    );

    // Buscar en detalles
    if (pedidoParaPDF.detalles && Array.isArray(pedidoParaPDF.detalles)) {
      pedidoParaPDF.productos = pedidoParaPDF.detalles;
      console.log("📋 Usando detalles como productos");
    }
    // Si no hay detalles, usar carrito
    else if (carrito && carrito.length > 0) {
      pedidoParaPDF.productos = carrito.map((item) => ({
        nombre_producto: item.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal: item.precio * item.cantidad,
      }));
      console.log("🛒 Usando carrito para productos");
    } else {
      // Crear productos basados en el total
      console.log("💰 Creando productos basados en el total");
      pedidoParaPDF.productos = [
        {
          nombre_producto: "Productos varios",
          cantidad: 1,
          precio_unitario: pedidoParaPDF.total || 0,
          subtotal: pedidoParaPDF.total || 0,
        },
      ];
    }
  }

  // Agregar costo de envío si no existe
  if (!pedidoParaPDF.costo_envio) {
    pedidoParaPDF.costo_envio = costo_envio;
  }

  // Agregar fecha si no existe
  if (!pedidoParaPDF.fecha_pedido) {
    pedidoParaPDF.fecha_pedido = new Date();
  }

  // Agregar estado si no existe
  if (!pedidoParaPDF.estado) {
    pedidoParaPDF.estado = "comprobante_pendiente";
  }

  // Calcular el total si no existe
  if (!pedidoParaPDF.total) {
    const subtotal = pedidoParaPDF.productos.reduce(
      (sum, p) => sum + (p.subtotal || 0),
      0,
    );
    pedidoParaPDF.total = subtotal + (pedidoParaPDF.costo_envio || 0);
  }

  console.log("📋 Pedido final para PDF:", pedidoParaPDF);
  console.log("📊 Productos finales:", pedidoParaPDF.productos);

  generarFacturaPDF(pedidoParaPDF, config)
    .then((nombreArchivo) => {
      console.log("✅ Factura descargada:", nombreArchivo);

      // Actualizar localStorage
      const pedidoConfirmado = JSON.parse(
        localStorage.getItem("pedidoConfirmado"),
      );
      if (pedidoConfirmado) {
        pedidoConfirmado.facturaDescargada = true;
        localStorage.setItem(
          "pedidoConfirmado",
          JSON.stringify(pedidoConfirmado),
        );
      }
    })
    .catch((error) => {
      console.error("❌ Error:", error);
      alert("No se pudo generar la factura: " + error.message);
    });
}

// Event listener mejorado para el botón PDF
document.addEventListener("click", function (e) {
  if (e.target.closest("#btnDescargarPDF")) {
    e.preventDefault();

    console.log("🖱️ Botón PDF clickeado");

    // Verificar de dónde obtener el pedido
    let pedidoParaFactura;

    // 1. Primero intentar con window.pedidoFacturacion
    if (window.pedidoFacturacion) {
      // CLONAR el pedido para no modificar el original
      pedidoParaFactura = JSON.parse(JSON.stringify(window.pedidoFacturacion));
      console.log("📦 Usando pedido de window.pedidoFacturacion (clonado)");
    }
    // 2. Si no, buscar en localStorage
    else {
      const pedidoConfirmado = JSON.parse(localStorage.getItem("pedidoConfirmado"));
      if (pedidoConfirmado && pedidoConfirmado.pedido) {
        // CLONAR el pedido
        pedidoParaFactura = JSON.parse(JSON.stringify(pedidoConfirmado.pedido));
        window.pedidoFacturacion = pedidoParaFactura; // Asignar para futuros intentos
        console.log("📦 Usando pedido de localStorage (clonado)");
      }
    }

    // 3. Si todavía no hay pedido, mostrar error
    if (!pedidoParaFactura) {
      console.error("❌ No hay datos de pedido para generar la factura");
      mostrarNotificacionFacturacion('error', 'No hay datos del pedido para generar la factura')
      return;
    }

    console.log("📋 Pedido para factura:", pedidoParaFactura);

    // DEBUG: Mostrar estructura completa
    /*console.log("🔍 Estructura completa del pedido:", {
      id: pedidoParaFactura.id,
      identificador: pedidoParaFactura.identificador_pedido,
      productos: pedidoParaFactura.productos,
      tipoProductos: typeof pedidoParaFactura.productos,
      esArray: Array.isArray(pedidoParaFactura.productos),
      detalles: pedidoParaFactura.detalles,
      cliente: pedidoParaFactura.cliente,
      total: pedidoParaFactura.total,
      costo_envio: pedidoParaFactura.costo_envio,
    });*/

    // Llamar a la función de descarga
    descargarFacturaCliente(pedidoParaFactura, () => {
      // Callback que se ejecuta después de generar el PDF
      facturaDescargada = true;

      // Actualizar el botón para mostrar que ya se descargó
      const btnPDF = e.target.closest("#btnDescargarPDF") || document.getElementById("btnDescargarPDF");
      if (btnPDF) {
        mostrarNotificacionFacturacion('success', 'Factura descargada correctamente');

        btnPDF.innerHTML =
          '<i class="fas fa-check"></i> Factura Descargada (Puedes descargar nuevamente)';
        btnPDF.style.background = "#27ae60";

        // Ocultar mensaje de recordatorio si está visible
        const mensajeRecordatorio = document.getElementById(
          "mensajeRecordatorio",
        );
        if (mensajeRecordatorio) {
          mensajeRecordatorio.style.display = "none";
        }

        // Cambiar de nuevo después de un tiempo
        setTimeout(() => {
          btnPDF.style.background = "#e74c3c";
          btnPDF.innerHTML =
            '<i class="fas fa-redo"></i> Descargar Factura Nuevamente';
        }, 1000);
      }

      // Actualizar localStorage
      const pedidoConfirmado = JSON.parse(
        localStorage.getItem("pedidoConfirmado"),
      );
      if (pedidoConfirmado) {
        pedidoConfirmado.facturaDescargada = true;
        localStorage.setItem(
          "pedidoConfirmado",
          JSON.stringify(pedidoConfirmado),
        );
      }
    });
  }
});


// ============================================
//     FUNCIÓN PARA ANALIZAR ESTRUCTURA DEL PEDIDO
// ============================================
function analizarEstructuraPedido(pedido) {
  console.log("🔍 === ANÁLISIS DE ESTRUCTURA DEL PEDIDO ===");

  if (!pedido) {
    console.log("❌ Pedido es null/undefined");
    return;
  }

  // Mostrar todas las propiedades
  console.log("📋 Todas las propiedades:");
  for (const key in pedido) {
    console.log(`  ${key}:`, pedido[key], `(tipo: ${typeof pedido[key]})`);
  }

  // Análisis específico de productos
  console.log("\n🎯 Análisis de productos:");
  if (pedido.productos) {
    console.log('  - Existe propiedad "productos"');
    console.log("  - Tipo:", typeof pedido.productos);
    console.log("  - Es array:", Array.isArray(pedido.productos));

    if (Array.isArray(pedido.productos)) {
      console.log("  - Longitud:", pedido.productos.length);
      if (pedido.productos.length > 0) {
        console.log("  - Primer elemento:", pedido.productos[0]);
      }
    } else if (typeof pedido.productos === "object") {
      console.log("  - Es objeto, claves:", Object.keys(pedido.productos));
    }
  } else {
    console.log('  - No existe propiedad "productos"');
  }

  // Análisis de detalles
  console.log("\n📝 Análisis de detalles:");
  if (pedido.detalles) {
    console.log('  - Existe propiedad "detalles"');
    console.log("  - Tipo:", typeof pedido.detalles);
    console.log("  - Es array:", Array.isArray(pedido.detalles));
  }

  console.log("=== FIN ANÁLISIS ===\n");
}

// Hacer disponible globalmente
window.analizarEstructuraPedido = analizarEstructuraPedido;
