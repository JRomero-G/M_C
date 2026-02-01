// test/crear-usuarios-optimizado.js
const mongoose = require('mongoose');
require('../models/Usuarios'); // Importa el modelo real

async function crearUsuariosOptimizado() {
    try {
        console.log('👤 CREANDO USUARIOS DEL SISTEMA');
        console.log('='.repeat(50));
        
        // Conexión
        const mongoURI = "mongodb+srv://jromero_db:PruebasDeDesarrollo@cluster0.uayzubg.mongodb.net/test?retryWrites=true&w=majority";
        
        console.log('🔗 Conectando...');
        await mongoose.connect(mongoURI);
        console.log('✅ Conectado a MongoDB');
        
        // Obtener modelo YA definido
        const Usuario = mongoose.model('Usuario');
        
        // Datos de usuarios a crear
        const usuariosData = [
            {
                nombre: 'jromero_administrador',
                email: 'admin@tienda.com',
                password: 'admin123',
                rol: 'admin',
                estado: 'activo'
            }
        ];
        
        console.log('\n📝 Creando/Verificando usuarios...');
        console.log('='.repeat(50));
        
        const resultados = [];
        
        // Procesar cada usuario
        for (const usuarioData of usuariosData) {
            try {
                // Verificar si existe
                const existente = await Usuario.findOne({ email: usuarioData.email });
                
                if (existente) {
                    console.log(`📌 ${usuarioData.nombre} ya existe: ${usuarioData.email}`);
                    resultados.push({
                        usuario: usuarioData.nombre,
                        estado: 'EXISTENTE',
                        email: usuarioData.email
                    });
                } else {
                    // Crear nuevo
                    const nuevoUsuario = new Usuario(usuarioData);
                    await nuevoUsuario.save();
                    
                    console.log(`✅ ${usuarioData.nombre} creado: ${usuarioData.email}`);
                    resultados.push({
                        usuario: usuarioData.nombre,
                        estado: 'CREADO',
                        email: usuarioData.email
                    });
                }
            } catch (error) {
                console.error(`❌ Error con ${usuarioData.nombre}:`, error.message);
                resultados.push({
                    usuario: usuarioData.nombre,
                    estado: 'ERROR',
                    error: error.message
                });
            }
        }
        
        // Mostrar resumen final
        console.log('\n📋 RESUMEN FINAL');
        console.log('='.repeat(50));
        
        resultados.forEach((resultado, index) => {
            console.log(`${index + 1}. ${resultado.usuario}`);
            console.log(`   Email: ${resultado.email}`);
            console.log(`   Estado: ${resultado.estado}`);
            if (resultado.error) console.log(`   Error: ${resultado.error}`);
            console.log('');
        });
        
        // Listar todos los usuarios
        console.log('👥 LISTA COMPLETA DE USUARIOS');
        console.log('='.repeat(50));
        
        const todosUsuarios = await Usuario.find()
            .select('-password') // Excluir password
            .sort({ fecha_registro: -1 });
        
        todosUsuarios.forEach((usuario, index) => {
            console.log(`${index + 1}. ${usuario.nombre}`);
            console.log(`   Email: ${usuario.email}`);
            console.log(`   Rol: ${usuario.rol}`);
            console.log(`   Estado: ${usuario.estado}`);
            console.log(`   ID: ${usuario._id}`);
            console.log(`   Registro: ${usuario.fecha_registro.toLocaleDateString()}`);
            console.log('');
        });
        
        // Desconectar
        await mongoose.disconnect();
        console.log('✅ Proceso completado exitosamente');
        
    } catch (error) {
        console.error('\n💥 ERROR CRÍTICO:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Ejecutar
crearUsuariosOptimizado();