const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
  identificador_pedido: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    match: [/^VENT-\d{6}-\d{2}$/, 'Formato de ID inválido. Debe ser VENT-000001-25']
  },
  cliente: {
    nombre: { 
      type: String, 
      required: [true, 'El nombre del cliente es obligatorio'],
      trim: true,
      maxlength: [100, 'El nombre no puede exceder 100 caracteres']
    },
    telefono: { 
      type: String, 
      required: [true, 'El teléfono es obligatorio'],
      match: [/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/, 'Ingrese un teléfono válido']
    },
    correo: { 
      type: String, 
      required: [true, 'El correo es obligatorio'],
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Ingrese un correo válido']
    }
  },
  metodo_pago: {
    type: String,
    enum: {
      values: ['tarjeta', 'transferencia'],
      message: 'Método de pago no válido. Use: tarjeta o transferencia'
    },
    required: true
  },
  envio_info: {
    tipo: {
      type: String,
      enum: ['recogida', 'domicilio'],
      default: 'recogida',
      required: true
    },
    costo_extra: {
      type: Number,
      default: 0,
      min: [0, 'El costo de envío no puede ser negativo']
    },
    direccion: {
      type: String,
      required: function() {
        return this.envio_info.tipo === 'domicilio';
      }
    },
    estado: {
      type: String,
      enum: ['pendiente', 'en_camino', 'entregado'],
      default: 'pendiente'
    }
  },
  total: {
    type: Number,
    required: true,
    min: [0.01, 'El total debe ser mayor a 0']
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'El subtotal no puede ser negativo']
  },
  fecha_pedido: {
    type: Date,
    default: Date.now
  },
  estado: {
    type: String,
    enum: {
      values: ['comprobante_pendiente', 'revision', 'confirmado', 'cancelado','completado','nulo'],
      message: 'Estado no válido'
    },
    default: function() {
      return this.metodo_pago === 'transferencia' ? 'comprobante_pendiente' : 'en_revision';
    }
  },
  // Campos para transferencia
  comprobante_info: {
    referencia_cliente: String,
    monto_depositado: Number,
    fecha_deposito: Date,
    verificado_por: String,
    fecha_verificacion: Date
  },
  // Campos para tarjeta (PixelPay)
  pago_info: {
    transaction_id: String,
    ultimos_digitos: String,
    metodo_tarjeta: String,
    fecha_aprobacion: Date
  },
  notas: {
    type: String,
    maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual para obtener los detalles del pedido
pedidoSchema.virtual('detalles', {
  ref: 'PedidoDetalle',
  localField: '_id',
  foreignField: 'id_pedido'
});

// Índices para búsquedas
pedidoSchema.index({ 'cliente.correo': 1 });
pedidoSchema.index({ estado: 1 });
pedidoSchema.index({ fecha_pedido: -1 });
pedidoSchema.index({ total: 1 });

// Método para calcular días desde el pedido
pedidoSchema.methods.diasDesdePedido = function() {
  const ahora = new Date();
  const diffTime = Math.abs(ahora - this.fecha_pedido);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

module.exports = mongoose.model('Pedido', pedidoSchema);