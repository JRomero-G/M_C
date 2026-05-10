const Usuario = require("../models/Usuarios");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

class UsuariosController {
  // ========== AUTENTICACIÓN ==========
  static async login(req, res) {
    try {
      console.log("=== INICIO LOGIN ===");
      console.log("Body recibido:", req.body);
      console.log("Usuario:", req.body.nombre);

      const { nombre, password } = req.body;

      if (!nombre || !password) {
        console.log(" Faltan credenciales");
        return res.status(400).json({
          success: false,
          error: "nombre y contraseña son requeridos",
        });
      }

      console.log(" Buscando usuario con nombre:", nombre || nombre.toLowerCase());

      const usuario = await Usuario.findOne({ nombre: nombre || nombre.toLowerCase() });

      console.log("Usuario encontrado:", usuario ? "Sí" : "No");

      if (!usuario) {
        console.log(" Usuario no existe");
        return res.status(401).json({
          success: false,
          error: "Credenciales incorrectas",
        });
      }

      console.log("Estado del usuario:", usuario.estado);

      //Un usuario inactivo no prodra acceder
      if (usuario.estado === "inactivo") {
        console.log(" Usuario inactivo");
        return res.status(401).json({
          success: false,
          error: "Usuario desactivado. Contacta al administrador.",
        });
      }

      console.log(" Comparando password...");
      const passwordValido = await usuario.compararPassword(password);
      console.log("Password válido:", passwordValido);

      if (!passwordValido) {
        console.log("❌ Password incorrecto");
        return res.status(401).json({
          success: false,
          error: "Credenciales incorrectas",
        });
      }

      // Actualizar último acceso
      usuario.ultimo_acceso = new Date();
      await usuario.save();
      console.log("📅 Último acceso actualizado");

      // Generar token JWT
      const token = jwt.sign(
        {
          id: usuario._id,
          email: usuario.email,
          rol: usuario.rol,
          nombre: usuario.nombre,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      console.log("🎫 Token generado");
      console.log("✅ Login exitoso para:", usuario.nombre);

      res.json({
        success: true,
        token,
        usuario: {
          _id: usuario._id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          estado: usuario.estado,
          fecha_registro: usuario.fecha_registro,
          ultimo_acceso: usuario.ultimo_acceso,
        },
      });

      console.log("=== FIN LOGIN (éxito) ===");
    } catch (error) {
      console.error("💥 ERROR CRÍTICO en login:", error);
      console.error("Stack trace:", error.stack);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  // ========== CRUD DE USUARIOS ==========

  // Obtener todos los usuarios
  static async obtenerUsuarios(req, res) {
    try {
      const usuarios = await Usuario.find().sort({ fecha_registro: -1 });

      res.json({
        success: true,
        usuarios,
        total: usuarios.length,
      });
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  // Obtener usuario por ID
  static async obtenerUsuarioPorId(req, res) {
    try {
      const { id } = req.params;
      const usuario = await Usuario.findById(id);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: "Usuario no encontrado",
        });
      }

      res.json({
        success: true,
        usuario,
      });
    } catch (error) {
      console.error("Error al obtener usuario:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }
  // Crear nuevo usuario
  static async CrearUsuario(req, res) {
    try {
      console.log("📝 DATOS RECIBIDOS:", req.body); // Cambia esto

      const { nombre, email, password, rol, estado } = req.body; // email en minúscula

      console.log("📋 Campos desestructurados:", {
        nombre,
        email,
        password,
        rol,
        estado,
      });

      if (!nombre || !email || !password) {
        console.log("❌ Campos faltantes:", {
          nombre: !nombre,
          email: !email,
          password: !password,
        });
        return res.status(400).json({
          success: false,
          error: "Nombre, email y contraseña son requeridos",
        });
      }

      const correoExistente = await Usuario.findOne({
        email: email.toLowerCase(),
      });

      if (correoExistente) {
        console.log("❌ Email ya existe:", email);
        return res.status(400).json({
          success: false,
          error: "El email ya está registrado",
        });
      }

      console.log("✅ Creando usuario...");
      const nuevoUsuario = new Usuario({
        nombre: nombre.trim(),
        email: email.toLowerCase().trim(),
        password,
        rol: rol || "tienda",
        estado: estado || "activo",
      });

      await nuevoUsuario.save();
      console.log("✅ Usuario creado:", nuevoUsuario._id);

      res.status(201).json({
        success: true,
        message: "Usuario creado exitosamente",
        usuario: {
          id: nuevoUsuario._id,
          nombre: nuevoUsuario.nombre,
          email: nuevoUsuario.email,
          rol: nuevoUsuario.rol,
          estado: nuevoUsuario.estado,
          fecha_registro: nuevoUsuario.fecha_registro,
        },
      });
    } catch (error) {
      console.error("❌ Error al crear usuario:", error);
      console.error("❌ Stack:", error.stack);

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          error: "El email ya está registrado",
        });
      }

      if (error.name === "ValidationError") {
        console.error("❌ Error de validación:", error.errors);
        const mensajesError = Object.values(error.errors).map(
          (err) => err.message
        );
        return res.status(400).json({
          success: false,
          error: mensajesError.join(", "),
        });
      }

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  // Actualizar usuario
  static async ActualizarUsuario(req, res) {
    try {
      const { id } = req.params;
      const { nombre, email, rol, estado, password } = req.body;

      const usuario = await Usuario.findById(id);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: "Usuario no encontrado",
        });
      }

      // Lógica de permisos simplificada - el middleware se encarga
      const updateData = {};

      if (nombre) updateData.nombre = nombre;

      if (email && email !== usuario.email) {
        const emailExistente = await Usuario.findOne({
          email: email.toLowerCase(),
          _id: { $ne: id },
        });

        if (emailExistente) {
          return res.status(400).json({
            success: false,
            error: "El email ya está en uso por otro usuario",
          });
        }

        updateData.email = email.toLowerCase();
      }

      // Solo admin puede cambiar rol y estado (middleware ya verificó)
      if (rol) updateData.rol = rol;
      if (estado) updateData.estado = estado;

      if (password) {
        if (password.length < 6) {
          return res.status(400).json({
            success: false,
            error: "La contraseña debe tener al menos 6 caracteres",
          });
        }
        updateData.password = password;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: "No se proporcionaron datos para actualizar",
        });
      }

      Object.assign(usuario, updateData);
      await usuario.save();

      res.json({
        success: true,
        message: "Usuario actualizado exitosamente",
        usuario,
      });
    } catch (error) {
      console.error("Error al actualizar usuario:", error);

      if (error.name === "ValidationError") {
        const mensajesError = Object.values(error.errors).map(
          (err) => err.message
        );
        return res.status(400).json({
          success: false,
          error: mensajesError.join(", "),
        });
      }

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  // Cambiar estado de usuario
  static async cambiarEstadoUsuario(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (!estado || !["activo", "inactivo"].includes(estado)) {
        return res.status(400).json({
          success: false,
          error: "Estado inválido",
        });
      }

      const usuario = await Usuario.findById(id);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: "Usuario no encontrado",
        });
      }

      usuario.estado = estado;
      await usuario.save();

      res.json({
        success: true,
        message: `Usuario ${
          estado === "activo" ? "activado" : "desactivado"
        } exitosamente`,
        usuario,
      });
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  // Cambiar contraseña de usuario
  static async cambiarPassword(req, res) {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          error: "La nueva contraseña es requerida",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: "La contraseña debe tener al menos 6 caracteres",
        });
      }

      const usuario = await Usuario.findById(id);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: "Usuario no encontrado",
        });
      }

      usuario.password = password;
      await usuario.save();

      res.json({
        success: true,
        message: "Contraseña actualizada exitosamente",
      });
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  // Eliminar usuario
  static async eliminarUsuario(req, res) {
    try {
      const { id } = req.params;

      const usuario = await Usuario.findById(id);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: "Usuario no encontrado",
        });
      }

      // Marcar como inactivo en lugar de eliminar
      usuario.estado = "inactivo";
      await usuario.save();

      res.json({
        success: true,
        message: "Usuario eliminado (desactivado) exitosamente",
      });
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  // ========== FUNCIONES ADICIONALES ==========

  // Obtener perfil del usuario actual
  static async obtenerPerfil(req, res) {
    try {
      res.json({
        success: true,
        usuario: req.usuario,
      });
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  // Actualizar perfil del usuario actual
  static async actualizarPerfil(req, res) {
    try {
      const { nombre, email } = req.body;
      const usuario = req.usuario;

      const updateData = {};

      if (nombre) updateData.nombre = nombre;

      if (email && email !== usuario.email) {
        const emailExistente = await Usuario.findOne({
          email: email.toLowerCase(),
          _id: { $ne: usuario._id },
        });

        if (emailExistente) {
          return res.status(400).json({
            success: false,
            error: "El email ya está en uso por otro usuario",
          });
        }

        updateData.email = email.toLowerCase();
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: "No se proporcionaron datos para actualizar",
        });
      }

      Object.assign(usuario, updateData);
      await usuario.save();

      res.json({
        success: true,
        message: "Perfil actualizado exitosamente",
        usuario,
      });
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  // Cambiar contraseña del usuario actual
  static async cambiarPasswordActual(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: "La contraseña actual y la nueva contraseña son requeridas",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: "La nueva contraseña debe tener al menos 6 caracteres",
        });
      }

      const usuario = await Usuario.findById(req.usuario._id);

      const passwordValido = await usuario.compararPassword(currentPassword);

      if (!passwordValido) {
        return res.status(400).json({
          success: false,
          error: "La contraseña actual es incorrecta",
        });
      }

      usuario.password = newPassword;
      await usuario.save();

      res.json({
        success: true,
        message: "Contraseña actualizada exitosamente",
      });
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  // Obtener estadísticas de usuarios
  static async obtenerEstadisticas(req, res) {
    try {
      const totalUsuarios = await Usuario.countDocuments();
      const usuariosActivos = await Usuario.countDocuments({
        estado: "activo",
      });
      const admins = await Usuario.countDocuments({
        rol: "admin",
        estado: "activo",
      });
      const usuariosTienda = await Usuario.countDocuments({
        rol: "tienda",
        estado: "activo",
      });

      const treintaDiasAtras = new Date();
      treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);

      const nuevosUsuarios = await Usuario.countDocuments({
        fecha_registro: { $gte: treintaDiasAtras },
      });

      res.json({
        success: true,
        estadisticas: {
          total: totalUsuarios,
          activos: usuariosActivos,
          inactivos: totalUsuarios - usuariosActivos,
          admins,
          usuariosTienda,
          nuevosUltimoMes: nuevosUsuarios,
        },
      });
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }
}

module.exports = UsuariosController;
