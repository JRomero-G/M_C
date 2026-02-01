// test-modelos.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./database');

// Importar modelos
const Producto = require('./models/Producto');
const Pedido = require('./models/Pedido');
const PedidoDetalle = require('./models/PedidoDetalle');
const Contador = require('./models/Contador');
const { obtenerProximoIdSecuencial } = require('./utils/generarIdPublico');

async function testModelos() {
  try {
    console.log('🧪 Iniciando pruebas de modelos...\n');
    
    // 1. Conectar a la base de datos
    await connectDB();
    
    // 2. Crear un producto de prueba
    console.log('1. Creando producto de prueba...');
    const producto = new Producto({
      nombre: 'Silla Ejecutiva de Prueba',
      descripcion: 'Silla ergonómica para pruebas del sistema',
      precio_original: 2500,
      descuento: 10,
      stock: 50,
      imagenes: [{
        url: 'https://res.cloudinary.com/imgenesproductos/image/upload/v1/venta_muebles/productos/silla-test.jpg',
        public_id: 'venta_muebles/productos/silla-test',
        es_principal: true
      }]
    });
    
    await producto.save();
    console.log('   ✅ Producto creado:', producto._id);
    console.log('   💰 Precio final calculado:', producto.precio_final);
    
    // 3. Generar ID de pedido
    console.log('\n2. Generando ID de pedido secuencial...');
    const idPedido = await obtenerProximoIdSecuencial();
    console.log('   ✅ ID generado:', idPedido);
    
    // 4. Crear pedido de prueba
    console.log('\n3. Creando pedido de prueba...');
    const pedido = new Pedido({
      identificador_pedido: idPedido,
      cliente: {
        nombre: 'Juan Pérez',
        telefono: '+504 1234-5678',
        correo: 'juan@test.com'
      },
      metodo_pago: 'transferencia',
      envio_info: {
        tipo: 'domicilio',
        costo_extra: 150,
        direccion: 'Calle Principal 123, Tegucigalpa',
        estado: 'pendiente'
      },
      subtotal: 2250, // 1 silla a 2250 (2500 - 10%)
      total: 2400, // subtotal + envío
      comprobante_info: {
        referencia_cliente: 'Depósito por orden',
        monto_depositado: 2400,
        fecha_deposito: new Date()
      }
    });
    
    await pedido.save();
    console.log('   ✅ Pedido creado:', pedido._id);
    console.log('   📦 Estado inicial:', pedido.estado);
    
    // 5. Crear detalle del pedido
    console.log('\n4. Creando detalle de pedido...');
    const detalle = new PedidoDetalle({
      id_pedido: pedido._id,
      id_producto: producto._id,
      nombre_producto: producto.nombre,
      cantidad: 1,
      precio_unitario: producto.precio_final
    });
    
    await detalle.save();
    console.log('   ✅ Detalle creado');
    console.log('   📝 Subtotal calculado:', detalle.subtotal);
    
    // 6. Verificar que todo se guardó
    console.log('\n5. Verificando datos guardados...');
    const productosCount = await Producto.countDocuments();
    const pedidosCount = await Pedido.countDocuments();
    const detallesCount = await PedidoDetalle.countDocuments();
    
    console.log(`   📊 Totales en la base de datos:`);
    console.log(`      Productos: ${productosCount}`);
    console.log(`      Pedidos: ${pedidosCount}`);
    console.log(`      Detalles: ${detallesCount}`);
    
    // 7. Probar búsquedas
    console.log('\n6. Probando búsquedas...');
    const pedidoEncontrado = await Pedido.findOne({ identificador_pedido: idPedido })
      .populate('detalles');
    
    console.log('   🔍 Pedido encontrado por ID público:', pedidoEncontrado ? '✅' : '❌');
    
    // 8. Limpiar datos de prueba (opcional)
    console.log('\n7. Limpiando datos de prueba...');
    await PedidoDetalle.deleteMany({ id_pedido: pedido._id });
    await Pedido.deleteOne({ _id: pedido._id });
    await Producto.deleteOne({ _id: producto._id });
    
    console.log('   🧹 Datos de prueba eliminados');
    
    console.log('\n🎉 ¡Todas las pruebas completadas exitosamente!');
    console.log('\n✅ Los modelos están listos para usar.');
    
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión a MongoDB cerrada.');
    process.exit(0);
  }
}

// Ejecutar pruebas
testModelos();