// test-mongoose7.js
const mongoose = require('mongoose');

async function test() {
    try {
        await mongoose.connect(
            "mongodb+srv://jromero_db:PruebasDeDesarrollo@cluster0.uayzubg.mongodb.net/Venta_Muebles?retryWrites=true&w=majority",
            {
                serverSelectionTimeoutMS: 30000
            }
        );
        
        console.log('✅ Mongoose 7+ conectado correctamente');
        console.log('Mongoose version:', mongoose.version);
        
        // Crear una colección de prueba
        const testSchema = new mongoose.Schema({ name: String });
        const Test = mongoose.model('TestConnection', testSchema);
        
        const doc = new Test({ name: 'Test ' + new Date().toISOString() });
        await doc.save();
        
        console.log('✅ Documento guardado:', doc._id);
        
        await mongoose.disconnect();
        console.log('👋 Desconectado');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Versión de Mongoose:', mongoose.version);
    }
}

test();