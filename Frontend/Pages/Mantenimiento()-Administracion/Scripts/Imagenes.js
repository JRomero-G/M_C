// ========== IMÁGENES PRODUCTOS - UI y Gestión ==========

// Variables globales para imágenes
window.imagenesRegistro = [];
window.imagenesActualizacion = [];
window.imagenesActualesProducto = [];
window.imagenesMarcadasParaEliminar = [];

/**
 * Maneja la selección de imágenes en el formulario de REGISTRO
 */
function manejarImagenesRegistro(e) {
  if (!AuthService.isAdmin()) return;

  const files = Array.from(e.target.files);
  const previewContainer = document.getElementById("preview-imagenes");

  if (files.length > 10) {
    alert("Máximo 10 imágenes por producto");
    e.target.value = "";
    return;
  }

  previewContainer.innerHTML = "";
  //window.imagenesRegistro = [];

  files.forEach((file, index) => {
    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!tiposPermitidos.includes(file.type)) {
      alert(`"${file.name}" no es una imagen válida`);
      return;
    }

    window.imagenesRegistro.push(file);
  });

  mostrarPreviewRegistroCompleto();
  actualizarContadorImagenesRegistro();
}

/**
 * Elimina imagen del formulario de REGISTRO
 */
function eliminarImagenRegistro(index) {
  if (!window.imagenesRegistro || index >= window.imagenesRegistro.length) {
    mostrarNotificacion("Error: Imagen no encontrada", "error");
    return;
  }

  const nombre = window.imagenesRegistro[index]?.name || `Imagen ${index + 1}`;

  mostrarModalConfirmacion({
    titulo: 'Eliminar Imagen',
    mensaje: `¿Eliminar "${nombre}"? Esta acción es permanente.`,
    tipo: 'danger',
    icono: 'fa-trash',
    textoConfirmar: 'Eliminar',
    textoCancelar: 'Cancelar'
  }).then((confirmado) => {
    if (!confirmado) return;

    window.imagenesRegistro.splice(index, 1);
    mostrarPreviewRegistroCompleto();
    actualizarContadorImagenesRegistro(); // ← AGREGAR esta línea

  // Si ya no quedan imágenes, limpiar el input visualmente
  if (window.imagenesRegistro.length === 0) {
    const inputFile = document.getElementById("product-images");
    if (inputFile) inputFile.value = "";
  }
    mostrarNotificacion(`Imagen eliminada: ${nombre}`, "success");
  });
}

/**
 * Actualiza el preview completo del registro
 */
function mostrarPreviewRegistroCompleto() {
  const container = document.getElementById("preview-imagenes");
  if (!container) return;
  
  container.innerHTML = "";
  window.imagenesRegistro.forEach((file, idx) => {
    const url = URL.createObjectURL(file);

    const div = document.createElement("div");
    div.style.cssText = `
      display:inline-block;
      position:relative;
      margin:10px;
      border:1px solid #ddd;
      padding:5px;
      border-radius:5px;
    `;

    div.innerHTML = `
      <img src="${url}" style="width:100px;height:100px;object-fit:cover;border-radius:3px;">
      <button type="button" onclick="eliminarImagenRegistro(${idx})"
              style="position:absolute;top:5px;right:5px;background:#dc3545;color:white;border:none;
                     width:25px;height:25px;border-radius:10%;cursor:pointer;" title="Eliminar">
        <i class="fa fa-trash" style="color:white"></i>
      </button>
    `;
      container.appendChild(div);
  });
}

/**
 * Maneja la selección de imágenes en el formulario de ACTUALIZACIÓN
 */
function manejarImagenesActualizar(e) {
  if (!AuthService.isAdmin()) return;

  const files = Array.from(e.target.files);
  // Limpiar antes de agregar para evitar duplicados en reselección
  //window.imagenesActualizacion = [];
  
  files.forEach(file => {
    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!tiposPermitidos.includes(file.type)) {
      alert(`"${file.name}" no es una imagen válida`);
      return;
    }
    window.imagenesActualizacion.push(file);
  });

  
  // Actualizar contador
  e.target.value = ""; // Limpiar input
  actualizarContadorImagenesNuevas();
  mostrarPreviewNuevasImagenes();
}


/**
 * Actualiza el contador de imágenes nuevas seleccionadas
 */
function actualizarContadorImagenesNuevas() {
  const contador = document.getElementById("contador-imagenes-nuevas");
  if (!contador) return;
  
  const cantidad = window.imagenesActualizacion?.length || 0;
  contador.textContent = `${cantidad} imagen${cantidad !== 1 ? 'es' : ''} seleccionada${cantidad !== 1 ? 's' : ''}`;
  
  if (cantidad > 0) {
    contador.style.color = "#28a745";
  } else {
    contador.style.color = "#666";
  }
}


/**
 * Muestra previsualización de NUEVAS imágenes seleccionadas
 */
function mostrarPreviewNuevasImagenes() {
  const container = document.getElementById("preview-nuevas-imagenes");
  if (!container) return;

  container.innerHTML = "";

  if (!window.imagenesActualizacion || window.imagenesActualizacion.length === 0) {
    return;
  }

  window.imagenesActualizacion.forEach((file, index) => {
    const url = URL.createObjectURL(file);

    const div = document.createElement("div");
    div.style.cssText = `
      display:inline-block;
      position:relative;
      margin:10px;
      border:1px solid #ddd;
      padding:5px;
      border-radius:5px;
    `;

    div.innerHTML = `
      <img src="${url}" style="width:100px;height:100px;object-fit:cover;border-radius:3px;">
      <button type="button" onclick="eliminarImagenNueva(${index})"
              style="position:absolute;top:5px;right:5px;background:#dc3545;color:white;border:none;
                     width:25px;height:25px;border-radius:10%;cursor:pointer;" title="Eliminar">
        <i class="fa fa-trash" style="color:white"></i>
      </button>
    `;

    container.appendChild(div);
  });
}

/**
 * Elimina una imagen NUEVA (no guardada aún)
 */
function eliminarImagenNueva(index) {
  if (!window.imagenesActualizacion || !Array.isArray(window.imagenesActualizacion)) {
    mostrarNotificacion("Error: No hay imágenes para eliminar", "error");
    return;
  }

  if (index < 0 || index >= window.imagenesActualizacion.length) {
    console.error("Índice inválido");
    return;
  }

  const img = window.imagenesActualizacion[index];
  const nombre = img?.name || img?.nombre_original || `Imagen ${index + 1}`;

  mostrarModalConfirmacion({
    titulo: 'Eliminar Imagen',
    mensaje: `¿Eliminar "${nombre}"? Esta acción es permanente.`,
    tipo: 'danger',
    icono: 'fa-trash',
    textoConfirmar: 'Eliminar',
    textoCancelar: 'Cancelar'
  }).then((confirmado) => {
    if (!confirmado) return;

    window.imagenesActualizacion.splice(index, 1);
    mostrarPreviewNuevasImagenes();
    actualizarContadorImagenesNuevas();
    mostrarNotificacion(`Imagen eliminada: ${nombre}`, "success");
  });
}

/**
 * Actualiza el contador de imágenes en registro
 */
function actualizarContadorImagenesRegistro() {
  const contador = document.getElementById("contador-imagenes-registro");
  if (!contador) return;
  
  const cantidad = window.imagenesRegistro?.length || 0;
  contador.textContent = `${cantidad} imagen${cantidad !== 1 ? 'es' : ''} seleccionada${cantidad !== 1 ? 's' : ''}`;
  
  if (cantidad > 0) {
    contador.style.color = "#28a745";
  } else {
    contador.style.color = "#666";
  }
  
}

/**
 * Limpia las variables de imágenes al cerrar formularios
 */
function limpiarVariablesImagenes() {
  window.imagenesRegistro = [];
  window.imagenesActualizacion = [];
  window.imagenesActualesProducto = [];
  window.imagenesMarcadasParaEliminar = [];
}

/**
 * Obtiene las imágenes para el registro (para usar en registrarProducto)
 */
function obtenerImagenesRegistro() {
  return window.imagenesRegistro;
}

/**
 * Obtiene las imágenes nuevas para actualización
 */
function obtenerImagenesActualizacion() {
  return window.imagenesActualizacion;
}

// Conectar listeners de inputs de imágenes una sola vez
document.addEventListener("DOMContentLoaded", () => {
  const inputRegistro = document.getElementById("product-images");
  if (inputRegistro) {
    inputRegistro.addEventListener("change", manejarImagenesRegistro);
  }

  const inputActualizar = document.getElementById("update-images");
  if (inputActualizar) {
    inputActualizar.addEventListener("change", manejarImagenesActualizar);
  }
});


// Exportar al objeto global
window.manejarImagenesRegistro = manejarImagenesRegistro;
window.manejarImagenesActualizar = manejarImagenesActualizar;
window.eliminarImagenRegistro = eliminarImagenRegistro;
window.eliminarImagenNueva = eliminarImagenNueva;
window.mostrarPreviewNuevasImagenes = mostrarPreviewNuevasImagenes;
window.limpiarVariablesImagenes = limpiarVariablesImagenes;
window.obtenerImagenesRegistro = obtenerImagenesRegistro;
window.obtenerImagenesActualizacion = obtenerImagenesActualizacion;
window.actualizarContadorImagenesRegistro = actualizarContadorImagenesRegistro;
window.actualizarContadorImagenesNuevas = actualizarContadorImagenesNuevas;