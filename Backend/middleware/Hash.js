// Este middleware se encarga de hashear el token de recuperación 
// de contraseña antes de almacenarlo en la base de datos

const crypto = require("crypto");
    
exports.hashToken_Recuperacion = function(token) {
    return crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
}
