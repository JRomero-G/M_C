// ========== GESTIÓN DE PEDIDOS ==========

// Variable global para pedidos
if (!window.todosLosPedidos) {
  window.todosLosPedidos = [];
}

// ========== FUNCIONES AUXILIARES ==========

/**
 * Obtiene la fecha de un pedido (maneja diferentes nombres de campo)
 */
function obtenerFechaPedido(pedido) {
  // Probar diferentes campos posibles de fecha
  const camposFecha = [
    "fecha_pedido",
    "createdAt",
    "fecha",
    "fecha_creacion",
    "date",
  ];

  for (const campo of camposFecha) {
    if (pedido[campo]) {
      return pedido[campo];
    }
  }

  return null;
}

/**
 * Obtiene el estado para mostrar en el dashboard
 */
function obtenerEstadoParaMostrar(estado) {
  if (!estado) return "Pendiente";

  const estadosMap = {
    pendiente: "Comprobante Pendiente",
    comprobante_pendiente: "Comprobante Pendiente",
    revision: "En Revisión",
    confirmado: "Confirmado",
    en_proceso: "En Proceso",
    enviado: "Enviado",
    entregado: "Entregado",
    completado: "Completado",
    cancelado: "Cancelado",
  };

  return estadosMap[estado.toLowerCase()] || estado;
}

/**
 * Obtiene la clase CSS para el estado
 */
function obtenerClaseEstado(estado) {
  if (!estado) return "status-pendiente";

  const estadoLower = estado.toLowerCase();

  if (
    estadoLower.includes("pendiente") ||
    estadoLower.includes("comprobante")
  ) {
    return "status-pendiente";
  } else if (estadoLower.includes("revision")) {
    return "status-revision";
  } else if (
    estadoLower.includes("confirmado") ||
    estadoLower.includes("entregado") ||
    estadoLower.includes("completado")
  ) {
    return "status-confirmado";
  } else if (
    estadoLower.includes("enviado") ||
    estadoLower.includes("proceso")
  ) {
    return "status-proceso";
  } else if (estadoLower.includes("cancelado")) {
    return "status-cancelado";
  }

  return "status-pendiente";
}

// ========== FUNCIONES DE CARGA DE DATOS ==========

/**
 * Carga pedidos desde el backend
 */
async function cargarPedidosDesdeBackend() {
  try {
    console.log("📦 Cargando pedidos desde backend...");
    console.log("👤 Rol actual:", AuthService.getRol());

    const response = await fetchConAuth(`${window.BACKEND_URL}/pedidos`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response) {
      console.log("❌ No hay respuesta del servidor");
      return [];
    }

    const result = await response.json();
    console.log("📊 Resultado de pedidos:", result);

    if (result.success) {
      console.log(`✅ ${result.pedidos?.length || 0} pedidos cargados`);
      return result.pedidos || [];
    } else {
      console.error("❌ Error al cargar pedidos:", result.error);
      return [];
    }
  } catch (error) {
    console.error("💥 Error en cargarPedidosDesdeBackend:", error);
    return [];
  }
}

/**
 * Carga datos iniciales de pedidos
 */
async function cargarDatosInicialesPedidos() {
  try {
    if (!window.todosLosPedidos || window.todosLosPedidos.length === 0) {
      console.log("📦 Cargando pedidos iniciales...");
      window.todosLosPedidos = await cargarPedidosDesdeBackend();
      console.log(`📦 ${window.todosLosPedidos.length} pedidos cargados`);
    }

    // Cargar pedidos del mes actual por defecto
    cargarPedidosFiltrados("mes");
  } catch (error) {
    console.error("Error al cargar datos iniciales:", error);
  }
}

// ========== FUNCIONES DE VISUALIZACIÓN ==========

/* Carga y muestra los pedidos recientes en el dashboard
 
function cargarPedidosRecientes() {
  const tbody = document.getElementById("pedidos-recientes");
  if (!tbody) {
    console.error("❌ No se encontró el elemento pedidos-recientes");
    return;
  }

  tbody.innerHTML = "";

  // Verificar si hay pedidos cargados
  if (!window.todosLosPedidos || window.todosLosPedidos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 20px;">
          No hay pedidos recientes
        </td>
      </tr>
    `;
    console.log("⚠️ No hay pedidos cargados para mostrar");
    return;
  }

  console.log(
    `📊 Mostrando ${Math.min(
      window.todosLosPedidos.length,
      10
    )} pedidos recientes`
  );

  // Ordenar pedidos por fecha (más recientes primero) y mostrar solo 10
  const pedidosOrdenados = [...window.todosLosPedidos].sort((a, b) => {
    try {
      const fechaA = obtenerFechaPedido(a);
      const fechaB = obtenerFechaPedido(b);
      const dateA = fechaA ? new Date(fechaA) : new Date(0);
      const dateB = fechaB ? new Date(fechaB) : new Date(0);
      return dateB - dateA;
    } catch (e) {
      return 0;
    }
  });

  const pedidosMostrar = pedidosOrdenados.slice(0, 10);

  if (pedidosMostrar.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 20px;">
          No hay pedidos recientes
        </td>
      </tr>
    `;
    return;
  }

  pedidosMostrar.forEach((pedido) => {
    const fila = document.createElement("tr");
    const estadoParaMostrar = obtenerEstadoParaMostrar(pedido.estado);
    const claseEstado = obtenerClaseEstado(pedido.estado);

    // Obtener información del cliente
    const nombreCliente =
      pedido.cliente?.nombre || pedido.cliente_nombre || "Cliente";

    // Obtener información de envío
    const tipoEnvio =
      pedido.envio_info?.tipo || pedido.tipo_entrega || "recoger";
    const envioParaMostrar =
      tipoEnvio === "domicilio" || tipoEnvio === "envio"
        ? "Envío"
        : "Recoger en tienda";

    // Usar identificador_pedido si existe, si no usar _id
    const identificador =
      pedido.identificador_pedido || `PED-${pedido._id?.substring(0, 8) || ""}`;

    fila.innerHTML = `
      <td>${identificador}</td>
      <td>${nombreCliente}</td>
      <td>${pedido.metodo_pago === "tarjeta" ? "Tarjeta" : "Transferencia"}</td>
      <td>${envioParaMostrar}</td>
      <td>HNL ${(pedido.total || 0).toFixed(2)}</td>
      <td>${formatearFecha(obtenerFechaPedido(pedido))}</td>
      <td><span class="${claseEstado}">${estadoParaMostrar}</span></td>
    `;
    tbody.appendChild(fila);
  });

  console.log(`✅ ${pedidosMostrar.length} pedidos recientes mostrados`);
}

*/

/* Carga y muestra la tabla completa de pedidos en la sección de gestión version 1
async function cargarTablaPedidos() {
  const tbody = document.getElementById("tabla-pedidos");
  if (!tbody) return;

  tbody.innerHTML = "";

  try {
    const pedidosData = await cargarPedidosDesdeBackend();

    if (pedidosData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="11" style="text-align: center; padding: 20px;">
            No hay pedidos para mostrar
          </td>
        </tr>
      `;
      return;
    }

    pedidosData.forEach((pedido) => {
      const fila = document.createElement("tr");
      const estadoParaMostrar = obtenerEstadoParaMostrar(pedido.estado);
      const claseEstado = obtenerClaseEstado(pedido.estado);

      // Obtener información del cliente
      const nombreCliente = pedido.cliente?.nombre || 
                           pedido.cliente_nombre || 
                           "Cliente no especificado";
      
      const telefonoCliente = pedido.cliente?.telefono || 
                             pedido.cliente?.phone || 
                             pedido.telefono || 
                             "N/A";
      
      // Obtener información de envío
      const tipoEnvio = pedido.envio_info?.tipo || pedido.tipo_entrega || "recoger";
      const envioParaMostrar = tipoEnvio === "domicilio" || tipoEnvio === "envio" ? "Envío Solicitado" : "Recoger en tienda";
      const costoEnvio = pedido.envio_info?.costo_extra || pedido.costo_envio || 0;

      // Usar identificador_pedido si existe, si no usar _id
      const identificador = pedido.identificador_pedido || `PED-${pedido._id?.substring(0, 8) || ''}`;

      // Determinar qué botones mostrar según el rol
      let botonesAcciones = "";
      
      if (AuthService.isAdmin()) {
        // Administrador: ver historial, actualizar estado y eliminar
        botonesAcciones = `
          <div class="btn-group" role="group" style="display: flex; gap: 5px;">
            <button class="btn-secondary btn-sm" onclick="actualizarEstadoPedido('${pedido._id}')" title="Actualizar estado">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        `;
      } else if (AuthService.isTienda()) {
        // Usuario tienda: solo puede actualizar estado en pedidos por transferencia pendientes
        const puedeActualizar = pedido.metodo_pago === "transferencia" &&
                              (pedido.estado === "comprobante_pendiente" || 
                               pedido.estado === "revision" ||
                               pedido.estado === "pendiente" ||
                               pedido.estado === "cancelado" ||
                               pedido.estado === "confirmado");
        
        if (puedeActualizar) {
          botonesAcciones = `
            <div class="btn-group" role="group" style="display: flex; gap: 5px;">
              <button class="btn-secondary btn-sm" onclick="actualizarEstadoPedido('${pedido._id}')" title="Actualizar estado">
                <i class="fas fa-edit"></i>
              </button>
            </div>
          `;
        } else {
          botonesAcciones = `
            <div class="btn-group" role="group" style="display: flex; gap: 5px;">
              <button class="btn-secondary btn-sm" disabled title="No disponible">
                <i class="fas fa-edit"></i>
              </button>
            </div>
          `;
        }
      }

      fila.innerHTML = `
        <td>${identificador}</td>
        <td>${nombreCliente}</td>
        <td>${telefonoCliente}</td>
        <td>${pedido.metodo_pago === "tarjeta" ? "Tarjeta" : "Transferencia"}</td>
        <td>${envioParaMostrar}</td>
        <td>HNL ${costoEnvio.toFixed(2)}</td>
        <td>HNL ${(pedido.total || 0).toFixed(2)}</td>
        <td>${formatearFecha(obtenerFechaPedido(pedido))}</td>
        <td><span class="${claseEstado}">${estadoParaMostrar}</span></td>
        <td>${botonesAcciones}</td>
      `;
      tbody.appendChild(fila);
    });
  } catch (error) {
    console.error("Error al cargar tabla de pedidos:", error);
    tbody.innerHTML = `
      <tr>
        <td colspan="11" style="text-align: center; padding: 20px; color: #dc3545;">
          Error al cargar los pedidos
        </td>
      </tr>
    `;
  }
}
 */

// ============================================
//     VARIABLES GLOBALES DE PAGINACIÓN
// ============================================
let paginaActualPedidos = 1;
const limitePorPagina = 12;
let totalPaginasPedidos = 1;
let pedidosCargados = [];
let totalPedidosBD = 0; // ← ¡NUEVA VARIABLE PARA EL TOTAL!

// ============================================
//     FUNCIÓN PARA CARGAR PEDIDOS CON PAGINACIÓN
// ============================================
/**
 * Carga y muestra la tabla de pedidos con paginación
 */

async function cargarTablaPedidos(pagina = paginaActualPedidos) {
  const tbody = document.getElementById("tabla-pedidos");
  if (!tbody) return;

  // Mostrar loading
  tbody.innerHTML = `
    <tr>
      <td colspan="11" style="text-align: center; padding: 20px;">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-2">Cargando pedidos...</p>
      </td>
    </tr>
  `;

  try {
    // Obtener filtros actuales
    const filtroMetodoPago =
      document.getElementById("filtro-metodo-pago").value;
    const filtroEstado = document.getElementById("filtro-estado-pedido").value;
    const filtroNumero_referencia = document
      .getElementById("filtro-identificador")
      .value.trim();

    // Construir query string con paginación
    let queryString = `?limit=${limitePorPagina}&page=${pagina}`;

    if (filtroMetodoPago) {
      queryString += `&metodo_pago=${filtroMetodoPago}`;
    }

    if (filtroEstado) {
      queryString += `&estado=${filtroEstado}`;
    }

    if (filtroNumero_referencia) {
      queryString += `&identificador_pedido=${filtroNumero_referencia}`;
    }

    // Cargar pedidos con paginación
    const response = await fetch(`${BACKEND_URL}/pedidos${queryString}`, {
      headers: {
        Authorization: `Bearer ${AuthService.getToken()}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Error al cargar pedidos");
    }

    // Actualizar variables de paginación
    paginaActualPedidos = data.paginacion.pagina_actual;
    totalPaginasPedidos = data.paginacion.total_paginas;
    pedidosCargados = data.pedidos || [];

    // VARIABLE GLOBAL para el total (agrega esto al inicio del archivo)
    
    // ¡¡IMPORTANTE!! Asignar a la variable global
    totalPedidosBD = data.paginacion.total; // ← NO window.totalPedidosBD, solo totalPedidosBD
    const inicioRango = data.paginacion.inicio || ((pagina - 1) * limitePorPagina + 1);
    const finRango = data.paginacion.fin || Math.min(pagina * limitePorPagina, window.totalPedidosBD);
    // Limpiar tabla
    tbody.innerHTML = "";

    // Mostrar mensaje si no hay pedidos
    if (pedidosCargados.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="11" style="text-align: center; padding: 20px;">
            No hay pedidos para mostrar
          </td>
        </tr>
      `;
      actualizarControlesPaginacion(0);
      return;
    }

    // Renderizar cada pedido
    pedidosCargados.forEach((pedido) => {
      const fila = document.createElement("tr");
      const estadoParaMostrar = obtenerEstadoParaMostrar(pedido.estado);
      const claseEstado = obtenerClaseEstado(pedido.estado);

      // Obtener información del cliente
      const nombreCliente =
        pedido.cliente?.nombre ||
        pedido.cliente_nombre ||
        "Cliente no especificado";

      const telefonoCliente =
        pedido.cliente?.telefono ||
        pedido.cliente?.phone ||
        pedido.telefono ||
        "N/A";

      // Obtener información de envío
      const tipoEnvio =
        pedido.envio_info?.tipo || pedido.tipo_entrega || "recoger";
      const envioParaMostrar =
        tipoEnvio === "domicilio" || tipoEnvio === "envio"
          ? "Envío Solicitado"
          : "Recoger en tienda";
      const costoEnvio =
        pedido.envio_info?.costo_extra || pedido.costo_envio || 0;

      // Usar identificador_pedido si existe, si no usar _id
      const identificador =
        pedido.identificador_pedido ||
        `PED-${pedido._id?.substring(0, 8) || ""}`;

      // Determinar qué botones mostrar según el rol
      let botonesAcciones = "";

      if (AuthService.isAdmin()) {
        botonesAcciones = `
          <div class="btn-group" role="group" style="display: flex; gap: 5px;">
            <button class="btn-secondary btn-sm" onclick="actualizarEstadoPedido('${pedido._id}')" title="Actualizar estado">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-secondary btn-sm" onclick="descargarFactura('${pedido._id}')" title="Descargar factura">
                <i class="fas fa-print"></i>
              </button>
          </div>
        `;
      } else if (AuthService.isTienda()) {
        // Usuario tienda: solo puede actualizar estado en pedidos por transferencia pendientes
        const puedeActualizar =
          pedido.metodo_pago === "transferencia" &&
          (pedido.estado === "comprobante_pendiente" ||
            pedido.estado === "revision" ||
            pedido.estado === "pendiente" ||
            pedido.estado === "cancelado" ||
            pedido.estado === "confirmado");

        if (puedeActualizar) {
          botonesAcciones = `
            <div class="btn-group" role="group" style="display: flex; gap: 5px;">
              <button class="btn-secondary btn-sm" onclick="actualizarEstadoPedido('${pedido._id}')" title="Actualizar estado">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-secondary btn-sm" onclick="descargarFactura('${pedido._id}')" title="Descargar factura">
                <i class="fas fa-print"></i>
              </button>
            </div>
          `;
        } else {
          botonesAcciones = `
            <div class="btn-group" role="group" style="display: flex; gap: 5px;">
              <button class="btn-secondary btn-sm" disabled title="No disponible">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-secondary btn-sm" disabled title="No disponible">
                <i class="fas fa-print"></i>
              </button>
            </div>
          `;
        }
      }

      fila.innerHTML = `
        <td>${identificador}</td>
        <td>${nombreCliente}</td>
        <td>${telefonoCliente}</td>
        <td>${
          pedido.metodo_pago === "tarjeta" ? "Tarjeta" : "Transferencia"
        }</td>
        <td>${envioParaMostrar}</td>
        <td>HNL ${costoEnvio.toFixed(2)}</td>
        <td>HNL ${(pedido.total || 0).toFixed(2)}</td>
        <td>${formatearFecha(obtenerFechaPedido(pedido))}</td>
        <td><span class="${claseEstado}">${estadoParaMostrar}</span></td>
        <td>${botonesAcciones}</td>
      `;
      tbody.appendChild(fila);
    });

    // Actualizar controles de paginación
    actualizarControlesPaginacion(totalPedidosBD);
  } catch (error) {
    console.error("Error al cargar tabla de pedidos:", error);
    tbody.innerHTML = `
      <tr>
        <td colspan="11" style="text-align: center; padding: 20px; color: #dc3545;">
          Error al cargar los pedidos: ${error.message}
        </td>
      </tr>
    `;
  }
}

// ============================================
//     FUNCIÓN PARA ACTUALIZAR CONTROLES DE PAGINACIÓN
// ============================================
function actualizarControlesPaginacion(totalPedidos = 0) {
  // Buscar o crear contenedor de paginación
  let contenedorPaginacion = document.querySelector(".paginacion-pedidos");

  if (!contenedorPaginacion) {
    // Crear contenedor si no existe
    const tableContainer = document.querySelector("#Gestion-pedidos");
    if (!tableContainer) return;

    contenedorPaginacion = document.createElement("div");
    contenedorPaginacion.className = "paginacion-pedidos";
    contenedorPaginacion.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background-color: #f8f9fa;
      border-top: 1px solid #dee2e6;
      margin-top: 0;
    `;

    tableContainer.parentNode.insertBefore(
      contenedorPaginacion,
      tableContainer.nextSibling
    );
  }

  // CALCULAR RANGOS USANDO EL TOTAL REAL
  const inicio = (paginaActualPedidos - 1) * limitePorPagina + 1;
  const final = Math.min(paginaActualPedidos * limitePorPagina, totalPedidos);

 // Texto informativo CORREGIDO
  let textoMostrando = "";
  
  if (totalPedidos === 0) {
    textoMostrando = "No hay pedidos";
  } else if (totalPedidos <= limitePorPagina) {
    textoMostrando = `Mostrando ${inicio}-${final} de ${totalPedidos} pedidos`;
  } else {
    textoMostrando = `Mostrando ${inicio}-${final} de ${totalPedidos} pedidos`;
  }


   // Crear HTML de paginación
  contenedorPaginacion.innerHTML = `
    <div class="info-paginacion" style="font-size: 14px; color: #6c757d;">
      ${textoMostrando}
    </div>
    
    <div class="controles-paginacion" style="display: flex; align-items: center; gap: 10px;">
      <button 
        class="btn-pagina ${paginaActualPedidos === 1 ? "disabled" : ""}"
        ${paginaActualPedidos === 1 ? "disabled" : ""}
        onclick="irPaginaAnterior()"
        style="
          padding: 6px 12px;
          background-color: ${
            paginaActualPedidos === 1 ? "#e9ecef" : "#007bff"
          };
          color: ${paginaActualPedidos === 1 ? "#6c757d" : "white"};
          border: 1px solid ${
            paginaActualPedidos === 1 ? "#dee2e6" : "#007bff"
          };
          border-radius: 4px;
          cursor: ${paginaActualPedidos === 1 ? "not-allowed" : "pointer"};
          font-size: 14px;
        "
      >
        <i class="fas fa-chevron-left"></i> Anterior
      </button>
      
      <div class="numeros-pagina" style="display: flex; gap: 5px;">
        ${generarNumerosPagina()}
      </div>
      
      <button 
        class="btn-pagina ${
          paginaActualPedidos === totalPaginasPedidos ? "disabled" : ""
        }"
        ${paginaActualPedidos === totalPaginasPedidos ? "disabled" : ""}
        onclick="irPaginaSiguiente()"
        style="
          padding: 6px 12px;
          background-color: ${
            paginaActualPedidos === totalPaginasPedidos ? "#e9ecef" : "#007bff"
          };
          color: ${
            paginaActualPedidos === totalPaginasPedidos ? "#6c757d" : "white"
          };
          border: 1px solid ${
            paginaActualPedidos === totalPaginasPedidos ? "#dee2e6" : "#007bff"
          };
          border-radius: 4px;
          cursor: ${
            paginaActualPedidos === totalPaginasPedidos
              ? "not-allowed"
              : "pointer"
          };
          font-size: 14px;
        "
      >
        Siguiente <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  `;

}

// ============================================
//     FUNCIÓN PARA GENERAR NÚMEROS DE PÁGINA
// ============================================
function generarNumerosPagina() {
  let numerosHTML = "";
  const maxPaginasVisibles = 5;

  if (totalPaginasPedidos <= maxPaginasVisibles) {
    // Mostrar todas las páginas
    for (let i = 1; i <= totalPaginasPedidos; i++) {
      numerosHTML += crearBotonPagina(i);
    }
  } else {
    // Lógica para mostrar páginas con elipsis
    if (paginaActualPedidos <= 3) {
      // Primeras páginas
      for (let i = 1; i <= 4; i++) {
        numerosHTML += crearBotonPagina(i);
      }
      numerosHTML += `<span style="padding: 6px 12px; color: #6c757d;">...</span>`;
      numerosHTML += crearBotonPagina(totalPaginasPedidos);
    } else if (paginaActualPedidos >= totalPaginasPedidos - 2) {
      // Últimas páginas
      numerosHTML += crearBotonPagina(1);
      numerosHTML += `<span style="padding: 6px 12px; color: #6c757d;">...</span>`;
      for (let i = totalPaginasPedidos - 3; i <= totalPaginasPedidos; i++) {
        numerosHTML += crearBotonPagina(i);
      }
    } else {
      // Páginas intermedias
      numerosHTML += crearBotonPagina(1);
      numerosHTML += `<span style="padding: 6px 12px; color: #6c757d;">...</span>`;
      for (let i = paginaActualPedidos - 1; i <= paginaActualPedidos + 1; i++) {
        numerosHTML += crearBotonPagina(i);
      }
      numerosHTML += `<span style="padding: 6px 12px; color: #6c757d;">...</span>`;
      numerosHTML += crearBotonPagina(totalPaginasPedidos);
    }
  }

  return numerosHTML;
}

// ============================================
//     FUNCIÓN AUXILIAR PARA CREAR BOTÓN DE PÁGINA
// ============================================
function crearBotonPagina(numero) {
  const activo = numero === paginaActualPedidos;
  return `
    <button 
      class="btn-numero-pagina"
      onclick="irPaginaEspecifica(${numero})"
      style="
        padding: 6px 12px;
        background-color: ${activo ? "#007bff" : "white"};
        color: ${activo ? "white" : "#007bff"};
        border: 1px solid ${activo ? "#007bff" : "#dee2e6"};
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: ${activo ? "bold" : "normal"};
      "
    >
      ${numero}
    </button>
  `;
}

// ============================================
//     FUNCIONES DE NAVEGACIÓN
// ============================================
function irPaginaAnterior() {
  if (paginaActualPedidos > 1) {
    paginaActualPedidos--;
    cargarTablaPedidos();
  }
}

function irPaginaSiguiente() {
  if (paginaActualPedidos < totalPaginasPedidos) {
    paginaActualPedidos++;
    cargarTablaPedidos();
  }
}

function irPaginaEspecifica(pagina) {
  if (pagina >= 1 && pagina <= totalPaginasPedidos) {
    paginaActualPedidos = pagina;
    cargarTablaPedidos();
  }
}

// ============================================
//     CONFIGURAR EVENTOS DE FILTROS
// ============================================
function configurarEventosFiltros() {
  // Configurar cambio en filtros
  document
    .getElementById("filtro-metodo-pago")
    .addEventListener("change", function () {
      paginaActualPedidos = 1; // Resetear a primera página
      cargarTablaPedidos();
    });

  document
    .getElementById("filtro-estado-pedido")
    .addEventListener("change", function () {
      paginaActualPedidos = 1; // Resetear a primera página
      cargarTablaPedidos();
    });

  document
    .getElementById("filtro-identificador")
    .addEventListener("input", () => {
      paginaActualPedidos = 1;
      cargarTablaPedidos(1);
    });
}

// ============================================
//     INICIALIZACIÓN
// ============================================
// Llamar esta función cuando cargue la página de pedidos
function inicializarGestionPedidos() {
  // Cargar primera página
  cargarTablaPedidos(1);

  // Configurar eventos de filtros
  configurarEventosFiltros();
}

// Agregar CSS para los estados de los pedidos (si no lo tienes)
function agregarEstilosPaginacion() {
  const estilos = document.createElement("style");
  estilos.textContent = `
    .disabled {
      opacity: 0.5;
      cursor: not-allowed !important;
    }
    
    .btn-pagina:hover:not(.disabled) {
      background-color: #0056b3 !important;
      border-color: #0056b3 !important;
    }
    
    .btn-numero-pagina:hover {
      background-color: #e9ecef !important;
    }
    
    .spinner-border {
      width: 3rem;
      height: 3rem;
    }
    
    .estado-pedido {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .estado-comprobante_pendiente {
      background-color: #fff3cd;
      color: #856404;
    }
    
    .estado-confirmado {
      background-color: #d4edda;
      color: #155724;
    }
    
    .estado-revision {
      background-color: #d1ecf1;
      color: #0c5460;
    }
    
    .estado-completado {
      background-color: #28a745;
      color: white;
    }
    
    .estado-cancelado {
      background-color: #dc3545;
      color: white;
    }
  `;
  document.head.appendChild(estilos);
}

/**
 * Muestra pedidos filtrados en la tabla de pedidos recientes
 */
function mostrarPedidosEnTabla(pedidos) {
  const tbody = document.getElementById("pedidos-recientes");
  if (!tbody) {
    console.error("❌ No se encontró tbody#pedidos-recientes");
    return;
  }

  tbody.innerHTML = "";

  if (!pedidos || pedidos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 20px;">
          No hay pedidos para mostrar con los filtros aplicados
        </td>
      </tr>
    `;
    return;
  }

  pedidos.forEach((pedido) => {
    const fila = document.createElement("tr");
    const estadoParaMostrar = obtenerEstadoParaMostrar(pedido.estado);
    const claseEstado = obtenerClaseEstado(pedido.estado);

    // Obtener información del cliente
    const nombreCliente =
      pedido.cliente?.nombre || pedido.cliente_nombre || "Cliente";

    // Obtener información de envío
    const tipoEnvio =
      pedido.envio_info?.tipo || pedido.tipo_entrega || "recoger";
    const envioParaMostrar =
      tipoEnvio === "domicilio" || tipoEnvio === "envio"
        ? "Envío"
        : "Recoger en tienda";

    // Usar identificador_pedido si existe, si no usar _id
    const identificador =
      pedido.identificador_pedido || `PED-${pedido._id?.substring(0, 8) || ""}`;

    fila.innerHTML = `
      <td>${identificador}</td>
      <td>${nombreCliente}</td>
      <td>${pedido.metodo_pago === "tarjeta" ? "Tarjeta" : "Transferencia"}</td>
      <td>${envioParaMostrar}</td>
      <td>HNL ${(pedido.total || 0).toFixed(2)}</td>
      <td>${formatearFecha(obtenerFechaPedido(pedido))}</td>
      <td><span class="${claseEstado}">${estadoParaMostrar}</span></td>
    `;
    tbody.appendChild(fila);
  });

  console.log(`✅ ${pedidos.length} pedidos mostrados en la tabla`);
}

// ========== FUNCIONES DE FILTRADO ==========

/**
 * Configura los filtros de pedidos
 */
function configurarFiltrosPedidos() {
  console.log("🔧 Configurando filtros de pedidos...");

  // 1. Cargar datos iniciales
  cargarDatosInicialesPedidos();

  // 2. Configurar botón de aplicar filtro
  const btnAplicarFiltro = document.getElementById("aplicar-filtro-pedidos");
  if (btnAplicarFiltro) {
    console.log("✅ Configurando botón de filtrar...");

    btnAplicarFiltro.addEventListener("click", function () {
      console.log("🎯 ¡Botón Filtrar clickeado!");
      aplicarFiltroPedidos();
    });
  }

  // 3. Configurar cambio en select de período
  const filtroPeriodo = document.getElementById("filtro-periodo-pedidos");
  if (filtroPeriodo) {
    filtroPeriodo.addEventListener("change", function () {
      console.log(`📅 Período cambiado a: ${this.value}`);
      const filtroFechaPedidos = document.getElementById(
        "filtro-fecha-pedidos"
      );
      if (filtroFechaPedidos) {
        filtroFechaPedidos.value = "";
      }
      aplicarFiltroPedidos();
    });
  }

  // 4. Configurar cambio en input de fecha
  const filtroFechaPedidos = document.getElementById("filtro-fecha-pedidos");
  if (filtroFechaPedidos) {
    filtroFechaPedidos.addEventListener("change", function () {
      if (this.value) {
        console.log(`📅 Fecha específica seleccionada: ${this.value}`);
        aplicarFiltroPedidos();
      }
    });
  }

  console.log("✅ Filtros de pedidos configurados correctamente");
}

/**
 * Aplica filtros a los pedidos
 */
function aplicarFiltroPedidos() {
  console.log("🔍 Aplicando filtro...");

  const periodo =
    document.getElementById("filtro-periodo-pedidos")?.value || "mes";
  const fecha = document.getElementById("filtro-fecha-pedidos")?.value || "";

  console.log(`Filtros: periodo=${periodo}, fecha=${fecha}`);

  if (fecha) {
    filtrarPorFechaEspecifica(fecha);
  } else {
    cargarPedidosFiltrados(periodo);
  }
}

/**
 * Carga pedidos filtrados por período
 */
function cargarPedidosFiltrados(periodo) {
  console.log(`Filtrando por período: ${periodo}`);

  if (!window.todosLosPedidos || window.todosLosPedidos.length === 0) {
    console.log("⚠️ No hay pedidos cargados");
    mostrarPedidosEnTabla([]);
    return;
  }

  let pedidosFiltrados = [];

  switch (periodo) {
    case "hoy":
      pedidosFiltrados = filtrarPedidosPorFechaRelativa(0);
      break;
    case "ayer":
      pedidosFiltrados = filtrarPedidosPorFechaRelativa(-1);
      break;
    case "semana":
      pedidosFiltrados = filtrarPedidosPorSemana();
      break;
    case "mes":
      pedidosFiltrados = filtrarPedidosPorMes();
      break;
    case "todos":
      pedidosFiltrados = [...window.todosLosPedidos];
      break;
    default:
      pedidosFiltrados = filtrarPedidosPorMes();
  }

  console.log(`📊 ${pedidosFiltrados.length} pedidos encontrados`);
  mostrarPedidosEnTabla(pedidosFiltrados);
}

/**
 * Filtra pedidos por fecha relativa (días)
 */
function filtrarPedidosPorFechaRelativa(dias) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  const fechaStr = fecha.toISOString().split("T")[0];

  return window.todosLosPedidos.filter((pedido) => {
    const fechaPedido = obtenerFechaPedido(pedido);
    if (!fechaPedido) return false;

    const fechaPedidoStr = fechaPedido.split("T")[0];
    return fechaPedidoStr === fechaStr;
  });
}

/**
 * Filtra pedidos por semana
 */
function filtrarPedidosPorSemana() {
  const hoy = new Date();
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - hoy.getDay());

  return window.todosLosPedidos.filter((pedido) => {
    const fechaPedido = obtenerFechaPedido(pedido);
    if (!fechaPedido) return false;

    const fechaPedidoDate = new Date(fechaPedido);
    return fechaPedidoDate >= inicioSemana;
  });
}

/**
 * Filtra pedidos por mes
 */
function filtrarPedidosPorMes() {
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  console.log("📅 Filtrando pedidos por mes:");
  console.log("- Fecha inicio mes:", inicioMes);
  console.log("- Total pedidos:", window.todosLosPedidos?.length || 0);

  if (!window.todosLosPedidos || window.todosLosPedidos.length === 0) {
    console.log("⚠️ No hay pedidos para filtrar");
    return [];
  }

  const pedidosFiltrados = window.todosLosPedidos.filter((pedido) => {
    const fechaPedido = obtenerFechaPedido(pedido);
    if (!fechaPedido) {
      console.log("⚠️ Pedido sin fecha:", pedido._id);
      return false;
    }

    try {
      const fechaPedidoDate = new Date(fechaPedido);
      const esDelMes = fechaPedidoDate >= inicioMes;

      return esDelMes;
    } catch (error) {
      console.error(
        "❌ Error al procesar fecha del pedido:",
        fechaPedido,
        error
      );
      return false;
    }
  });

  console.log(`📊 ${pedidosFiltrados.length} pedidos del mes actual`);
  return pedidosFiltrados;
}

/**
 * Filtra pedidos por fecha específica
 */
function filtrarPorFechaEspecifica(fechaStr) {
  console.log(`Filtrando por fecha específica: ${fechaStr}`);

  const pedidosFiltrados = window.todosLosPedidos.filter((pedido) => {
    const fechaPedido = obtenerFechaPedido(pedido);
    if (!fechaPedido) return false;

    const fechaPedidoStr = fechaPedido.split("T")[0];
    return fechaPedidoStr === fechaStr;
  });

  console.log(`📊 ${pedidosFiltrados.length} pedidos para ${fechaStr}`);
  mostrarPedidosEnTabla(pedidosFiltrados);
}

// ========== FUNCIONES DE GESTIÓN ==========

/**
 * Actualiza el estado de un pedido
 */
async function actualizarEstadoPedido(idPedido) {
  // Buscar el pedido para mostrar información
  const pedido = window.todosLosPedidos.find((p) => p._id === idPedido);

  const identificador =
    pedido?.identificador_pedido ||
    `PED-${pedido?._id?.substring(0, 8) || idPedido}`;
  const nombreCliente =
    pedido?.cliente?.nombre || pedido?.cliente_nombre || "Cliente";

  // Modal para actualizar estado
  const modalHTML = `
    <div id="estadoPedidoModal" class="modal" style="display: flex;">
      <div class="modal-content" style="width: 500px;">
        <div class="modal-header">
          <h3>Actualizar Estado - Pedido ${identificador}</h3>
          <button type="button" class="btn-close" onclick="document.getElementById('estadoPedidoModal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="info-pedido" style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p><strong>Cliente:</strong> ${nombreCliente}</p>
            <p><strong>Método de pago:</strong> ${
              pedido?.metodo_pago || "N/A"
            }</p>
            <p><strong>Total:</strong> HNL ${(pedido?.total || 0).toFixed(
              2
            )}</p>
            <p><strong>Estado actual:</strong> <span class="${obtenerClaseEstado(
              pedido?.estado
            )}">${obtenerEstadoParaMostrar(pedido?.estado)}</span></p>
          </div>
          
          <div class="form-group" style="margin-top: 20px;">
            <label for="selectEstadoPedido"><strong>Nuevo Estado:</strong></label>
            <select id="selectEstadoPedido" class="form-select">
              <option value="comprobante_pendiente" ${
                pedido?.estado === "comprobante_pendiente" ? "selected" : ""
              }>Comprobante Pendiente</option>
              <option value="revision" ${
                pedido?.estado === "revision" ? "selected" : ""
              }>En Revisión</option>
              <option value="confirmado" ${
                pedido?.estado === "confirmado" ? "selected" : ""
              }>Confirmado (Pago verificado)</option>
              <option value="cancelado" ${
                pedido?.estado === "cancelado" ? "selected" : ""
              }>Cancelado</option>
            </select>
          </div>
          
          <div id="notaContainer" style="margin-top: 15px;">
            <label for="notaEstado"><strong>Nota (opcional):</strong></label>
            <textarea id="notaEstado" class="form-control" rows="3" placeholder="Agregar nota sobre el cambio de estado..."></textarea>
            <small class="form-text text-muted">Esta nota será visible para el equipo y puede ser útil para seguimiento.</small>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" onclick="document.getElementById('estadoPedidoModal').remove()">Cancelar</button>
          <button type="button" class="btn-primary" onclick="guardarEstadoPedido('${idPedido}')">Guardar Cambios</button>
        </div>
      </div>
    </div>
  `;

  // Agregar modal al DOM
  const modalContainer = document.createElement("div");
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer.firstElementChild);
}

/**
 * Guarda el nuevo estado del pedido
 */
async function guardarEstadoPedido(idPedido) {
  const nuevoEstado = document.getElementById("selectEstadoPedido").value;
  const nota = document.getElementById("notaEstado")?.value || "";

  // Validar que se haya seleccionado un estado
  if (!nuevoEstado) {
    alert("Por favor seleccione un estado");
    return;
  }

  try {
    const response = await fetchConAuth(
      `${window.BACKEND_URL}/pedidos/${idPedido}/estado`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: nuevoEstado,
          notas: nota,
          actualizado_por: AuthService.getUsuario().email,
          fecha_actualizacion: new Date().toISOString(),
        }),
      }
    );

    if (!response) {
      alert("Error de conexión con el servidor");
      return;
    }

    const result = await response.json();

    if (result.success) {
      // Cerrar modal
      document.getElementById("estadoPedidoModal")?.remove();

      // Mostrar mensaje de éxito
      const mensajes = {
        comprobante_pendiente: "✅ Pedido marcado como Comprobante Pendiente.",
        revision: "✅ Pedido marcado como En Revisión.",
        confirmado:
          "✅ Pedido confirmado. Se ha enviado una notificación al cliente.",
        en_proceso: "✅ Pedido marcado como En Proceso de preparación.",
        enviado: "✅ Pedido marcado como Enviado.",
        entregado: "✅ Pedido marcado como Entregado.",
        cancelado: "✅ Pedido cancelado. Se ha notificado al cliente.",
      };

      alert(
        mensajes[nuevoEstado] ||
          `✅ Estado actualizado a: ${obtenerEstadoParaMostrar(nuevoEstado)}`
      );

      // Recargar datos
      window.todosLosPedidos = await cargarPedidosDesdeBackend();
      cargarPedidosRecientes();
      cargarTablaPedidos();
      actualizarDashboard();
    } else {
      alert(`❌ Error: ${result.error || "No se pudo actualizar el estado"}`);
    }
  } catch (error) {
    console.error("Error al actualizar estado del pedido:", error);
    alert("Error al actualizar el estado del pedido");
  }
}

/**
 * Elimina un pedido (solo administrador)
 */
async function eliminarPedido(idPedido) {
  if (!AuthService.isAdmin()) {
    alert("Acceso denegado: Solo los administradores pueden eliminar pedidos");
    return;
  }

  // Buscar el pedido para mostrar información
  const pedido = window.todosLosPedidos.find((p) => p._id === idPedido);

  const identificador =
    pedido?.identificador_pedido ||
    `PED-${pedido?._id?.substring(0, 8) || idPedido}`;
  const nombreCliente =
    pedido?.cliente?.nombre || pedido?.cliente_nombre || "Cliente";
  const totalPedido = pedido?.total ? `HNL ${pedido.total.toFixed(2)}` : "N/A";

  const confirmacion = confirm(
    `¿Está seguro de que desea ELIMINAR este pedido?\n\n` +
      `📋 Pedido: ${identificador}\n` +
      `👤 Cliente: ${nombreCliente}\n` +
      `💰 Total: ${totalPedido}\n\n` +
      `⚠️ ADVERTENCIA: Esta acción NO se puede deshacer. El pedido será marcado como eliminado.`
  );

  if (!confirmacion) {
    return;
  }

  try {
    const response = await fetchConAuth(
      `${window.BACKEND_URL}/pedidos/${idPedido}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response) {
      alert("Error de conexión con el servidor");
      return;
    }

    const result = await response.json();

    if (result.success) {
      alert(`✅ Pedido ${identificador} eliminado correctamente`);

      // Recargar datos
      window.todosLosPedidos = await cargarPedidosDesdeBackend();
      cargarPedidosRecientes();
      cargarTablaPedidos();
      actualizarDashboard();
    } else {
      alert(`❌ Error: ${result.error || "No se pudo eliminar el pedido"}`);
    }
  } catch (error) {
    console.error("Error al eliminar pedido:", error);
    alert("Error al eliminar el pedido");
  }
}

// ========== AGREGAR ESTILOS PARA LOS BOTONES ==========

/**
 * Agrega estilos CSS para los botones de acciones
 */
function agregarEstilosBotones() {
  const style = document.createElement("style");
  style.textContent = `
    .btn-group {
      display: flex;
      gap: 5px;
    }
    
    .btn-sm {
      padding: 5px 10px;
      font-size: 12px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 32px;
    }
    
    .btn-info {
      background-color: #17a2b8;
      color: white;
    }
    
    .btn-info:hover {
      background-color: #138496;
    }
    
    .btn-secondary {
      background-color: var(--azul-claro);
      color: white;
    }
    
    .btn-secondary:hover {
      background-color: var(--azul-secundario);
    }
    
    .btn-danger {
      background-color: #dc3545;
      color: white;
    }
    
    .btn-danger:hover {
      background-color: #c82333;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-primary:hover {
      background-color: #0056b3;
    }
    
    .btn-sm:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .btn-sm i {
      font-size: 14px;
    }
    
    .table-actions {
      min-width: 120px;
    }
    
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    
    .modal-content {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 1px solid #dee2e6;
      padding-bottom: 10px;
    }
    
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #dee2e6;
    }
    
    .btn-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6c757d;
    }
    
    .btn-close:hover {
      color: #343a40;
    }
    
    .info-pedido {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
      border-left: 4px solid #007bff;
    }
    
    .info-pedido p {
      margin: 5px 0;
    }
  `;
  document.head.appendChild(style);
}

document.addEventListener("DOMContentLoaded", function () {
  agregarEstilosPaginacion();

  //cargarTablaPedidos();

  // Si estamos en la sección de pedidos, inicializar
  if (document.getElementById("tabla-pedidos")) {
    inicializarGestionPedidos();
  }
  setTimeout(agregarEstilosBotones, 100);
});

/* GENERAR PDF DE LA INFORMACION DE UN PEDIDO */
async function descargarFactura(pedidoId) {
  try {
    console.log(`📄 Generando factura admin para pedido: ${pedidoId}`);
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Error: No hay sesión activa');
      return;
    }
    
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    
    // 1. Obtener datos del pedido desde la API
    const response = await fetch(`${BACKEND_URL}/pedidos/${pedidoId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al obtener el pedido');
    }
    
    const pedido = data.pedido;
    console.log('📦 Datos del pedido obtenidos:', pedido);
    
    // 2. Configuración para administración
    const config = {
      tipo: 'admin',
      mostrarInstruccionesPago: false,
      mostrarIVA: true,
      mostrarNotas: true,
      usuarioGenerador: usuario.nombre || usuario.email || 'Administrador',
      empresaInfo: {
        ...EMPRESA_INFO,
        ruc: '0801-1990-12345'
      },
      callback: function() {
        console.log('✅ Factura administrativa generada exitosamente');
      }
    };
    
    // 3. Generar el PDF
    await generarFacturaPDF(pedido, config);
    
  } catch (error) {
    console.error('❌ Error al generar factura admin:', error);
    alert(`Error al generar factura: ${error.message}`);
  }
}


// ========== EXPORTACIÓN DE FUNCIONES ==========

window.cargarPedidosDesdeBackend = cargarPedidosDesdeBackend;
window.eliminarPedido = eliminarPedido;
window.cargarTablaPedidos = cargarTablaPedidos;
window.configurarFiltrosPedidos = configurarFiltrosPedidos;
window.aplicarFiltroPedidos = aplicarFiltroPedidos;
window.actualizarEstadoPedido = actualizarEstadoPedido;
window.guardarEstadoPedido = guardarEstadoPedido;
window.descargarFactura = descargarFactura;
