

document.getElementById("login-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const usuario = document.getElementById("usuario").value.trim();
    const password = document.getElementById("password").value;

    console.log("🔐 Login attempt:", { usuario, password});

    // Validaciones básicas
    let isValid = true;

    if (!usuario) {
      mostrarError("usuario-error", "El usuario es obligatorio");
      isValid = false;
    } else {
      ocultarError("usuario-error");
    }

    if (!password) {
      mostrarError("password-error", "La contraseña es obligatoria");
      isValid = false;
    } else {
      ocultarError("password-error");
    }

    if (!isValid) return;

    // Mostrar loading
    const btnLogin = document.getElementById("btn-login");
    const loginText = document.getElementById("login-text");
    const loginLoading = document.getElementById("login-loading");

    loginText.style.display = "none";
    loginLoading.style.display = "inline-block";
    btnLogin.disabled = true;

    try {
      console.log("📡 Enviando request a:", `${BACKEND_URL}/usuarios/login`);

      const response = await fetch(`${BACKEND_URL}/usuarios/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ nombre: usuario, password }),
      });

      console.log("📊 Response status:", response.status);
      console.log("📊 Response ok:", response.ok);

      const result = await response.json();
      console.log("📦 Response data:", result);

      if (result.success) {
        console.log("✅ Login exitoso");
        console.log("🎫 Token recibido:", result.token ? "Sí" : "No");

        // Guardar token y usuario en localStorage
        localStorage.setItem("token", result.token);
        localStorage.setItem("usuarioActual", JSON.stringify(result.usuario));

        console.log("💾 Token guardado en localStorage");

        // Redirigir al dashboard
        window.location.href = "./Dashboard.html";
      } else {
        console.log("❌ Login fallido:", result.error);
        mostrarError(
          "password-error",
          result.error || "Credenciales incorrectas"
        );
      }
    } catch (error) {
      console.error("💥 Error en login:", error);
      console.error("💥 Error stack:", error.stack);
      mostrarError("password-error", "Error de conexión con el servidor");
    } finally {
      // Ocultar loading
      loginText.style.display = "inline-block";
      loginLoading.style.display = "none";
      btnLogin.disabled = false;
    }
  });

function mostrarError(elementId, mensaje) {
  const elemento = document.getElementById(elementId);
  elemento.textContent = mensaje;
  elemento.style.display = "block";
  elemento.style.color = "#dc3545";
}

function ocultarError(elementId) {
  const elemento = document.getElementById(elementId);
  elemento.style.display = "none";
}

// Verificar si ya está logueado
window.addEventListener("DOMContentLoaded", () => {
  console.log("🔍 Verificando autenticación previa...");
  const token = localStorage.getItem("token");
  if (token) {
    console.log("✅ Token encontrado, redirigiendo...");
    //window.location.href = "./Dashboard.html";
  } else {
    console.log("❌ No hay token, mostrando login");
  }
});

// Agrega esto a tu archivo Login.js
document.addEventListener('DOMContentLoaded', function() {
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const toggleIcon = togglePassword.querySelector('i');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            // Cambiar el tipo de input
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Cambiar el icono
            if (type === 'text') {
                toggleIcon.classList.remove('fa-eye');
                toggleIcon.classList.add('fa-eye-slash');
                togglePassword.classList.add('password-visible');
                togglePassword.setAttribute('aria-label', 'Ocultar contraseña');
                togglePassword.setAttribute('title', 'Ocultar contraseña');
            } else {
                toggleIcon.classList.remove('fa-eye-slash');
                toggleIcon.classList.add('fa-eye');
                togglePassword.classList.remove('password-visible');
                togglePassword.setAttribute('aria-label', 'Mostrar contraseña');
                togglePassword.setAttribute('title', 'Mostrar contraseña');
            }
            
            // Mantener el foco en el input
            passwordInput.focus();
        });
        
        // Opcional: Permitir activar con Enter/Space cuando el botón tiene foco
        togglePassword.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    }
});
