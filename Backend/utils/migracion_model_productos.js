// Backend/utils/limpiar-campo-unidades.js
const mongoose = require("mongoose");
require("dotenv").config();

const uri = process.env.MONGO_URI;

async function limpiar() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const resultado = await db.collection("productos").updateMany(
    { unidades: { $exists: true } },
    { $unset: { unidades: "" } }  // Elimina el campo completamente
  );

  console.log(`✅ Campo "unidades" eliminado de ${resultado.modifiedCount} documentos`);
  await mongoose.disconnect();
}

limpiar().catch(console.error);