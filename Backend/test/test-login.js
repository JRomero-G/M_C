// test/test-login.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = "mongodb+srv://jromero_db:PruebasDeDesarrollo@cluster0.uayzubg.mongodb.net/test?retryWrites=true&w=majority";

async function testLogin() {
    try {
        console.log('=== TEST LOGIN ===');
        
        await mongoose.connect(uri);
        console.log('✅ Conectado a MongoDB');
        
        // Cargar el modelo CORRECTO
        require('../models/Usuarios');
        const Usuario = mongoose.model('Usuario');
        
        // Verificar si existe el usuario admin
        const admin = await Usuario.findOne({ email: 'admin@tienda.com' });
        console.log('👤 Admin encontrado:', !!admin);
        
        if (admin) {
            console.log('📝 Datos admin:');
            console.log('   Email:', admin.email);
            console.log('   Rol:', admin.rol);
            console.log('   Estado:', admin.estado);
            console.log('   Password hash:', admin.password ? '✅ Sí' : '❌ No');
            
            // Probar comparación de password
            const passwordValido = await admin.compararPassword('admin123');
            console.log('🔐 Password "admin123" válido:', passwordValido);
            
            // Probar password incorrecto
            const passwordInvalido = await admin.compararPassword('wrongpass');
            console.log('🔐 Password "wrongpass" válido:', passwordInvalido);
        } else {
            console.log('⚠️  Admin no encontrado. Creando...');
            
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            
            const nuevoAdmin = new Usuario({
                nombre: 'Administrador',
                email: 'admin@tienda.com',
                password: hashedPassword,
                rol: 'admin',
                estado: 'activo'
            });
            
            await nuevoAdmin.save();
            console.log('✅ Admin creado');
        }
        
        // Listar todos los usuarios
        const usuarios = await Usuario.find({}, 'nombre email rol estado');
        console.log('\n📋 Todos los usuarios:');
        usuarios.forEach((u, i) => {
            console.log(`${i + 1}. ${u.nombre} (${u.email}) - ${u.rol} - ${u.estado}`);
        });
        
        await mongoose.disconnect();
        console.log('\n✅ Test completado');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

testLogin();