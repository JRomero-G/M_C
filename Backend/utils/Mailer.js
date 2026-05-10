// Funciones para enviar correos electrónicos, 
// como el correo de restablecimiento de contraseña
require("dotenv").config();
const nodemailer = require('nodemailer');

// Configuración del transporte de correo electrónico;
const transporter = nodemailer.createTransport({
    // Configura tu servicio de correo electrónico aquí
    host: 'smtp.gmail.com', // Ejemplo con Gmail
    port: 465,
    secure: true,  
    family: 4,
    auth:{
        user: process.env.EMAIL_USER, // Tu correo electrónico
        pass: process.env.EMAIL_PASS  // Tu contraseña de correo electrónico o token de aplicación
    }
});

// Función para enviar el correo de restablecimiento de contraseña
async function enviarResetEmail(to, token) {
    // Genera el enlace de restablecimiento de contraseña con el token
    const link = `http://localhost:3000/reset-password?token=${token}`; // Enlace para restablecer la contraseña
    
    await transporter.verify();
    console.log("SMTP conectado correctamente");

    // Configura el correo electrónico
    await transporter.sendMail({
        from: `"Soporte Muebles Comayagua"<${process.env.EMAIL_USER}>`,
        to,
        subject: "Restrablecimiento de contraseña",
        html:`
        <h3> Restablecimiento de contraseña </h3>
        <p> IMPORTANTE!: Si no solicitaste este restablecimiento, puedes ignorar este correo electrónico. </p>
        <p> Haz clic en el siguiente enlace para restablecer tu contraseña: </p>
        <a href="${link}">Restablecer contraseña</a>
        `
    });
}

module.exports = {enviarResetEmail};
