// test/test-pedido-real.js - VERSIÓN CORREGIDA
const mongoose = require("mongoose");
require("dotenv").config();

// Cargar modelos
require("../models/Pedidos");
require("../models/Pedido-detalle");
require("../models/Producto");
require("../models/contador");

const Pedido = mongoose.model("Pedido");
const PedidoDetalle = mongoose.model("PedidoDetalle");
const Producto = mongoose.model("Producto");

// IMPORTAR EL CONTROLADOR DE ID SECUENCIAL
const {
  obtenerProximoIdSecuencial,
} = require("../controllers/Contador-controller");

// IDs reales de tus productos
const PRODUCTO_1_ID = "6939297cbcd9e2eec6597415"; // Silla Para Comedor
const PRODUCTO_2_ID = "69399950bcd9e2eec65974d4"; // Cama matrimonial

async function testPedidoReal() {
  console.log("🧾 TEST: CREANDO PEDIDO REAL CON 2 PRODUCTOS");
  console.log("=".repeat(60));

  // Variables para almacenar stock original
  let stockOriginalProducto1, stockOriginalProducto2;

  try {
    // 1. Conectar a MongoDB
    console.log("\n🔗 Conectando a MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado exitosamente");

    // 2. Verificar productos y guardar stock original
    console.log("\n🔍 Verificando productos...");
    const producto1 = await Producto.findById(PRODUCTO_1_ID);
    const producto2 = await Producto.findById(PRODUCTO_2_ID);

    if (!producto1 || !producto2) {
      throw new Error("No se encontraron los productos. Verifica los IDs.");
    }

    // Guardar stock original para verificación posterior
    stockOriginalProducto1 = producto1.stock;
    stockOriginalProducto2 = producto2.stock;

    console.log("📦 Productos encontrados:");
    console.log(`   1. ${producto1.nombre}`);
    console.log(`      Precio: HNL ${producto1.precio_final}`);
    console.log(`      Stock: ${producto1.stock}`);
    console.log(`      Categoría: ${producto1.categoria}`);

    console.log(`\n   2. ${producto2.nombre}`);
    console.log(`      Precio: HNL ${producto2.precio_final}`);
    console.log(`      Stock: ${producto2.stock}`);
    console.log(`      Categoría: ${producto2.categoria}`);

    // Verificar stock suficiente
    const cantidadSillas = 3; // Del carrito (2 + 1)
    const cantidadCamas = 1;
    
    if (producto1.stock < cantidadSillas) {
      throw new Error(`Stock insuficiente: ${producto1.nombre} tiene ${producto1.stock} unidades, se necesitan ${cantidadSillas}`);
    }
    
    if (producto2.stock < cantidadCamas) {
      throw new Error(`Stock insuficiente: ${producto2.nombre} tiene ${producto2.stock} unidades, se necesitan ${cantidadCamas}`);
    }

    // 3. OBTENER ID SECUENCIAL REAL
    console.log("\n🔢 Generando ID secuencial real...");
    const identificador_pedido = await obtenerProximoIdSecuencial();
    console.log(`   ID generado: ${identificador_pedido}`);

    // 4. Simular carrito de compras
    console.log("\n🛒 Simulando carrito de compras...");
    const carrito = [
      {
        id_producto: PRODUCTO_1_ID,
        cantidad: 2, // 2 sillas
        precio_unitario: producto1.precio_final,
      },
      {
        id_producto: PRODUCTO_2_ID,
        cantidad: 1, // 1 cama
        precio_unitario: producto2.precio_final,
      },
      {
        id_producto: PRODUCTO_1_ID, // Misma silla otra vez
        cantidad: 1, // 1 silla más (total 3 sillas)
        precio_unitario: producto1.precio_final,
      },
    ];

    console.log("\n📋 Contenido del carrito:");
    carrito.forEach((item, index) => {
      const producto =
        item.id_producto === PRODUCTO_1_ID ? producto1 : producto2;
      console.log(
        `   ${index + 1}. ${producto.nombre} x ${item.cantidad} = HNL ${
          item.cantidad * item.precio_unitario
        }`
      );
    });

    // 5. Calcular totales
    console.log("\n🧮 Calculando totales...");

    // Agrupar productos por ID
    const productosAgrupados = new Map();

    carrito.forEach((item) => {
      const key = item.id_producto;
      if (productosAgrupados.has(key)) {
        const existente = productosAgrupados.get(key);
        existente.cantidad += item.cantidad;
      } else {
        productosAgrupados.set(key, {
          id_producto: item.id_producto,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
        });
      }
    });

    let subtotal = 0;
    const itemsProcesados = [];

    for (const [productId, item] of productosAgrupados) {
      const producto = productId === PRODUCTO_1_ID ? producto1 : producto2;
      const itemSubtotal = item.cantidad * item.precio_unitario;
      subtotal += itemSubtotal;

      itemsProcesados.push({
        producto: producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: itemSubtotal,
      });

      console.log(
        `   ${producto.nombre} x ${item.cantidad} = HNL ${itemSubtotal}`
      );
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const envio = 250; // Costo de envío
    const total = Math.round((subtotal + envio) * 100) / 100;

    console.log(`\n💰 RESUMEN DE COMPRA:`);
    console.log(`   Subtotal productos: HNL ${subtotal.toFixed(2)}`);
    console.log(`   Costo de envío: HNL ${envio.toFixed(2)}`);
    console.log(`   TOTAL A PAGAR: HNL ${total.toFixed(2)}`);

    // ========== PUNTO CRÍTICO: USAR TRANSACCIÓN ==========
    console.log("\n🚀 INICIANDO TRANSACCIÓN (creación de pedido + actualización de stock)...");
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // 6. Crear pedido manualmente CON ID REAL
      console.log("\n📝 Creando pedido de prueba...");

      const pedido = new Pedido({
        identificador_pedido: identificador_pedido,
        cliente: {
          nombre: "Juan Pérez",
          telefono: "+504 8888-9999",
          correo: "juan.perez@email.com",
        },
        metodo_pago: "transferencia",
        envio_info: {
          tipo: "domicilio",
          costo_extra: envio,
          direccion: "Residencial Los Pinos, Casa #15, Tegucigalpa",
          estado: "pendiente",
        },
        subtotal: subtotal,
        total: total,
        estado: "comprobante_pendiente",
        notas: "Pedido de prueba - Entregar en horario de oficina",
        fecha_pedido: new Date(),
      });

      await pedido.save({ session });
      console.log(`✅ Pedido creado: ${pedido.identificador_pedido}`);

      // 7. Crear detalles del pedido
      console.log("\n📋 Creando detalles del pedido...");

      for (const item of itemsProcesados) {
        try {
          const subtotal =
            Math.round(item.cantidad * item.precio_unitario * 100) / 100;

          const detalle = new PedidoDetalle({
            id_pedido: pedido._id,
            id_producto: item.producto._id,
            nombre_producto: item.producto.nombre,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: subtotal,
          });

          await detalle.save({ session });
          console.log(
            `   ✅ ${item.producto.nombre} - ${item.cantidad} unidades (HNL ${subtotal})`
          );
        } catch (error) {
          console.error(
            `   ❌ Error al guardar ${item.producto.nombre}:`,
            error.message
          );
          throw error;
        }
      }

      // 8. ========== ACTUALIZAR STOCK DE PRODUCTOS ==========
      console.log("\n📦 ACTUALIZANDO STOCK DE PRODUCTOS...");
      
      for (const item of itemsProcesados) {
        console.log(`   📉 Reduciendo stock de ${item.producto.nombre}: ${item.cantidad} unidades`);
        
        const productoActualizado = await Producto.findByIdAndUpdate(
          item.producto._id,
          { $inc: { stock: -item.cantidad } },
          { 
            session,
            new: true // Para obtener el documento actualizado
          }
        );
        
        console.log(`      ✅ Stock actualizado: ${item.producto.stock} → ${productoActualizado.stock}`);
      }

      // Confirmar transacción
      await session.commitTransaction();
      console.log("✅ Transacción completada exitosamente");
      
    } catch (error) {
      // Revertir transacción en caso de error
      await session.abortTransaction();
      console.error("❌ Error en transacción, revertiendo cambios...");
      throw error;
    } finally {
      session.endSession();
    }

    // 9. Verificar datos guardados
    console.log("\n🔍 Verificando datos guardados...");

    // Verificar pedido
    const pedidoGuardado = await Pedido.findOne({ identificador_pedido: identificador_pedido });
    console.log(`\n📄 PEDIDO GUARDADO:`);
    console.log(`   ID: ${pedidoGuardado.identificador_pedido}`);
    console.log(`   Cliente: ${pedidoGuardado.cliente.nombre}`);
    console.log(`   Correo: ${pedidoGuardado.cliente.correo}`);
    console.log(`   Total: HNL ${pedidoGuardado.total}`);
    console.log(`   Estado: ${pedidoGuardado.estado}`);
    console.log(`   Método pago: ${pedidoGuardado.metodo_pago}`);
    console.log(`   Fecha: ${pedidoGuardado.fecha_pedido.toLocaleString()}`);

    // Verificar detalles
    const detallesGuardados = await PedidoDetalle.find({
      id_pedido: pedidoGuardado._id,
    });
    console.log(
      `\n📦 DETALLES GUARDADOS (${detallesGuardados.length} productos):`
    );

    detallesGuardados.forEach((detalle, index) => {
      console.log(`\n   Producto ${index + 1}:`);
      console.log(`     Nombre: ${detalle.nombre_producto}`);
      console.log(`     Cantidad: ${detalle.cantidad}`);
      console.log(`     Precio unitario: HNL ${detalle.precio_unitario}`);
      console.log(`     Subtotal: HNL ${detalle.subtotal}`);
    });

    // 10. Verificar que se redujo el stock (CORRECTO AHORA)
    console.log("\n📊 VERIFICACIÓN DE STOCK (ACTUALIZADO):");

    const producto1Actualizado = await Producto.findById(PRODUCTO_1_ID);
    const producto2Actualizado = await Producto.findById(PRODUCTO_2_ID);

    console.log(`   ${producto1.nombre}:`);
    console.log(`     Stock anterior: ${stockOriginalProducto1}`);
    console.log(`     Stock actual: ${producto1Actualizado.stock}`);
    console.log(
      `     Unidades vendidas: ${stockOriginalProducto1 - producto1Actualizado.stock}`
    );

    console.log(`\n   ${producto2.nombre}:`);
    console.log(`     Stock anterior: ${stockOriginalProducto2}`);
    console.log(`     Stock actual: ${producto2Actualizado.stock}`);
    console.log(
      `     Unidades vendidas: ${stockOriginalProducto2 - producto2Actualizado.stock}`
    );

    // Validar que los cálculos sean correctos
    const sillasVendidas = stockOriginalProducto1 - producto1Actualizado.stock;
    const camasVendidas = stockOriginalProducto2 - producto2Actualizado.stock;
    
    if (sillasVendidas !== 3) {
      console.warn(`⚠️  ADVERTENCIA: Se vendieron ${sillasVendidas} sillas pero deberían ser 3`);
    }
    
    if (camasVendidas !== 1) {
      console.warn(`⚠️  ADVERTENCIA: Se vendieron ${camasVendidas} camas pero deberían ser 1`);
    }

    // 11. Mostrar resumen final
    console.log("\n" + "=".repeat(60));
    console.log("🎉 TEST COMPLETADO EXITOSAMENTE");
    console.log("=".repeat(60));
    console.log("\n📋 RESUMEN FINAL:");
    console.log(`   • Pedido creado: ${pedidoGuardado.identificador_pedido}`);
    console.log(`   • Cliente: ${pedidoGuardado.cliente.nombre}`);
    console.log(
      `   • Productos: ${detallesGuardados.length} tipos de productos`
    );

    const totalUnidades = detallesGuardados.reduce(
      (sum, det) => sum + det.cantidad,
      0
    );
    console.log(`   • Unidades totales: ${totalUnidades}`);
    console.log(`   • Monto total: HNL ${pedidoGuardado.total}`);
    console.log(`   • Estado: ${pedidoGuardado.estado}`);
    console.log(`   • Método de pago: ${pedidoGuardado.metodo_pago}`);
    
    console.log(`\n📦 STOCK ACTUALIZADO:`);
    console.log(`   • ${producto1.nombre}: ${producto1Actualizado.stock} unidades`);
    console.log(`   • ${producto2.nombre}: ${producto2Actualizado.stock} unidades`);

    console.log("\n⚠️  INSTRUCCIONES PARA EL CLIENTE:");
    console.log(
      `   El cliente debe enviar comprobante de transferencia por WhatsApp`
    );
    console.log(`   Referencia: PED-${pedidoGuardado.identificador_pedido}`);
    console.log(`   Monto: HNL ${pedidoGuardado.total}`);
    console.log("\n" + "=".repeat(60));

  } catch (error) {
    console.error("\n❌ ERROR EN EL TEST:");
    console.error("Mensaje:", error.message);
    console.error("Stack:", error.stack);

    if (error.code === 11000) {
      console.error("\n⚠️  ERROR DE DUPLICADO:");
      console.error("   El modelo PedidoDetalle tiene un índice único que");
      console.error("   impide agregar el mismo producto más de una vez.");
      console.error(
        "\n   SOLUCIÓN: Remover {unique: true} del índice en Pedido-detalle.js"
      );
    }

    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Desconectado de MongoDB");
  }
}

// Ejecutar el test
testPedidoReal();