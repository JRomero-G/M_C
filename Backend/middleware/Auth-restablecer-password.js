// hashear el token de restablecimiento de contraseña antes de almacenarlo en la base de datos
const crypto = require("crypto");
const Usuario = require("../models/Usuarios");
const PasswordReset = require("../models/Reset_pass");

const { hashToken_Recuperacion } = require("./Hash");
const { enviarResetEmail } = require("../utils/Mailer");

// Olvidé mi contraseña
exports.OlvideMiContraseña = async (req, res) => {
  // Obtener el correo electrónico del usuario
  try {
    // Validar que se haya proporcionado un correo electrónico
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "El correo electrónico es requerido",
      });
    }

    // Verificar si el usuario existe en la base de datos
    const user = await Usuario.findOne({
      email,
      estado: "activo",
    });

    // Si el usuario no existe, respondemos con un mensaje genérico
    // para evitar revelar información sobre la existencia del correo electrónico
    if (!user) {
      return res.status(404).json({
        message: "Si el correo existe, Recibiras un mensaje",
      });
    }

    // Borrar cualquier token de restablecimiento de contraseña existente
    // para este usuario
    await PasswordReset.deleteMany({
      usuario_id: user._id,
    });

    // Generar un token de restablecimiento de contraseña
    const token = crypto.randomBytes(32).toString("hex");

    // Hashear el token antes de almacenarlo en la base de datos
    const hashedToken = hashToken_Recuperacion(token);

    //Tiempo de expiración del token (15 minutos)
    const expiracion = new Date(
      // El tiempo de expiración se establece en 15 minutos a partir del momento actual
      // se multiplica 15 minutos por 60 segundos por 1000 milisegundos para obtener el tiempo en milisegundos
      // esto asegura que el token de restablecimiento de contraseña solo sea válido durante un período limitado,
      //  lo que mejora la seguridad al reducir la ventana de tiempo en la que un atacante podría usar un token robado
      Date.now() + 15 * 60 * 1000,
    );

    // Almacenar el token hasheado en la base de datos
    await PasswordReset.create({
      usuario_id: user._id, // Se almacena el ID del usuario para asociar el token con el usuario correspondiente
      token: hashedToken, // Se almacena el token hasheado en la base de datos para mayor seguridad
      tiempo_expiracion: expiracion, // Se almacena la fecha y hora de expiración del token para que pueda ser verificada posteriormente
    });

    // Enviar el correo electrónico de restablecimiento de contraseña al usuario
    await enviarResetEmail(user.email, token); // Se envía el token sin hashear al correo electrónico del usuario para que pueda usarlo para restablecer su contraseña

    return res.json({
      message: "Si el correo existe, Recibiras un mensaje",
    });
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

/*
// Actualizar la contraseña del usuario
async function hashPassword(nueva_contraseña) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(nueva_contraseña, salt);
}
*/

exports.ActualizarContraseña = async (req, res) => {
  try {
    const { token, nueva_contraseña } = req.body;
    if (!token || !nueva_contraseña) {
      return res.status(400).json({
        message: "Token y nueva contraseña son requeridos",
      });
    }

    // Hashear el token recibido para compararlo con el token almacenado en la base de datos
    const hashToken = hashToken_Recuperacion(token);

    // Buscar el token en la base de datos
    const Buscar_token = await PasswordReset.findOne({
      token: hashToken,
      tiempo_expiracion: { $gt: new Date() }, // Verificar que el token no haya expirado
    });

    // Si no se encuentra el token o ha expirado, responder con un mensaje de error
    if (!Buscar_token) {
      return res.status(400).json({
        message: "Token inválido o expirado",
      });
    }

    // Buscar al usuario asociado con el token
    const user = await Usuario.findById(Buscar_token.usuario_id);

    // Si no se encuentra el usuario, responder con un mensaje de error
    if (!user) {
      return res.json({
        message: "Usuario no encontrado",
      });
    }

    user.password = nueva_contraseña;

    // Guardar los cambios en la base de datos
    await user.save();

    // Eliminar el registro de restablecimiento de contraseña
    await PasswordReset.deleteOne({ _id: Buscar_token._id });

    // Responder con un mensaje de éxito
    return res.json({
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar contraseña:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};
