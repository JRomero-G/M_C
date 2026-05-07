/*Controladores de productos (CREAR, ACTUALIZAR, ELIMINAR) */
const Producto = require("../models/Producto");
const cloudinary = require("../utils/Cloudinary");
//const cloudinary = require("../utils/cloudinary");

// 1. Crear producto
exports.crearProducto = async (req, res) => {
  try {
    const { nombre, precio_original, descuento, stock, descripcion, imagenes, tipo_inventario } =
      req.body;

    if (!nombre || !precio_original) {
      return res.status(400).json({
        error: "Nombre y precio original son obligatorios",
      });
    }

    if (!imagenes || !Array.isArray(imagenes) || imagenes.length === 0) {
      return res.status(400).json({
        error: "Debe proporcionar al menos una imagen para el producto",
      });
    }

    const imagenesValidadas = imagenes.map((img, index) => ({
      url: img.url,
      public_id: img.public_id,
      es_principal: index === 0,
      nombre_original: img.nombre_original || `imagen-${index + 1}`,
    }));

    //Determinar stock segun el tipo de inventario
    const Tipo_Inventario_Final =
      tipo_inventario === "unico" ? "unico" : "serie";
    const Stock_final =
      Tipo_Inventario_Final === "unico" ? 1 : parseInt(stock) || 0;

    const nuevoProducto = new Producto({
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || "",
      precio_original: parseFloat(precio_original),
      descuento: parseFloat(descuento) || 0,
      stock: Stock_final,
      tipo_inventario: Tipo_Inventario_Final,
      imagenes: imagenesValidadas,
      categoria: req.body.categoria || "General",
    });

    await nuevoProducto.save();

    console.log("✅ Producto creado:", nuevoProducto._id);

    // Respuesta con datos clave para mostrar en la tabla de gestión
    res.status(201).json({
      success: true,
      mensaje: "Producto creado exitosamente",
      producto: {
        id: nuevoProducto._id,
        nombre: nuevoProducto.nombre,
        precio_final: nuevoProducto.precio_final,
        stock: nuevoProducto.stock,
        imagenes: nuevoProducto.imagenes.length,
        tipo_inventario: nuevoProducto.tipo_inventario,
      },
    });
  } catch (error) {
    console.error("❌ Error al crear producto:", error.message);

    if (error.name === "ValidationError") {
      const errores = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        error: "Error de validación",
        detalles: errores,
      });
    }

    res.status(500).json({
      error: "Error interno al crear el producto",
      detalle: error.message,
    });
  }
};

// Tablas y reporte - Administracion
exports.obtenerProductosGestion = async (req, res) => {
  try {
    const {
      estado,
      stock,
      pagina = 1,
      limite = 12,
      buscar = "",
      categoria = "",
      tipo_inventario = "",
    } = req.query;

    const skip = (pagina - 1) * limite;

    //let filtro = { activo: true || false};
    let filtro = {};

    // Filtro por búsqueda
    if (buscar && buscar.trim() !== "") {
      filtro.$or = [
        { nombre: { $regex: buscar.trim(), $options: "i" } },
        { descripcion: { $regex: buscar.trim(), $options: "i" } },
      ];
    }

    // Filtro por categoría
    if (categoria && categoria.trim() !== "") {
      filtro.categoria = new RegExp(categoria.trim(), "i");
    }

    let orden = { createdAt: -1 };
    if (estado === "activos") filtro.activo = true;
    if (estado === "inactivos") filtro.activo = false;

    if (stock === "mas-stock") orden.stock = -1;
    if (stock === "menos-stock") orden.stock = 1;

    // Filtro por tipo de inventario
    //if(tipo_inventario === "unico") filtro.tipo_inventario = "unico";
    //if(tipo_inventario === "serie") filtro.tipo_inventario = "serie";

    if (tipo_inventario === "unico" || tipo_inventario === "serie") {
      filtro.tipo_inventario = tipo_inventario;
    }

    const [productos, total] = await Promise.all([
      Producto.find(filtro)
        .sort(orden)
        .skip(skip)
        .limit(parseInt(limite))
        .select(
          "nombre descripcion precio_original precio_final descuento stock imagenes categoria activo tipo_inventario createdAt",
        ),
      Producto.countDocuments(filtro),
    ]);

    res.json({
      success: true,
      productos,
      paginacion: {
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        total,
        paginas: Math.ceil(total / limite),
      },
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
};

exports.obtenerProductosGestion2 = async (req, res) => {
  try {
    const {
      estado,
      stock,
      pagina = 1,
      limite = 12,
      buscar = "",
      categoria = "",
      tipo_inventario = "",
    } = req.query;

    const skip = (pagina - 1) * limite;

    let filtro = {};

    // Filtro por búsqueda
    if (buscar && buscar.trim() !== "") {
      filtro.$or = [
        { nombre: { $regex: buscar.trim(), $options: "i" } },
        { descripcion: { $regex: buscar.trim(), $options: "i" } },
      ];
    }

    // Filtro por categoría
    if (categoria && categoria.trim() !== "") {
      filtro.categoria = new RegExp(categoria.trim(), "i");
    }

    // Filtro por estado
    if (estado === "activos") filtro.activo = true;
    if (estado === "inactivos") filtro.activo = false;

    // Filtro por tipo de inventario
    //if(tipo_inventario === "unico") filtro.tipo_inventario = "unico";
    //if(tipo_inventario === "serie") filtro.tipo_inventario = "serie";

    if (tipo_inventario === "unico" || tipo_inventario === "serie") {
      filtro.tipo_inventario = tipo_inventario;
    }

    // FILTROS POR STOCK
    if (stock === "sin-stock") {
      filtro.stock = 0; // Solo productos con stock 0
    } else if (stock === "con-stock") {
      filtro.stock = { $gt: 0 }; // Solo productos con stock > 0
    }

    // Orden por defecto
    let orden = { createdAt: -1 };

    // ORDENAMIENTOS POR STOCK (cuando no es filtro)
    if (stock === "mas-stock") {
      orden = { stock: -1, createdAt: -1 }; // Mayor stock primero
    } else if (stock === "menos-stock") {
      orden = { stock: 1, createdAt: -1 }; // Menor stock primero
    }

    const [productos, total] = await Promise.all([
      Producto.find(filtro)
        .sort(orden)
        .skip(skip)
        .limit(parseInt(limite))
        .select(
          "nombre descripcion precio_original precio_final descuento stock imagenes categoria activo tipo_inventario createdAt",
        ),
      Producto.countDocuments(filtro),
    ]);

    res.json({
      success: true,
      productos,
      paginacion: {
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        total,
        paginas: Math.ceil(total / limite),
      },
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
};

/**
 * Obtener cantidad total de productos activos
 * GET /productos/activos/cantidad
 */
exports.obtenerCantidadProductosActivos = async (req, res) => {
  try {
    const cantidad = await Producto.countDocuments({ activo: true });

    res.json({
      success: true,
      cantidad,
    });
  } catch (error) {
    console.error("❌ Error al obtener cantidad de productos activos:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener cantidad de productos activos",
    });
  }
};

/* Publico para el CATALOGO */
exports.obtenerProductosCatalogo = async (req, res) => {
  try {
    const productos = await Producto.find({ activo: true })
      .sort({ createdAt: -1 })
      .select(
        "nombre descripcion precio_original precio_final descuento stock imagenes fecha_registro categoria tipo_inventario",
      );

    res.json({
      success: true,
      productos,
    });
  } catch (error) {
    console.error("Error al obtener catálogo:", error);
    res.status(500).json({ error: "Error al obtener catálogo" });
  }
};

// 4. Obtener un producto por ID
exports.obtenerProductoPorId = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ success: true, producto });
  } catch (error) {
    console.error("Error al obtener producto OBTENER ID:", error);

    if (error.name === "CastError") {
      return res.status(400).json({ error: "ID de producto inválido" });
    }

    res.status(500).json({ error: "Error al obtener producto OBTENER ID" });
  }
};

exports.actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizados = req.body;

    console.log("🔄 Actualizando producto:", id);
    console.log("📸 Datos de imágenes recibidos:", datosActualizados.imagenes);

    const producto = await Producto.findById(id);

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // Actualizar campos básicos
    if (datosActualizados.nombre !== undefined) {
      producto.nombre = datosActualizados.nombre.trim();
    }

    if (datosActualizados.precio_original !== undefined) {
      producto.precio_original = parseFloat(datosActualizados.precio_original);
    }

    if (datosActualizados.descuento !== undefined) {
      producto.descuento = parseFloat(datosActualizados.descuento) || 0;
    }

    if (datosActualizados.stock !== undefined) {
      producto.stock = parseInt(datosActualizados.stock) || 0;
    }

    if (datosActualizados.descripcion !== undefined) {
      producto.descripcion = datosActualizados.descripcion.trim();
    }

    if (datosActualizados.categoria !== undefined) {
      producto.categoria = datosActualizados.categoria;
    }

    if (datosActualizados.tipo_inventario !== undefined) {
      const Tipo_Inventario_Nuevo = datosActualizados.tipo_inventario;

      if (Tipo_Inventario_Nuevo === "unico") {
        producto.tipo_inventario = "unico";
        producto.stock = 1; // Si es único, el stock siempre es 1
      } else if (Tipo_Inventario_Nuevo === "serie") {
        producto.tipo_inventario = "serie";
        // Si cambia a serie y el stock actual es 1,
        // dejarlo como está o permitir actualizarlo
      }
    }

    // ================= IMPORTANTE =================
    // Si se envían nuevas imágenes, REEMPLAZAR el array completo
    // Esto es porque el frontend ya combinó las imágenes existentes + nuevas
    if (
      datosActualizados.imagenes &&
      Array.isArray(datosActualizados.imagenes)
    ) {
      console.log(
        `📸 Reemplazando imágenes. Nuevo total: ${datosActualizados.imagenes.length}`,
      );

      // Filtrar imágenes válidas y formatearlas
      const imagenesFormateadas = datosActualizados.imagenes
        .filter((img) => img && img.url) // Solo imágenes con URL
        .map((img, index) => ({
          url: img.url,
          public_id: img.public_id || `img-${Date.now()}-${index}`,
          es_principal: img.es_principal || index === 0,
          nombre_original: img.nombre_original || `imagen-${index + 1}`,
        }));

      producto.imagenes = imagenesFormateadas;
    }
    // ==============================================

    await producto.save();

    console.log("✅ Producto actualizado:", producto.nombre);
    console.log("Tipo inventario Nuevo:", producto.tipo_inventario);
    console.log(
      `📸 Total imágenes después de actualizar: ${producto.imagenes.length}`,
    );

    res.json({
      success: true,
      mensaje: "Producto actualizado exitosamente",
      producto,
    });
  } catch (error) {
    console.error("❌ Error al actualizar producto:", error);

    if (error.name === "ValidationError") {
      const errores = Object.values(error.errors).map((err) => err.message);
      return res
        .status(400)
        .json({ error: "Error de validación", detalles: errores });
    }

    res.status(500).json({ error: "Error al actualizar el producto" });
  }
};

// 6. Eliminar producto (borrado lógico)
exports.CambiarEstadoProducto = async (req, res) => {
  try {
    const { activo } = req.body;
    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      { activo },
      { new: true },
    );

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({
      success: true,
      mensaje: `Producto ${activo ? "activado" : "desactivado"} exitosamente`,
      producto,
    });
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    res.status(500).json({ error: "Error al cambiar el estado del producto" });
  }
};

// 7. Subir imagen a Cloudinary
exports.subirImagen = async (req, res) => {
  try {
    if (!req.files || !req.files.imagen) {
      return res.status(400).json({ error: "No se ha subido ninguna imagen" });
    }

    const archivo = req.files.imagen;

    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];
    if (!tiposPermitidos.includes(archivo.mimetype)) {
      return res.status(400).json({
        error: "Formato de imagen no válido. Use JPEG, PNG o WebP",
      });
    }

    if (archivo.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        error: "La imagen es demasiado grande. Máximo 5MB",
      });
    }

    const resultado = await cloudinary.uploader.upload(archivo.tempFilePath, {
      folder: process.env.CLOUDINARY_FOLDER,
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
    });

    res.json({
      success: true,
      imagen: {
        url: resultado.secure_url,
        public_id: resultado.public_id,
        nombre_original: archivo.name,
        tamaño: resultado.bytes,
        formato: resultado.format,
      },
    });
  } catch (error) {
    console.error("Error al subir imagen:", error);
    res.status(500).json({ error: "Error al subir la imagen" });
  }
};

// Eliminar UNA imagen de Cloudinary
exports.eliminarImagenCloudinary = async (req, res) => {
  try {
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({
        success: false,
        error: "public_id es requerido",
      });
    }

    const result = await cloudinary.uploader.destroy(public_id);

    console.log(`✅ Imagen eliminada de Cloudinary: ${public_id}`);

    res.json({
      success: true,
      result,
      message: `Imagen ${public_id} eliminada correctamente`,
    });
  } catch (error) {
    console.error("Error eliminando imagen en Cloudinary:", error);
    res.status(500).json({
      success: false,
      error: "Error eliminando imagen",
      details: error.message,
    });
  }
};

// Eliminar MÚLTIPLES imágenes de Cloudinary
exports.eliminarMultiplesImagenesCloudinary = async (req, res) => {
  try {
    const { public_ids } = req.body;

    if (!public_ids || !Array.isArray(public_ids)) {
      return res.status(400).json({
        success: false,
        error: "public_ids (array) es requerido",
      });
    }

    if (public_ids.length === 0) {
      return res.json({
        success: true,
        message: "No hay imágenes para eliminar",
        total: 0,
        exitosas: 0,
        fallidas: 0,
        detalles: [],
      });
    }

    console.log(`🗑️ Eliminando ${public_ids.length} imágenes de Cloudinary...`);

    const resultados = [];
    const exitosas = [];
    const fallidas = [];

    // Eliminar cada imagen
    for (const publicId of public_ids) {
      try {
        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result === "ok") {
          console.log(`✅ Eliminada: ${publicId}`);
          exitosas.push({
            public_id: publicId,
            success: true,
            result: result,
          });
        } else {
          console.warn(`⚠️ No se pudo eliminar: ${publicId}`, result);
          fallidas.push({
            public_id: publicId,
            success: false,
            error: result.result || "Error desconocido",
          });
        }

        resultados.push({
          public_id: publicId,
          success: result.result === "ok",
          result: result,
        });
      } catch (error) {
        console.error(`❌ Error eliminando ${publicId}:`, error);
        fallidas.push({
          public_id: publicId,
          success: false,
          error: error.message,
        });
        resultados.push({
          public_id: publicId,
          success: false,
          error: error.message,
        });
      }

      // Pequeña pausa para no sobrecargar Cloudinary (opcional)
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Resumen
    const respuesta = {
      success: fallidas.length === 0, // Éxito total solo si no hay fallidas
      total: public_ids.length,
      exitosas: exitosas.length,
      fallidas: fallidas.length,
      detalles: resultados,
    };

    console.log(
      `📊 Resumen eliminación: ${exitosas.length} exitosas, ${fallidas.length} fallidas`,
    );

    res.json(respuesta);
  } catch (error) {
    console.error("Error eliminando múltiples imágenes en Cloudinary:", error);
    res.status(500).json({
      success: false,
      error: "Error eliminando imágenes",
      details: error.message,
    });
  }
};

// Agregar esto a tu ProductosController.js
exports.obtenerProductosPorCategoria = async (req, res) => {
  try {
    const { categoria } = req.params;
    const { pagina = 1, limite = 20 } = req.query;
    const skip = (pagina - 1) * limite;

    const filtro = {
      activo: true,
      categoria: new RegExp(categoria, "i"), // Búsqueda insensible a mayúsculas
    };

    const [productos, total] = await Promise.all([
      Producto.find(filtro)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limite))
        .select(
          "nombre precio_original precio_final descuento stock imagenes categoria",
        ),
      Producto.countDocuments(filtro),
    ]);

    res.json({
      success: true,
      categoria,
      productos,
      paginacion: {
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        total,
        paginas: Math.ceil(total / limite),
      },
    });
  } catch (error) {
    console.error("Error al obtener productos por categoría:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener productos por categoría",
    });
  }
};
