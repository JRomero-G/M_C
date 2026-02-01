const mongoose = require("mongoose");

const pedidoDetalleSchema = new mongoose.Schema(
  {
    id_pedido: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pedido",
      required: true,
    },
    id_producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Producto",
      required: true,
    },
    nombre_producto: {
      type: String,
      required: true,
    },
    cantidad: {
      type: Number,
      required: true,
      min: 1,
      max: 999,
    },
    precio_unitario: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Índices normales
pedidoDetalleSchema.index({ id_pedido: 1 });
pedidoDetalleSchema.index({ id_producto: 1 });

// Middleware SIMPLIFICADO - SIN next() ASÍNCRONO
pedidoDetalleSchema.pre("save", function () {
  // Calcular subtotal si no está definido
  if (this.subtotal === undefined || this.subtotal === null) {
    this.subtotal = this.cantidad * this.precio_unitario;
  }

  // Redondear a 2 decimales
  if (this.subtotal) {
    this.subtotal = Math.round(this.subtotal * 100) / 100;
  }

  // NO llamar next() - en middleware asíncrono, mongoose lo maneja automáticamente
});

module.exports = mongoose.model("PedidoDetalle", pedidoDetalleSchema);
