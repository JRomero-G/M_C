const mongoose = require('mongoose');

const contadorSchema = new mongoose.Schema({
  _id: { 
    type: String, 
    required: true 
  }, // Será "pedidos"
  secuencia: { 
    type: Number, 
    default: 1 
  },
  ultima_actualizacion: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'contadores' // Nombre de la coleccion
});

module.exports = mongoose.model('Contador', contadorSchema);