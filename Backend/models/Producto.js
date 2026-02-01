// models/Producto.js - VERSIÓN LIMPIA
const mongoose = require("mongoose");

// Esquema para imágenes (subdocumento)
const imagenSchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, "La URL de la imagen es obligatoria"],
    match: [/^https?:\/\//, "Debe ser una URL válida"],
  },
  public_id: {
    type: String,
    required: [true, "El public_id de Cloudinary es obligatorio"],
  },
  es_principal: {
    type: Boolean,
    default: false,
  },
  nombre_original: String,
  tamaño: Number,
  formato: String,
});

// Esquema principal del producto
const productoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre del producto es obligatorio"],
      trim: true,
      maxlength: [100, "El nombre no puede exceder 100 caracteres"],
    },
    descripcion: {
      type: String,
      default: "",
      maxlength: [500, "La descripción no puede exceder 500 caracteres"],
    },
    precio_original: {
      type: Number,
      required: [true, "El precio original es obligatorio"],
      min: [0, "El precio no puede ser negativo"],
    },
    descuento: {
      type: Number,
      default: 0,
      min: [0, "El descuento no puede ser negativo"],
      max: [100, "El descuento no puede exceder 100%"],
    },
    precio_final: {
      type: Number,
      default: 0,
      min: [0, "El precio final no puede ser negativo"],
    },
    stock: {
      type: Number,
      required: [true, "El stock es obligatorio"],
      min: [0, "El stock no puede ser negativo"],
      default: 0,
    },
    imagenes: [imagenSchema],
    fecha_registro: {
      type: Date,
      default: Date.now,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    categoria: {
      type: String,
      default: "General",
    },
  },
  {
    timestamps: true,
  }
);

// ========== MIDDLEWARE SIMPLIFICADO ==========
productoSchema.pre("save", async function () {
  // Solo calcular si cambió precio_original o descuento
  if (this.isModified("precio_original") || this.isModified("descuento")) {
    const precioBase = this.precio_original || 0;
    const descuento = this.descuento || 0;

    if (descuento > 0) {
      this.precio_final = precioBase * (1 - descuento / 100);
    } else {
      this.precio_final = precioBase;
    }

    this.precio_final = Math.round(this.precio_final * 100) / 100;
  }
});

// Índices
productoSchema.index({ nombre: "text", descripcion: "text" });
productoSchema.index({ precio_final: 1 });
productoSchema.index({ activo: 1 });
productoSchema.index({ categoria: 1 });

// Métodos estáticos
productoSchema.statics.findActivos = function () {
  return this.find({ activo: true });
};

// Métodos de instancia
productoSchema.methods.formatearPrecio = function () {
  return `HNL ${this.precio_final.toFixed(2)}`;
};

productoSchema.methods.tieneStock = function (cantidad = 1) {
  return this.stock >= cantidad;
};

module.exports = mongoose.model("Producto", productoSchema);