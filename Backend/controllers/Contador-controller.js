const Contador = require('../models/contador');

async function obtenerProximoIdSecuencial() {
  const session = await Contador.startSession();
  
  try {
    session.startTransaction();
    
    const año = new Date().getFullYear().toString().slice(-2); // "25"
    
    const resultado = await Contador.findOneAndUpdate(
      { _id: "pedidos" },
      { 
        $inc: { secuencia: 1 },
        $set: { ultima_actualizacion: new Date() }
      },
      { 
        upsert: true,
        new: true,
        session: session,
        returnDocument: 'after'
      }
    );
    
    await session.commitTransaction();
    
    const numero = resultado.secuencia;
    // Formato: VENT-000001-25
    return `VENT-${numero.toString().padStart(6, '0')}-${año}`;
    
  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Error al generar ID secuencial:', error);
    
    // Fallback robusto
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `VENT-FB${timestamp}${random}-${new Date().getFullYear().toString().slice(-2)}`;
    
  } finally {
    session.endSession();
  }
}

// Función para validar formato de ID
function validarFormatoId(id) {
  const regex = /^VENT-\d{6}-\d{2}$/;
  return regex.test(id);
}

module.exports = { 
  obtenerProximoIdSecuencial,
  validarFormatoId 
};