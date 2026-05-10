require("dotenv").config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function enviarResetEmail(to, token) {
    const link = `https://tu-frontend.com/reset-password?token=${token}`;

    await resend.emails.send({
        from: 'Soporte Muebles Comayagua <onboarding@resend.dev>',
        to,
        subject: 'Restablecimiento de contraseña',
        html: `
            <h3>Restablecimiento de contraseña</h3>
            <p><strong>IMPORTANTE:</strong> Si no solicitaste este restablecimiento, ignora este correo.</p>
            <p>Haz clic en el siguiente enlace (válido por 15 minutos):</p>
            <a href="${link}">Restablecer contraseña</a>
        `
    });
}

module.exports = { enviarResetEmail };