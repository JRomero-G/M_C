// models/Usuarios.js - VERSIÓN CORREGIDA
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");//encriptar el password

const usuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "El email es obligatorio"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "La contraseña es obligatoria"],
    },
    rol: {
      type: String,
      enum: ["admin", "tienda"],
      default: "tienda",
    },
    estado: {
      type: String,
      enum: ["activo", "inactivo"],
      default: "activo",
    },
    fecha_registro: {
      type: Date,
      default: Date.now,
    },
    ultimo_acceso: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Método para comparar contraseñas
usuarioSchema.methods.compararPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Middleware para encriptar contraseña 
usuarioSchema.pre("save", async function () {
  // Solo encriptar si la contraseña fue modificada
  if (!this.isModified("password")) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// No mostrar password en las respuestas JSON
usuarioSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  },
});

const Usuario = mongoose.model("Usuario", usuarioSchema);
module.exports = Usuario;
