const mongoose = require("mongoose");
require("dotenv").config();
require("../models/Pedido-detalle");

const PedidoDetalle = mongoose.model("PedidoDetalle");

async function diagnosticarModelo() {
  await mongoose.connect(process.env.MONGO_URI);
  
  console.log("🔍 DIAGNÓSTICO DEL MODELO PedidoDetalle");
  console.log("=".repeat(50));
  
  // 1. Verificar el esquema
  console.log("\n📋 Esquema del modelo:");
  const schema = PedidoDetalle.schema;
  console.log("Campos requeridos:");
  schema.eachPath((pathname, schematype) => {
    if (schematype.isRequired) {
      console.log(`  - ${pathname}: ${schematype.instance}`);
    }
  });
  
  // 2. Verificar índices
  console.log("\n🔑 Índices del modelo:");
  const indexes = await PedidoDetalle.collection.indexes();
  indexes.forEach((index, i) => {
    console.log(`  ${i}. ${JSON.stringify(index.key)} ${index.unique ? '(ÚNICO)' : ''}`);
  });
  
  await mongoose.disconnect();
}

diagnosticarModelo().catch(console.error);