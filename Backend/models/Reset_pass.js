const mongoose = require('mongoose');

const Reset_Password = new mongoose.Schema({

    usuario_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    token: {
        type: String,
        required: true,
        index: true
    },
    tiempo_expiracion: {
        type: Date,
        required: true
    },
    usado:{
        type: Boolean,
        default: false,
        required: true
    }

},{timestamps: true});

// Crear un índice TTL para eliminar automáticamente los tokens expirados
// esto evita que los tokens de restablecimiento de contraseña se acumulen en la base de datos después de su expiración
// y evita posibles problemas de seguridad al eliminar tokens antiguos que podrían ser reutilizados por atacantes
Reset_Password.index(
    {tiempo_expiracion: 1},
    {expireAfterSeconds: 0} // Eliminar automáticamente los tokens expirados
);

module.exports = mongoose.model("Reset_pass",Reset_Password);