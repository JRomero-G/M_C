require("dotenv").config();
const { Resend } = require('resend');

const CorreoApi = new Resend(process.env.RESEND_API_KEY);

async function enviarConfirmacionPedido(to, pedido, detalles) {

    const productosHTML = detalles.map(item => `
        <tr>
            <td style="padding:8px;border:1px solid #ddd">${item.nombre_producto}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center">${item.cantidad}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right">HNL ${item.precio_unitario.toFixed(2)}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right">HNL ${item.subtotal.toFixed(2)}</td>
        </tr>
    `).join('');

    await CorreoApi.emails.send({
        from: 'Soporte Muebles Comayagua <onboarding@resend.dev>',
        to,
        subject: `Confirmación de pedido ${pedido.identificador_pedido}`,
        html: `
            <h2>¡Gracias por tu pedido!</h2>
            <p>Hola <strong>${pedido.cliente.nombre}</strong>, recibimos tu pedido correctamente.</p>

            <h3>Detalle del pedido ${pedido.identificador_pedido}</h3>
            <table style="width:100%;border-collapse:collapse">
                <thead>
                    <tr style="background:#f5f5f5">
                        <th style="padding:8px;border:1px solid #ddd;text-align:left">Producto</th>
                        <th style="padding:8px;border:1px solid #ddd">Cantidad</th>
                        <th style="padding:8px;border:1px solid #ddd;text-align:right">Precio unitario</th>
                        <th style="padding:8px;border:1px solid #ddd;text-align:right">Subtotal</th>
                    </tr>
                </thead>
                <tbody>${productosHTML}</tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="padding:8px;text-align:right"><strong>ISV (15%):</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;text-align:right">HNL ${(pedido.total - pedido.subtotal - pedido.envio_info.costo_extra).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td colspan="3" style="padding:8px;text-align:right"><strong>Envío:</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;text-align:right">HNL ${pedido.envio_info.costo_extra.toFixed(2)}</td>
                    </tr>
                    <tr style="background:#f5f5f5">
                        <td colspan="3" style="padding:8px;text-align:right"><strong>Total:</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;text-align:right"><strong>HNL ${pedido.total.toFixed(2)}</strong></td>
                    </tr>
                </tfoot>
            </table>

            <h3>Información de entrega</h3>
            <p>📦 Tipo: ${pedido.envio_info.tipo === 'domicilio' ? 'Envío a domicilio' : 'Recogida en tienda'}</p>
            ${pedido.envio_info.tipo === 'domicilio' ? `<p>📍 Dirección: ${pedido.envio_info.direccion}</p>` : ''}
            <p>💳 Método de pago: ${pedido.metodo_pago}</p>
            <p>📋 Estado: <strong>${pedido.estado}</strong></p>
            ${pedido.notas ? `<p>📝 Notas: ${pedido.notas}</p>` : ''}

            <hr>
            <p style="color:#888;font-size:12px">Muebles Comayagua — Si tienes dudas contáctanos.</p>
        `
    });
}

async function enviarResetEmail(to, token) {
    const link = `https://tu-frontend.com/reset-password?token=${token}`;

    await CorreoApi.emails.send({
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

module.exports = { enviarResetEmail, enviarConfirmacionPedido };