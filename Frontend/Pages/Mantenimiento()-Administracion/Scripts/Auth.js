// ========== AUTENTICACIÓN Y PERMISOS ==========

/**
 * Verifica la autenticación del usuario
 * @returns {boolean} true si está autenticado, false si no
 */
function verificarAutenticacion() {
  if (!AuthService.requireAuth()) {
    return false;
  }

  const usuario = AuthService.getUsuario();
  const rol = usuario?.rol;

  if (!rol) {
    alert("Error: No se pudo determinar el rol del usuario");
    AuthService.logout();
    return false;
  }

  console.log(`✅ Usuario autenticado: ${usuario.email} - Rol: ${rol}`);

  // Mostrar información del usuario
  mostrarInformacionUsuario(usuario);

  // Configurar permisos según el rol
  configurarPermisosPorRol(rol);

  return true;
}

/**
 * Muestra la información del usuario en la interfaz
 * @param {Object} usuario - Datos del usuario
 */
function mostrarInformacionUsuario(usuario) {
  // Mostrar nombre en el sidebar
  const nombreUsuarioElement = document.getElementById("nombre-usuario");
  const rolUsuarioElement = document.getElementById("rol");
  
  if (nombreUsuarioElement) {
    nombreUsuarioElement.textContent = usuario.nombre || usuario.email;
  }

  if (rolUsuarioElement) {
    if (usuario.rol === "admin") {
      rolUsuarioElement.textContent = "Administrador";
    } else if (usuario.rol === "tienda") {
      rolUsuarioElement.textContent = "Tienda";
    }
  }
}

/**
 * Configura los permisos según el rol del usuario
 * @param {string} rol - Rol del usuario (admin o tienda)
 */
function configurarPermisosPorRol(rol) {
  console.log(`🔐 Configurando permisos para rol: ${rol}`);

  const elementosAdmin = document.querySelectorAll(".admin-only");
  const seccionesAdmin = [
    "productos",
    "registrar",
    "actualizar",
    "usuarios",
  ];

  if (rol === "tienda") {
    // Ocultar elementos solo para admin
    elementosAdmin.forEach((el) => {
      el.style.display = "none";
    });

    // Desactivar botones del menú para admin
    seccionesAdmin.forEach((seccion) => {
      const boton = document.querySelector(`[data-section="${seccion}"]`);
      if (boton) {
        boton.style.display = "none";
      }
    });

    // Cambiar título del panel
    const logoTitle = document.querySelector(".logo h2");
    if (logoTitle) {
      logoTitle.textContent = "Panel Tienda";
    }

    console.log("✅ Panel configurado para usuario tienda");
  } else if (rol === "admin") {
    // Asegurar que todo esté visible
    elementosAdmin.forEach((el) => {
      el.style.display = "";
    });

    console.log("✅ Panel configurado para administrador");
  }
}

/**
 * Función de API con autenticación
 */
async function fetchConAuth(url, options = {}) {
  const headers = AuthService.getAuthHeaders();

  const config = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    // Si la respuesta es 401 o 403, redirigir al login
    if (response.status === 401 || response.status === 403) {
      alert("Sesión expirada. Por favor, inicie sesión nuevamente.");
      AuthService.logout();
      return null;
    }

    return response;
  } catch (error) {
    console.error("Error en fetch:", error);
    throw error;
  }
}

/**
 * Función específica para admin (verifica rol)
 */
async function fetchAdmin(url, options = {}) {
  if (!AuthService.isAdmin()) {
    alert("Acceso denegado: Se requieren permisos de administrador");
    return null;
  }

  return await fetchConAuth(url, options);
}

/**
 * Configura los estilos según el rol del usuario
 */
function aplicarEstilosPorRol() {
  const usuario = AuthService.getUsuario();
  if (!usuario) return;

  // Agregar clase CSS al body según el rol
  document.body.classList.add(`rol-${usuario.rol}`);

  // Estilos específicos para tienda
  if (usuario.rol === "tienda") {
    const style = document.createElement("style");
    style.textContent = `
      .rol-tienda .admin-only {
        display: none !important;
      }
      
      .rol-tienda .menu-btn[data-section="productos"],
      .rol-tienda .menu-btn[data-section="registrar"],
      .rol-tienda .menu-btn[data-section="actualizar"],
      .rol-tienda .menu-btn[data-section="usuarios"] {
        display: none !important;
      }
      
      .rol-tienda .user-badge {
        background-color: #17a2b8 !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Estilos específicos para admin
  if (usuario.rol === "admin") {
    const style = document.createElement("style");
    style.textContent = `
      .rol-admin .user-badge {
        background-color: #dc3545 !important;
      }
      
      .rol-admin .table-actions {
        opacity: 1;
        visibility: visible;
      }
    `;
    document.head.appendChild(style);
  }
}

// Exportar funciones para uso global
window.verificarAutenticacion = verificarAutenticacion;
window.mostrarInformacionUsuario = mostrarInformacionUsuario;
window.configurarPermisosPorRol = configurarPermisosPorRol;
window.fetchConAuth = fetchConAuth;
window.fetchAdmin = fetchAdmin;
window.aplicarEstilosPorRol = aplicarEstilosPorRol;