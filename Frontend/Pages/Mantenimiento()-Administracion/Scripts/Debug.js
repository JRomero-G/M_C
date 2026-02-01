// ========== DEBUG.JS ==========
// Archivo temporal para depurar problemas

document.addEventListener('DOMContentLoaded', function() {
  console.log('=== INICIANDO DEPURACIÓN ===');
  
  // Verificar si AuthService existe
  console.log('AuthService existe:', typeof AuthService !== 'undefined');
  if (typeof AuthService !== 'undefined') {
    console.log('AuthService métodos:');
    console.log('- isAuthenticated:', typeof AuthService.isAuthenticated);
    console.log('- getUsuario:', typeof AuthService.getUsuario);
    console.log('- getRol:', typeof AuthService.getRol);
  }
  
  // Verificar si el usuario está autenticado
  if (typeof AuthService !== 'undefined' && AuthService.isAuthenticated) {
    const usuario = AuthService.getUsuario();
    console.log('Usuario autenticado:', usuario);
  } else {
    console.log('Usuario NO autenticado');
  }
  
  // Verificar que las funciones principales existan
  console.log('verificarAutenticacion existe:', typeof verificarAutenticacion !== 'undefined');
  console.log('actualizarDashboard existe:', typeof actualizarDashboard !== 'undefined');
  console.log('configurarNavegacion existe:', typeof configurarNavegacion !== 'undefined');
  
  // Verificar elementos HTML críticos
  console.log('Elementos HTML críticos:');
  console.log('- dashboard-section:', document.getElementById('dashboard-section'));
  console.log('- section-title:', document.getElementById('section-title'));
  console.log('- numero-productos:', document.getElementById('numero-productos'));
  console.log('- pedidos-recientes:', document.getElementById('pedidos-recientes'));
  
  console.log('=== FIN DEPURACIÓN ===');
});