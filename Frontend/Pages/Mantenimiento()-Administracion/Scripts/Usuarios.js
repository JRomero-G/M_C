// ========== GESTIÓN DE USUARIOS (SOLO ADMIN) ==========

/**
 * Carga usuarios desde el backend
 */
async function cargarUsuariosDesdeBackend() {
  try {
    // Solo admin puede ver usuarios
    if (!AuthService.isAdmin()) {
      console.log("Usuario no autorizado para ver usuarios");
      return [];
    }

    console.log("👥 Cargando usuarios desde backend...");
    const response = await fetchAdmin(`${window.BACKEND_URL}/usuarios`);

    if (!response) {
      console.log("No se pudo cargar usuarios (posible falta de permisos)");
      return [];
    }

    const result = await response.json();

    if (result.success) {
      window.usuarios = result.usuarios || [];
      console.log(`✅ ${window.usuarios.length} usuarios cargados`);

      // Actualizar estadísticas
      const elementoUsuariosRegistrados = document.getElementById("usuarios-registrados");
      if (elementoUsuariosRegistrados) {
        elementoUsuariosRegistrados.textContent = window.usuarios.length;
      }

      // Actualizar tabla si estamos en la sección de usuarios
      if (document.getElementById("users-table")) {
        actualizarTablaUsuarios(window.usuarios);
      }

      return window.usuarios;
    } else {
      console.error("Error al cargar usuarios:", result.error);
      return [];
    }
  } catch (error) {
    console.error("Error al cargar usuarios:", error);
    return [];
  }
}

/**
 * Actualiza la tabla de usuarios
 */
function actualizarTablaUsuarios(usuariosData) {
  const tbody = document.getElementById("users-table");
  if (!tbody) return;

  tbody.innerHTML = "";

  usuariosData.forEach((usuario) => {
    const fila = document.createElement("tr");
    const claseRol = usuario.rol === "admin" ? "admin" : "" || usuario.rol === "tienda" ? "tienda" : "";

    fila.innerHTML = `
      <td>${usuario._id ? usuario._id.toString().substring(0, 8) + "..." : "N/A"}</td>
      <td>${usuario.nombre || usuario.email}</td>
      <td>${usuario.email}</td>
      <td><span class="${claseRol}">${
        usuario.rol === "admin" ? "Administrador Del Sistema" : usuario.rol === "tienda" ? "Administracion Tienda" : "Usuario"
      }</span></td>
      <td>${usuario.estado || "activo"}</td>
      <td>${
        usuario.ultimo_acceso
          ? new Date(usuario.ultimo_acceso).toLocaleDateString()
          : "N/A"
      }</td>
      <td class="table-actions">
        <button class="btn-secondary btn-sm" onclick="editarUsuario('${usuario._id}')">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-danger btn-sm" onclick="eliminarUsuario('${usuario._id}')">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(fila);
  });
}

/**
 * Muestra formulario para usuario (nuevo o editar)
 */
function mostrarFormularioUsuario(tipo, usuario = null) {
  const container = document.getElementById("form-usuario-container");
  const titulo = document.getElementById("form-usuario-titulo");
  const form = document.getElementById("form-usuario");

  if (!container || !titulo || !form) {
    console.error("Elementos del formulario de usuario no encontrados");
    return;
  }

  if (tipo === "nuevo") {
    titulo.textContent = "Registrar Nuevo Usuario";
    form.reset();
    document.getElementById("usuario-id").value = "";
    container.style.display = "block";
  } else if (tipo === "editar" && usuario) {
    titulo.textContent = "Editar Usuario";
    document.getElementById("usuario-id").value = usuario._id;
    document.getElementById("usuario-nombre").value = usuario.nombre || "";
    document.getElementById("usuario-email").value = usuario.email;
    document.getElementById("usuario-rol").value = usuario.rol;
    document.getElementById("usuario-estado").value = usuario.estado || "activo";
    document.getElementById("usuario-password").value = "";
    document.getElementById("usuario-password-confirm").value = "";
    container.style.display = "block";
  }
}

/**
 * Edita un usuario existente
 */
async function editarUsuario(id) {
  if (!AuthService.isAdmin()) {
    alert("Acceso denegado: Se requieren permisos de administrador");
    return;
  }

  try {
    const response = await fetchAdmin(`${window.BACKEND_URL}/usuarios/${id}`);
    if (!response) return;

    const result = await response.json();
    if (result.success) {
      mostrarFormularioUsuario("editar", result.usuario);
    } else {
      alert(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error("Error al cargar usuario:", error);
    alert("Error al cargar usuario para editar");
  }
}

/**
 * Elimina un usuario
 */
async function eliminarUsuario(id) {
  if (!AuthService.isAdmin()) {
    alert("Acceso denegado: Se requieren permisos de administrador");
    return;
  }

  const usuario = window.usuarios.find((u) => u._id === id);
  if (!usuario) {
    alert("Usuario no encontrado");
    return;
  }

  // No permitir eliminar al propio usuario
  const usuarioActual = AuthService.getUsuario();
  if (usuarioActual._id === id) {
    alert("No puedes eliminar tu propia cuenta");
    return;
  }

  if (
    !confirm(
      `¿Está seguro de que desea eliminar al usuario "${
        usuario.nombre || usuario.email
      }"?\n\nEsta acción no se puede deshacer.`
    )
  ) {
    return;
  }

  try {
    const response = await fetchAdmin(`${window.BACKEND_URL}/usuarios/${id}`, {
      method: "DELETE",
    });

    if (!response) return;

    const result = await response.json();
    if (result.success) {
      alert("✅ Usuario eliminado correctamente");
      await cargarUsuariosDesdeBackend();
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    alert("Error al eliminar usuario");
  }
}

/**
 * Guarda un usuario (crear o actualizar)
 */
async function guardarUsuario(e) {
  if (e) e.preventDefault();

  if (!AuthService.isAdmin()) {
    alert("Acceso denegado: Se requieren permisos de administrador");
    return;
  }

  // Obtener datos del formulario
  const id = document.getElementById("usuario-id")?.value;
  const nombre = document.getElementById("usuario-nombre")?.value.trim() || "";
  const email = document.getElementById("usuario-email")?.value.trim() || "";
  const rol = document.getElementById("usuario-rol")?.value || "";
  const estado = document.getElementById("usuario-estado")?.value || "activo";
  const password = document.getElementById("usuario-password")?.value || "";
  const passwordConfirm = document.getElementById("usuario-password-confirm")?.value || "";

  // Validaciones
  if (!nombre || !email || !rol) {
    alert("Por favor complete todos los campos obligatorios");
    return;
  }

  if (!validarEmail(email)) {
    alert("Por favor ingrese un email válido");
    return;
  }

  // Si es usuario nuevo o se está cambiando la contraseña
  if (!id || password) {
    if (password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== passwordConfirm) {
      alert("Las contraseñas no coinciden");
      return;
    }
  }

  const usuarioData = {
    nombre,
    email,
    rol,
    estado,
  };

  // Agregar contraseña solo si se proporcionó
  if (password) {
    usuarioData.password = password;
  }

  try {
    const url = id
      ? `${window.BACKEND_URL}/usuarios/${id}`
      : `${window.BACKEND_URL}/usuarios`;
    const method = id ? "PUT" : "POST";

    const response = await fetchAdmin(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(usuarioData),
    });

    if (!response) return;

    const result = await response.json();

    if (result.success) {
      alert(
        id
          ? "✅ Usuario actualizado correctamente"
          : "✅ Usuario creado correctamente"
      );

      // Ocultar formulario
      const formUsuarioContainer = document.getElementById("form-usuario-container");
      if (formUsuarioContainer) {
        formUsuarioContainer.style.display = "none";
      }

      // Recargar lista de usuarios
      await cargarUsuariosDesdeBackend();
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  } catch (error) {
    console.error("Error al guardar usuario:", error);
    alert("Error al guardar usuario");
  }
}

// Exportar funciones para uso global
window.cargarUsuariosDesdeBackend = cargarUsuariosDesdeBackend;
window.actualizarTablaUsuarios = actualizarTablaUsuarios;
window.mostrarFormularioUsuario = mostrarFormularioUsuario;
window.editarUsuario = editarUsuario;
window.eliminarUsuario = eliminarUsuario;
window.guardarUsuario = guardarUsuario;