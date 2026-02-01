// ========== GESTIÓN DE IMÁGENES (UI solamente) ==========

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
  window.imagenesRegistro = [];

  files.forEach((file, index) => {
    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!tiposPermitidos.includes(file.type)) {
      alert(`"${file.name}" no es una imagen válida`);
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      window.imagenesRegistro.push(file);
      mostrarImagenPreview(e.target.result, previewContainer, true);
    };
    reader.readAsDataURL(file);
  });

  actualizarContadorImagenes();
}

function manejarImagenesActualizar(e) {
  if (!AuthService.isAdmin()) return;

  const files = Array.from(e.target.files);
  const previewContainer = document.getElementById("preview-nuevas-imagenes");

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      window.imagenesActualizacion.push(file);
      mostrarImagenPreview(e.target.result, previewContainer, false);
    };
    reader.readAsDataURL(file);
  });
}

function mostrarImagenPreview(imgUrl, container, esRegistro) {
  const index = esRegistro
    ? window.imagenesRegistro.length - 1
    : window.imagenesActualizacion.length - 1;

  const div = document.createElement("div");
  div.className = "imagen-preview";
  div.style.position = "relative";
  div.style.display = "inline-block";
  div.style.margin = "10px";

  div.innerHTML = `
    <img src="${imgUrl}" style="width:100px;height:100px;object-fit:cover;">
    <button onclick="eliminarImagenPreview(this, ${index}, ${esRegistro})"
            style="position:absolute;top:5px;right:5px;
                   background:#dc3545;color:white;border:none;
                   border-radius:50%;width:25px;height:25px;cursor:pointer;">
      <i class="fas fa-times"></i>
    </button>
  `;
  container.appendChild(div);
}

function eliminarImagenPreview(boton, index, esRegistro) {
  if (!AuthService.isAdmin()) return;

  if (!confirm("¿Quitar imagen seleccionada?")) return;

  if (esRegistro) {
    window.imagenesRegistro.splice(index, 1);
  } else {
    window.imagenesActualizacion.splice(index, 1);
  }

  boton.parentElement.remove();
}

function actualizarContadorImagenes() {
  const files = document.getElementById("product-images")?.files || [];
  const label = document.querySelector('label[for="product-images"]');
  if (!label) return;

  let contador = document.getElementById("contador-imagenes");
  if (!contador) {
    contador = document.createElement("span");
    contador.id = "contador-imagenes";
    contador.style.marginLeft = "10px";
    contador.style.color = "#666";
    label.appendChild(contador);
  }

  contador.textContent = `(${files.length} imagen${files.length !== 1 ? "es" : ""})`;
}

// Exportes UI
window.manejarImagenesRegistro = manejarImagenesRegistro;
window.manejarImagenesActualizar = manejarImagenesActualizar;
window.actualizarContadorImagenes = actualizarContadorImagenes;
