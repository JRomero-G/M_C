const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuarios');

class AuthMiddleware {
    // ========== VERIFICAR TOKEN JWT ==========
    static async verificarToken(req, res, next) {
        try {
            // Obtener token del header
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    error: 'Acceso denegado. Token no proporcionado.'
                });
            }
            
            const token = authHeader.split(' ')[1];
            
            // Verificar token
            const decoded = jwt.verify(
                token, 
                process.env.JWT_SECRET || 'secret_key_desarrollo'
            );
            
            // Buscar usuario en la base de datos
            const usuario = await Usuario.findById(decoded.id);
            
            if (!usuario) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario no encontrado'
                });
            }
            
            // Verificar estado del usuario
            if (usuario.estado === 'inactivo') {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario desactivado. Contacta al administrador.'
                });
            }
            
            // Adjuntar usuario al request
            req.usuario = usuario;
            next();
            
        } catch (error) {
            console.error('Error en verificarToken:', error);
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token expirado. Inicia sesión nuevamente.'
                });
            }
            
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token inválido'
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }
    
    // ========== VERIFICAR ROL DE ADMINISTRADOR ==========
    static async verificarAdmin(req, res, next) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario no autenticado'
                });
            }
            
            if (req.usuario.rol !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Acceso denegado. Se requiere rol de administrador.'
                });
            }
            
            next();
        } catch (error) {
            console.error('Error en verificarAdmin:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }
    
    // ========== VERIFICAR ROL DE TIENDA ==========
    static async verificarTienda(req, res, next) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario no autenticado'
                });
            }
            
            if (req.usuario.rol !== 'tienda') {
                return res.status(403).json({
                    success: false,
                    error: 'Acceso denegado. Se requiere rol de tienda.'
                });
            }
            
            next();
        } catch (error) {
            console.error('Error en verificarTienda:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }
    
    // ========== VERIFICAR ROL ESPECÍFICO ==========
    static verificarRol(...rolesPermitidos) {
        return (req, res, next) => {
            try {
                if (!req.usuario) {
                    return res.status(401).json({
                        success: false,
                        error: 'Usuario no autenticado'
                    });
                }
                
                if (!rolesPermitidos.includes(req.usuario.rol)) {
                    return res.status(403).json({
                        success: false,
                        error: `Acceso denegado. Roles permitidos: ${rolesPermitidos.join(', ')}`
                    });
                }
                
                next();
            } catch (error) {
                console.error('Error en verificarRol:', error);
                res.status(500).json({
                    success: false,
                    error: 'Error interno del servidor'
                });
            }
        };
    }
    
    // ========== VERIFICAR PROPIEDAD (si es el dueño del recurso) ==========
    static verificarPropiedad(modelo, campoId = '_id') {
        return async (req, res, next) => {
            try {
                if (!req.usuario) {
                    return res.status(401).json({
                        success: false,
                        error: 'Usuario no autenticado'
                    });
                }
                
                // Si es admin, tiene acceso completo
                if (req.usuario.rol === 'admin') {
                    return next();
                }
                
                const id = req.params.id;
                const recurso = await modelo.findById(id);
                
                if (!recurso) {
                    return res.status(404).json({
                        success: false,
                        error: 'Recurso no encontrado'
                    });
                }
                
                // Verificar si el usuario es el dueño del recurso
                if (recurso.usuario && recurso.usuario.toString() !== req.usuario._id.toString()) {
                    return res.status(403).json({
                        success: false,
                        error: 'No tienes permiso para acceder a este recurso'
                    });
                }
                
                // Si el modelo tiene campo de usuario diferente
                if (recurso[campoId] && recurso[campoId].toString() !== req.usuario._id.toString()) {
                    return res.status(403).json({
                        success: false,
                        error: 'No tienes permiso para acceder a este recurso'
                    });
                }
                
                next();
            } catch (error) {
                console.error('Error en verificarPropiedad:', error);
                res.status(500).json({
                    success: false,
                    error: 'Error interno del servidor'
                });
            }
        };
    }
    
    // ========== VALIDAR CAMPOS DE ENTRADA ==========
    static validarCampos(schema) {
        return (req, res, next) => {
            try {
                const { error, value } = schema.validate(req.body, {
                    abortEarly: false,
                    stripUnknown: true
                });
                
                if (error) {
                    const errores = error.details.map(detalle => detalle.message);
                    return res.status(400).json({
                        success: false,
                        error: 'Errores de validación',
                        detalles: errores
                    });
                }
                
                // Reemplazar el body con los valores validados
                req.body = value;
                next();
            } catch (error) {
                console.error('Error en validarCampos:', error);
                res.status(500).json({
                    success: false,
                    error: 'Error interno del servidor'
                });
            }
        };
    }
    
    // ========== MANEJAR ERRORES ASINCRÓNICOS ==========
    static manejarErroresAsync(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
    
    // ========== LOGGER DE PETICIONES ==========
    static logger(req, res, next) {
        const timestamp = new Date().toISOString();
        const metodo = req.method;
        const url = req.originalUrl;
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent') || 'Desconocido';
        
        console.log(`[${timestamp}] ${metodo} ${url} - IP: ${ip} - User-Agent: ${userAgent}`);
        
        // Registrar también el usuario si está autenticado
        if (req.usuario) {
            console.log(`  👤 Usuario: ${req.usuario.email} (${req.usuario.rol})`);
        }
        
        // Capturar tiempo de respuesta
        const inicio = Date.now();
        res.on('finish', () => {
            const duracion = Date.now() - inicio;
            console.log(`  ⏱️  Duración: ${duracion}ms - Status: ${res.statusCode}`);
        });
        
        next();
    }
    
    // ========== RATE LIMITING (límite de peticiones) ==========
    static rateLimit(limite, intervalo) {
        const intentos = new Map();
        
        return (req, res, next) => {
            const ip = req.ip;
            const ahora = Date.now();
            
            if (!intentos.has(ip)) {
                intentos.set(ip, []);
            }
            
            const tiempos = intentos.get(ip);
            
            // Limpiar intentos fuera del intervalo
            const ventanaTiempo = ahora - intervalo;
            const intentosRecientes = tiempos.filter(tiempo => tiempo > ventanaTiempo);
            intentos.set(ip, intentosRecientes);
            
            if (intentosRecientes.length >= limite) {
                return res.status(429).json({
                    success: false,
                    error: 'Demasiadas peticiones. Intenta nuevamente más tarde.'
                });
            }
            
            intentosRecientes.push(ahora);
            next();
        };
    }
    
    // ========== CORS CONFIGURABLE ==========
    static cors(opciones = {}) {
        const defaults = {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true,
            maxAge: 86400 // 24 horas
        };
        
        const config = { ...defaults, ...opciones };
        
        return (req, res, next) => {
            res.header('Access-Control-Allow-Origin', config.origin);
            res.header('Access-Control-Allow-Methods', config.methods.join(', '));
            res.header('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
            res.header('Access-Control-Allow-Credentials', config.credentials);
            res.header('Access-Control-Max-Age', config.maxAge);
            
            if (req.method === 'OPTIONS') {
                return res.status(200).end();
            }
            
            next();
        };
    }
}

module.exports = AuthMiddleware;