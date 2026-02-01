// test/test-api-pedidos.js
const axios = require('axios');

const API_URL = 'http://localhost:3000/api'; // Ajusta según tu configuración

async function testCrearPedidoAPI() {
  console.log("🧪 TEST: Creando pedido desde API REST");
  console.log("=".repeat(60));

  try {
    const pedidoData = {
      cliente: {
        nombre: "María García",
        telefono: "+504 9999-8888",
        correo: "maria.garcia@email.com"
      },
      metodo_pago: "transferencia",
      envio_info: {
        tipo: "domicilio",
        costo_extra: 250,
        direccion: "Colonia Palmira, Casa #45, Tegucigalpa",
        estado: "pendiente"
      },
      carrito: [
        {
          id_producto: "6939297cbcd9e2eec6597415", // Silla
          cantidad: 1,
          precio_unitario: 215.28
        },
        {
          id_producto: "69399950bcd9e2eec65974d4", // Cama
          cantidad: 1,
          precio_unitario: 10604.6
        }
      ],
      notas: "Pedido de prueba desde Postman/Frontend"
    };

    console.log("📤 Enviando solicitud POST /api/pedidos");
    console.log("📝 Datos del pedido:", JSON.stringify(pedidoData, null, 2));

    const response = await axios.post(`${API_URL}/pedidos`, pedidoData);
    
    console.log("\n✅ RESPUESTA DEL SERVIDOR:");
    console.log("Status:", response.status);
    console.log("Datos:", JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log("\n🎉 Pedido creado exitosamente!");
      console.log("📋 Información del pedido:");
      console.log("   ID:", response.data.pedido.identificador_pedido);
      console.log("   Total: HNL", response.data.pedido.total);
      console.log("   Estado:", response.data.pedido.estado);
      
      if (response.data.instrucciones) {
        console.log("\n📲 Instrucciones para el cliente:");
        console.log("   Mensaje:", response.data.instrucciones.mensaje);
        if (response.data.instrucciones.datos_transferencia) {
          console.log("   Banco:", response.data.instrucciones.datos_transferencia.banco);
          console.log("   Referencia:", response.data.instrucciones.datos_transferencia.referencia);
        }
      }
    }

  } catch (error) {
    console.error("\n❌ ERROR:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Error del servidor:", error.response.data.error);
      if (error.response.data.detalles) {
        console.error("Detalles:", error.response.data.detalles);
      }
    } else if (error.request) {
      console.error("No se recibió respuesta del servidor");
      console.error("Verifica que el servidor esté corriendo en", API_URL);
    } else {
      console.error("Error:", error.message);
    }
  }
  
  console.log("\n" + "=".repeat(60));
}

// Ejecutar la prueba
testCrearPedidoAPI();