// ========== ESTADÍSTICAS Y DASHBOARD ==========

/**
 * Actualiza las estadísticas del dashboard
 */
async function actualizarDashboard() {
  try {
    console.log("📊 Actualizando dashboard...");

    // Solo admin actualiza contador de productos
    if (AuthService.isAdmin()) {
      await actualizarContadorProductosActivos();
    }

    // Actualizar estadísticas iniciales usando la fecha por defecto
    await actualizarEstadisticasIniciales();

    // Cargar pedidos recientes
    cargarPedidosRecientes();

    // Configurar eventos de filtros
    configurarFiltrosEstadisticas();

    console.log("✅ Dashboard actualizado");
  } catch (error) {
    console.error("Error al actualizar dashboard:", error);
  }
  const inputIdentificador = document.getElementById("filtro-identificador");
  const btnClearIdentificador = document.getElementById("clear-identificador");

  if (inputIdentificador && btnClearIdentificador) {
    // Mostrar u ocultar la X según si hay texto
    inputIdentificador.addEventListener("input", () => {
      btnClearIdentificador.style.display = inputIdentificador.value
        ? "block"
        : "none";
    });

    // Limpiar al presionar la X
    btnClearIdentificador.addEventListener("click", () => {
      inputIdentificador.value = "";
      btnClearIdentificador.style.display = "none";

      paginaActualPedidos = 1;
      cargarTablaPedidos(1);
    });
  }
}

async function cargarPedidosPorMes(fecha = null) {
  const params = fecha ? `?fecha=${fecha}` : "";
  const res = await fetch(
    `${BACKEND_URL}/pedidos/pedidos-mes${params}`,
    {
      headers: AuthService.getAuthHeaders(),
    }
  );
  return res.json();
}

async function cargarVentasPorMes(fecha = null) {
  const params = fecha ? `?fecha=${fecha}` : "";
  const res = await fetch(`${BACKEND_URL}/pedidos/ventas-mes${params}`, {
    headers: AuthService.getAuthHeaders(),
  });
  return res.json();
}

/**
 * Actualiza estadísticas iniciales del dashboard
 */
async function actualizarEstadisticasIniciales() {
  try {
    const filtroPedidos = document.getElementById("filtro-fecha-mes");
    const filtroVentas = document.getElementById("filtro-fecha-ventas");

    const fechaPedidos = filtroPedidos?.value || null;
    const fechaVentas = filtroVentas?.value || null;

    const [pedidosRes, ventasRes] = await Promise.all([
      cargarPedidosPorMes(fechaPedidos),
      cargarVentasPorMes(fechaVentas),
    ]);

    if (pedidosRes.success) {
      document.getElementById("pedidos-mes").textContent =
        pedidosRes.totalPedidos;
    }

    if (ventasRes.success) {
      document.getElementById(
        "total-ventas"
      ).textContent = `HNL ${ventasRes.totalVentas.toFixed(2)}`;
    }
  } catch (error) {
    console.error("Error al cargar estadísticas:", error);
  }
}

/**
 * Actualiza el contador de productos activos
 */
async function actualizarContadorProductosActivos() {
  try {
    console.log("📦 Contando productos activos...");

    const elementoNumeroProductos = document.getElementById("numero-productos");

    if (!AuthService.isAdmin()) {
      if (elementoNumeroProductos) elementoNumeroProductos.textContent = "N/A";
      return 0;
    }

    const cantidad = await ProductosActivosBackend();

    console.log(`📦 Productos activos: ${cantidad}`);

    if (elementoNumeroProductos) {
      elementoNumeroProductos.textContent = cantidad;
    }

    return cantidad;
  } catch (error) {
    console.error("Error al contar productos activos:", error);
    const elementoNumeroProductos = document.getElementById("numero-productos");
    if (elementoNumeroProductos) elementoNumeroProductos.textContent = "Error";
    return 0;
  }
}

async function ProductosActivosBackend() {
  try {
    console.log(
      `🔍 Solicitando cantidad de productos activos desde: ${window.BACKEND_URL}/productos/gestion/activos`
    );

    const response = await fetchConAuth(
      `${window.BACKEND_URL}/productos/gestion/activos`
    );

    if (!response) {
      console.error("No se pudo conectar al servidor");
      return 0;
    }

    const result = await response.json();
    console.log("Respuesta del backend:", result);

    if (result.success) {
      return result.cantidad;
    } else {
      console.error("Error del backend:", result.error);
      return 0;
    }
  } catch (error) {
    console.error("Error en fetch:", error);
    return 0;
  }
}


/**
 * Carga y muestra los pedidos recientes en el dashboard
 */
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
      11
    )} pedidos recientes`
  );

  // Función para obtener fecha del pedido
  const obtenerFechaPedido = (pedido) => {
    const camposFecha = [
      "fecha_pedido",
      "createdAt",
      "fecha",
      "fecha_creacion",
      "date",
    ];
    for (const campo of camposFecha) {
      if (pedido[campo]) return pedido[campo];
    }
    return null;
  };

  // Función para obtener estado para mostrar
  const obtenerEstadoParaMostrar = (estado) => {
    if (!estado) return "Pendiente";

    const estadoLower = estado.toLowerCase();
    if (estadoLower === "comprobante_pendiente") {
      return "Comprobante Pendiente";
    } else if (estadoLower === "confirmado") {
      return "Confirmado";
    } else if (estadoLower === "cancelado") {
      return "Cancelado";
    }
    return estado;
  };

  // Función para obtener clase CSS del estado
  const obtenerClaseEstado = (estado) => {
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
      estadoLower.includes("entregado")
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
  };

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
    const fechaPedido = obtenerFechaPedido(pedido);

    // Obtener información del cliente - IMPORTANTE: Corregir aquí
    const nombreCliente =
      pedido.cliente?.nombre ||
      pedido.cliente_nombre ||
      (pedido.cliente && typeof pedido.cliente === "object"
        ? pedido.cliente.nombre || "Cliente"
        : "Cliente");

    console.log("📋 Datos del pedido:", {
      id: pedido._id,
      identificador_pedido: pedido.identificador_pedido,
      cliente: pedido.cliente,
      cliente_nombre: pedido.cliente_nombre,
      nombreCliente: nombreCliente,
    });

    // Obtener información de envío
    const tipoEnvio =
      pedido.envio_info?.tipo || pedido.tipo_entrega || "recoger";
    const envioParaMostrar =
      tipoEnvio === "domicilio" || tipoEnvio === "envio"
        ? "Envío"
        : "Recoger en tienda";

    // CORRECCIÓN: Usar identificador_pedido en lugar de _id
    const identificador = pedido.identificador_pedido || `#${pedido._id}`;

    fila.innerHTML = `
      <td>${identificador}</td>
      <td>${nombreCliente}</td>
      <td>${pedido.metodo_pago === "tarjeta" ? "Tarjeta" : "Transferencia"}</td>
      <td>${envioParaMostrar}</td>
      <td>HNL ${(pedido.total || 0).toFixed(2)}</td>
      <td>${formatearFecha(fechaPedido)}</td>
      <td><span class="${claseEstado}">${estadoParaMostrar}</span></td>
    `;
    tbody.appendChild(fila);
  });

  console.log(`✅ ${pedidosMostrar.length} pedidos recientes mostrados`);
}

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
      pedido.cliente?.nombre ||
      pedido.cliente_nombre ||
      (pedido.cliente && typeof pedido.cliente === "object"
        ? pedido.cliente.nombre || "Cliente"
        : "Cliente");

    // Obtener información de envío
    const tipoEnvio =
      pedido.envio_info?.tipo || pedido.tipo_entrega || "recoger";
    const envioParaMostrar =
      tipoEnvio === "domicilio" || tipoEnvio === "envio"
        ? "Envío"
        : "Recoger en tienda";

    // CORRECCIÓN: Usar identificador_pedido
    const identificador = pedido.identificador_pedido || `#${pedido._id}`;

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

/**
 * Configura los filtros para las estadísticas
 */
function configurarFiltrosEstadisticas() {
  // Filtro de mes en estadísticas
  const filtroAnioMes = document.getElementById("filtro-anio-mes");
  if (filtroAnioMes) {
    generarOpcionesMeses();

    filtroAnioMes.addEventListener("change", function () {
      const valor = this.value;
      console.log(`📊 Cambio de mes: ${valor}`);

      const [año, mes] = valor.split("-");

      const pedidosMes = todosLosPedidos.filter((pedido) => {
        const fechaPedido = new Date(pedido.fecha);
        return (
          fechaPedido.getFullYear() === parseInt(año) &&
          fechaPedido.getMonth() === parseInt(mes) - 1
        );
      });

      const elementoPedidosMes = document.getElementById("pedidos-mes");
      if (elementoPedidosMes) {
        elementoPedidosMes.textContent = pedidosMes.length;
      }

      const ventasMes = pedidosMes.reduce((sum, p) => sum + (p.total || 0), 0);
      const elementoTotalVentas = document.getElementById("total-ventas");
      if (elementoTotalVentas) {
        elementoTotalVentas.textContent = `HNL ${ventasMes.toFixed(2)}`;
      }
    });
  }

  const filtroPedidos = document.getElementById("filtro-fecha-mes");
  if (filtroPedidos) {
    filtroPedidos.addEventListener("change", async function () {
      const fecha = this.value;
      const res = await cargarPedidosPorMes(fecha);
      if (res.success) {
        document.getElementById("pedidos-mes").textContent = res.totalPedidos;
      }
    });
  }

  const filtroVentas = document.getElementById("filtro-fecha-ventas");
  if (filtroVentas) {
    filtroVentas.addEventListener("change", async function () {
      const fecha = this.value;
      const res = await cargarVentasPorMes(fecha);
      if (res.success) {
        document.getElementById(
          "total-ventas"
        ).textContent = `HNL ${res.totalVentas.toFixed(2)}`;
      }
    });
  }
}

/**
 * Genera las opciones de meses para el filtro
 */
function generarOpcionesMeses() {
  const select = document.getElementById("filtro-anio-mes");
  if (!select) return;

  select.innerHTML = "";

  const hoy = new Date();

  for (let i = 0; i < 12; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const año = fecha.getFullYear();
    const mes = fecha.getMonth() + 1;
    const mesTexto = fecha.toLocaleDateString("es-HN", { month: "long" });
    const valor = `${año}-${mes.toString().padStart(2, "0")}`;
    const texto = `${
      mesTexto.charAt(0).toUpperCase() + mesTexto.slice(1)
    } ${año}`;

    const option = document.createElement("option");
    option.value = valor;
    option.textContent = texto;

    if (i === 0) {
      option.selected = true;
    }

    select.appendChild(option);
  }
}

/**
 * Establece fechas por defecto en los filtros
 */
function establecerFechasPorDefecto() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");

  const fechaISO = `${yyyy}-${mm}-${dd}`;

  const filtroPedidos = document.getElementById("filtro-fecha-mes");
  const filtroVentas = document.getElementById("filtro-fecha-ventas");

  if (filtroPedidos) {
    filtroPedidos.value = fechaISO;
  }

  if (filtroVentas) {
    filtroVentas.value = fechaISO;
  }

  console.log("✅ Fechas establecidas:", fechaISO);
}

function obtenerFechaPedidoNormalizada(pedido) {
  const posibles = [
    pedido.fecha,
    pedido.fecha_pedido,
    pedido.createdAt,
    pedido.fecha_creacion,
    pedido.date,
  ];

  const valor = posibles.find((f) => f);

  if (!valor) return null;

  const d = new Date(valor);
  if (isNaN(d)) return null;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

document.addEventListener("DOMContentLoaded", () => {
  establecerFechasPorDefecto();
  actualizarDashboard();
});

function descargarReporteMensual(pedidosDelMes) {
  // Podrías crear un PDF consolidado de todos los pedidos del mes
  const reporte = {
    identificador_pedido: `REPORTE-${new Date().getFullYear()}-${new Date().getMonth() + 1}`,
    cliente: { nombre: 'REPORTE MENSUAL' },
    productos: [], // Podrías agregar un resumen aquí
    total: pedidosDelMes.reduce((sum, p) => sum + (p.total || 0), 0),
    fecha_pedido: new Date(),
    estado: 'reporte'
  };
  
  const config = {
    tipo: 'admin',
    tituloPersonalizado: `REPORTE MENSUAL - ${new Date().toLocaleDateString('es-HN')}`,
    mostrarInstruccionesPago: false,
    mostrarIVA: false
  };
  
  generarFacturaPDF(reporte, config);
}

// Exportar funciones para uso global
window.actualizarDashboard = actualizarDashboard;
window.actualizarEstadisticasIniciales = actualizarEstadisticasIniciales;
window.actualizarContadorProductosActivos = actualizarContadorProductosActivos;
window.cargarPedidosRecientes = cargarPedidosRecientes;
window.configurarFiltrosEstadisticas = configurarFiltrosEstadisticas;
window.generarOpcionesMeses = generarOpcionesMeses;
window.establecerFechasPorDefecto = establecerFechasPorDefecto;
window.descargarReporteMensual = descargarReporteMensual;