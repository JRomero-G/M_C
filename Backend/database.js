// CONEXION A LA BASE DE DATOS MONGODB ATLAS 
const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI || 
    "mongodb+srv://jromero_db:PruebasDeDesarrollo@cluster0.uayzubg.mongodb.net/test?retryWrites=true&w=majority";
    
    //BASE DE DATOS TEST
    //mongodb+srv://jromero_db:PruebasDeDesarrollo@cluster0.uayzubg.mongodb.net/test?retryWrites=true&w=majority

    //BASE DE DATOS VENTA_MUEBLE
    //"mongodb+srv://jromero_db:PruebasDeDesarrollo@cluster0.uayzubg.mongodb.net/Venta_Muebles?retryWrites=true&w=majority";

const connectDB = async () => {
    try {
        await mongoose.connect(uri);
        
        console.log('✅ Conectado a MongoDB Atlas');
        console.log(`📁 Base de datos: ${mongoose.connection.db.databaseName}`);
        
        return mongoose.connection;
        
    } catch (error) {
        console.error('❌ Error al conectar a MongoDB:', error.message);
        throw error;
    }
};

module.exports = connectDB;