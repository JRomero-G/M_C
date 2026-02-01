const Joi = require('joi');

const Validaciones = {
    // Esquema para registro de usuario
    usuarioRegistro: Joi.object({
        nombre: Joi.string().min(3).max(100).required().messages({
            'string.empty': 'El nombre es requerido',
            'string.min': 'El nombre debe tener al menos 3 caracteres',
            'string.max': 'El nombre no puede exceder 100 caracteres'
        }),
        email: Joi.string().email().required().messages({
            'string.empty': 'El email es requerido',
            'string.email': 'Por favor ingresa un email válido'
        }),
        password: Joi.string().min(6).required().messages({
            'string.empty': 'La contraseña es requerida',
            'string.min': 'La contraseña debe tener al menos 6 caracteres'
        }),
        rol: Joi.string().valid('admin', 'tienda').default('tienda'),
        estado: Joi.string().valid('activo', 'inactivo').default('activo')
    }),
    
    // Esquema para login
    usuarioLogin: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),
    
    // Esquema para actualizar usuario
    usuarioActualizar: Joi.object({
        nombre: Joi.string().min(3).max(100),
        email: Joi.string().email(),
        rol: Joi.string().valid('admin', 'tienda'),
        estado: Joi.string().valid('activo', 'inactivo'),
        password: Joi.string().min(6)
    }).min(1), // Al menos un campo debe ser proporcionado
    
    // Esquema para cambiar estado
    cambiarEstado: Joi.object({
        estado: Joi.string().valid('activo', 'inactivo').required()
    }),
    
    // Esquema para producto
    producto: Joi.object({
        nombre: Joi.string().min(3).max(200).required(),
        descripcion: Joi.string().max(1000),
        precio_original: Joi.number().min(0).required(),
        descuento: Joi.number().min(0).max(100).default(0),
        stock: Joi.number().integer().min(0).required(),
        categoria: Joi.string().required(),
        imagenes: Joi.array().items(Joi.object({
            url: Joi.string().uri().required(),
            public_id: Joi.string().required(),
            es_principal: Joi.boolean().default(false)
        }))
    }),
    
    // Esquema para pedido
    pedido: Joi.object({
        cliente: Joi.object({
            nombre: Joi.string().required(),
            email: Joi.string().email().required(),
            telefono: Joi.string().required(),
            direccion: Joi.string().required()
        }).required(),
        productos: Joi.array().items(Joi.object({
            producto: Joi.string().required(),
            cantidad: Joi.number().integer().min(1).required(),
            precio_unitario: Joi.number().min(0).required()
        })).min(1).required(),
        metodo_pago: Joi.string().valid('tarjeta', 'transferencia').required(),
        envio_tipo: Joi.string().valid('envio', 'recoger').required(),
        total: Joi.number().min(0).required()
    })
};

module.exports = Validaciones;