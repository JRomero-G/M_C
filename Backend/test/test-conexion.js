// test-mongoose.js
const mongoose = require('mongoose');

const uri = "mongodb+srv://jromero_db:PruebasDeDesarrollo@cluster0.uayzubg.mongodb.net/test?retryWrites=true&w=majority";

async function test() {
    try {
        await mongoose.connect(uri);
        console.log('✅ Mongoose conectado');
        
        // Listar colecciones
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📁 Colecciones:', collections.map(c => c.name));
        
        // Crear un modelo simple
        const TestSchema = new mongoose.Schema({ nombre: String });
        const TestModel = mongoose.model('Test', TestSchema);
        
        // Contar documentos
        const count = await TestModel.countDocuments();
        console.log('📊 Documentos en "tests":', count);
        
        await mongoose.disconnect();
        console.log('👋 Desconectado');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

test();