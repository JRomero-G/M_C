// ========== SERVICIO DE AUTENTICACIÓN ==========
const AuthService = {
  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated: function() {
    const token = this.getToken();
    const usuario = this.getUsuario();
    return !!token && !!usuario;
  },

  /**
   * Obtiene el token del localStorage
   */
  getToken: function() {
    return localStorage.getItem('token');
  },

  /**
   * Obtiene los datos del usuario del localStorage
   */
  getUsuario: function() {
    const usuarioStr = localStorage.getItem('usuarioActual');
    return usuarioStr ? JSON.parse(usuarioStr) : null;
  },

  /**
   * Obtiene el rol del usuario
   */
  getRol: function() {
    const usuario = this.getUsuario();
    return usuario ? usuario.rol : null;
  },

  /**
   * Verifica si el usuario es administrador
   */
  isAdmin: function() {
    return this.getRol() === 'admin';
  },

  /**
   * Verifica si el usuario es tienda
   */
  isTienda: function() {
    return this.getRol() === 'tienda';
  },

  /**
   * Requiere autenticación - redirige al login si no está autenticado
   */
  requireAuth: function() {
    if (!this.isAuthenticated()) {
      window.location.href = '/Frontend/Pages/Mantenimiento()-Administracion/Login.html';
      return false;
    }
    return true;
  },

  /**
   * Obtiene los headers de autenticación para las peticiones
   */
  getAuthHeaders: function() {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  },

  /**
   * Cierra la sesión del usuario
   */
  logout: function() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioActual');
    window.location.href = '/Frontend/Pages/Mantenimiento()-Administracion/Login.html';
  },

  /**
   * Inicia sesión (para uso en login.html)
   */
  login: function(token, usuario) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuarioActual', JSON.stringify(usuario));
    window.location.href = '/Index.html';
  },

  /**
   * Actualiza los datos del usuario en localStorage
   */
  actualizarUsuario: function(nuevosDatos) {
    const usuarioActual = this.getUsuario();
    if (usuarioActual) {
      const usuarioActualizado = { ...usuarioActual, ...nuevosDatos };
      localStorage.setItem('usuarioActual', JSON.stringify(usuarioActualizado));
      return usuarioActualizado;
    }
    return null;
  }
};

// Hacer el servicio disponible globalmente
window.AuthService = AuthService;

// También exportar funciones individuales para compatibilidad
window.verificarAutenticacion = function() {
  if (!AuthService.isAuthenticated()) {
    window.location.href = '/Frontend/Pages/Mantenimiento()-Administracion/Login.html';
    return false;
  }
  return true;
};

console.log('✅ AuthService cargado correctamente');
