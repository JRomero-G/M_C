/*PARTE 1 */
// ============================================
//     CONFIGURACIÓN
// ============================================
const BACKEND_URL = "http://localhost:3000/api";


// ============================================
//     VARIABLES GLOBALES
// ============================================
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let envioCosto = parseFloat(localStorage.getItem("costo_envio")) || 0;
let tipoEnvio = localStorage.getItem("tipo_envio") || "Recoger en tienda";
let facturaDescargada = false; // Nueva variable para rastrear si se intentó descargar

// ============================================
//     INICIALIZACIÓN
// ============================================

// Modifica tu evento DOMContentLoaded:
document.addEventListener("DOMContentLoaded", function () {
  /*PRUEBAS */
  console.log("📦 Datos cargados:", {
    productos: carrito.length,
    envioCosto: envioCosto,
    tipoEnvio: tipoEnvio,
  });

  // Verificar si hay un modal pendiente
  verificarModalPendiente();

  // Verificar que hay productos en el carrito
  if (carrito.length === 0) {
    mostrarError("No hay productos en el carrito");
    setTimeout(() => {
      window.location.href = "../Pages/Carrito.html";
    }, 2000);
    return;
  }

  calcularResumen();
  configurarEventos();
});

// ============================================
//     ACTUALIZAR INFORMACIÓN DE ENVÍO EN PANTALLA
// ============================================
function actualizarInfoEnvio() {
  const ciudadInput = document.getElementById("ciudadCliente");
  const direccionInput = document.getElementById("direccionCliente");

  // Si es recoger en tienda, los campos de dirección no son obligatorios
  if (envioCosto === 0) {
    if (ciudadInput) {
      ciudadInput.required = false;
      ciudadInput.placeholder = "Opcional (solo para envíos)";
    }
    if (direccionInput) {
      direccionInput.required = false;
      direccionInput.placeholder = "Opcional (solo para envíos)";
    }

    // Mostrar mensaje informativo
    const mensajeEnvio = document.createElement("div");
    mensajeEnvio.className = "info-envio";
    mensajeEnvio.innerHTML = `
            <p><i class="fas fa-info-circle"></i> <strong>Recoger en tienda:</strong> 
            Puedes recoger tu pedido en nuestra tienda física.</p>
        `;

    const formulario = document.querySelector(".formulario");
    if (formulario) {
      formulario.insertBefore(
        mensajeEnvio,
        formulario.querySelector("h2:nth-of-type(2)")
      );
    }
  }
}

// ============================================
//     FUNCIONES DE RESUMEN
// ============================================

function calcularResumen() {
  const subtotal = carrito.reduce((t, p) => t + p.precio * p.cantidad, 0);
  const impuestos = subtotal * 0.15; // IVA 15% en Honduras
  const total = subtotal + envioCosto + impuestos;

  document.getElementById(
    "resumenSubtotal"
  ).textContent = `HNL ${subtotal.toFixed(2)}`;
  document.getElementById(
    "resumenEnvio"
  ).textContent = `HNL ${envioCosto.toFixed(2)}`;
  document.getElementById(
    "resumenImpuestos"
  ).textContent = `HNL ${impuestos.toFixed(2)}`;
  document.getElementById("resumenTotal").textContent = `HNL ${total.toFixed(
    2
  )}`;

  console.log("💰 Resumen calculado:", {
    subtotal: subtotal,
    envio: envioCosto,
    impuestos: impuestos,
    total: total,
  });

  return { subtotal, impuestos, total };
}

// ============================================
//     CONFIGURAR EVENTOS
// ============================================
function configurarEventos() {
  // Cambiar entre métodos de pago
  const radiosPago = document.querySelectorAll("input[name='pago']");
  const bloqueTransferencia = document.getElementById("bloqueTransferencia");
  const bloqueTarjeta = document.getElementById("bloqueTarjeta");

  radiosPago.forEach((r) => {
    r.addEventListener("change", function () {
      if (this.value === "transferencia") {
        if (bloqueTransferencia) bloqueTransferencia.style.display = "block";
        if (bloqueTarjeta) bloqueTarjeta.style.display = "none";
      } else {
        if (bloqueTransferencia) bloqueTransferencia.style.display = "none";
        if (bloqueTarjeta) bloqueTarjeta.style.display = "block";
      }
    });
  });

  // Mostrar transferencia por defecto
  if (bloqueTransferencia) bloqueTransferencia.style.display = "block";

  // Botón Confirmar Pedido
  document
    .getElementById("btnConfirmarCompra")
    .addEventListener("click", function (e) {
      e.preventDefault();
      confirmarPedido();
    });

  // Botón Volver
  document.getElementById("btn-volver").addEventListener("click", function () {
    window.location.href = "../Pages/Carrito.html";
  });
}

// ============================================
//     CONFIRMAR PEDIDO - ACTUALIZADO PARA ENVÍO
// ============================================
async function confirmarPedido() {
  // Obtener datos del formulario
  const nombre = document.getElementById("nombreCliente").value.trim();
  const correo = document.getElementById("correoCliente").value.trim();
  const telefono = document.getElementById("telefonoCliente").value.trim();
  const ciudad = document.getElementById("ciudadCliente").value.trim();
  const direccion = document.getElementById("direccionCliente").value.trim();
  const metodoPago = document.querySelector("input[name='pago']:checked").value;

  // Validaciones básicas
  if (!nombre || !correo || !telefono) {
    mostrarError(
      "Por favor completa los campos obligatorios: Nombre, Correo y Teléfono."
    );
    return;
  }

  // Validar correo
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(correo)) {
    mostrarError("Por favor ingresa un correo electrónico válido.");
    return;
  }

  // Si hay costo de envío, validar dirección
  let direccionCompleta = "";
  if (envioCosto > 0) {
    if (!ciudad || !direccion) {
      mostrarError(
        "Para envío a domicilio, completa los campos de Ciudad y Dirección."
      );
      return;
    }
    direccionCompleta = `${direccion}, ${ciudad}`;
  } else {
    // Si es recoger en tienda, usar dirección por defecto o vacía
    direccionCompleta = ciudad || "Recoger en tienda";
  }

  // Determinar tipo de envío para el backend
  let tipoEnvioBackend = "recogida";
  if (envioCosto === 670) {
    tipoEnvioBackend = "domicilio";
  } else if (envioCosto === 1400) {
    tipoEnvioBackend = "domicilio";
  }

  // Preparar datos para el backend
  const datosPedido = {
    cliente: {
      nombre: nombre,
      correo: correo,
      telefono: telefono,
    },
    metodo_pago: metodoPago,
    envio_info: {
      tipo: tipoEnvioBackend, // Cambiado para enviar tipo específico
      costo_extra: envioCosto, // ¡ESTO ES IMPORTANTE!
      direccion: direccionCompleta,
      estado: "pendiente",
    },
    carrito: carrito.map((item) => ({
      id_producto: item.id,
      cantidad: item.cantidad,
    })),
    notas: `Ciudad: ${
      ciudad || "Recoger en tienda"
    } | Tipo envío: ${tipoEnvio}`,
  };

  console.log("📤 Enviando pedido al backend:", datosPedido);
  console.log("💰 Costo de envío incluido:", envioCosto);

  // Deshabilitar botón durante el envío
  const btnConfirmar = document.getElementById("btnConfirmarCompra");
  const textoOriginal = btnConfirmar.innerHTML;
  btnConfirmar.disabled = true;
  btnConfirmar.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> Procesando...';

  try {
    // Enviar al backend
    const response = await fetch(`${BACKEND_URL}/pedidos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datosPedido),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Error al procesar el pedido");
    }

    console.log("✅ Pedido creado exitosamente:", result);
    console.log("💰 Costo de envío registrado:", result.pedido?.total);

    // Mostrar confirmación con datos del pedido
    mostrarConfirmacionExitosa(result);
  } catch (error) {
    console.error("❌ Error al confirmar pedido:", error);
    mostrarError(
      error.message || "Error al procesar el pedido. Intenta nuevamente."
    );
  } finally {
    // Restaurar botón
    btnConfirmar.disabled = false;
    btnConfirmar.innerHTML = textoOriginal;
  }
}

// ============================================
//     MOSTRAR CONFIRMACIÓN - ACTUALIZADO PARA MOSTRAR ENVÍO
// ============================================
function mostrarConfirmacionExitosa(resultado) {
  const pedido = resultado.pedido;
  const instrucciones = resultado.instrucciones;
  
  // AGREGAR ESTA LÍNEA: Asignar el pedido al scope global
  window.pedidoFacturacion = pedido;

  // Guardar estado del pedido en localStorage
  localStorage.setItem(
    "pedidoConfirmado",
    JSON.stringify({
      pedido: pedido,
      instrucciones: instrucciones,
      timestamp: new Date().getTime(),
      facturaDescargada: false,
      // También guardar el pedido como string para recuperarlo
      pedidoData: JSON.stringify(pedido)
    })
  );

  // Guardar también información del carrito para limpiar después
  localStorage.setItem("carritoPendienteLimpiar", JSON.stringify(carrito));

  // Obtener tipo de envío para mostrar
  let textoEnvio = "";
  if (envioCosto === 0) {
    textoEnvio = "Recoger en tienda";
  } else if (envioCosto === 670) {
    textoEnvio = "Envío estándar";
  } else if (envioCosto === 1400) {
    textoEnvio = "Envío express";
  }

  // Crear modal de confirmación
  const modalHTML = `
        <div id="modalConfirmacion" class="modal-confirmacion">
            <div class="modal-contenido">
                <div class="modal-header">
                    <h2><i class="fas fa-check-circle"></i> ¡Pedido Confirmado!</h2>
                    <button class="cerrar-modal">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="confirmacion-exitosa">
                        <div class="icono-exito">
                            <i class="fas fa-check"></i>
                        </div>
                        
                        <h3>Pedido N°: <span class="pedido-id">${
                          pedido.identificador_pedido
                        }</span></h3>
                        <p class="mensaje-exito">Tu pedido ha sido registrado exitosamente.</p>
                        
                        <div class="info-transferencia">
                            <h4><i class="fas fa-university"></i> Instrucciones para Transferencia</h4>
                            <div class="datos-bancarios">
                            <h4><i class="fas fa-university"></i> Bancos Disponibles</h4>
                                <p><strong>BANCO ATLANTIDA</strong> </p>
                                <p><strong>Cuenta:</strong> ${
                                  EMPRESA_INFO.cuentasBancarias[0].cuenta
                                }</p>
                                <p><strong>Titular:</strong> ${
                                  EMPRESA_INFO.cuentasBancarias[0].titular
                                }</p>
                                <p><strong>BANCO DE OCCIDENTE</strong></p>
                                <p><strong>Cuenta:</strong> ${
                                  EMPRESA_INFO.cuentasBancarias[1].cuenta
                                }</p>
                                <p><strong>Titular:</strong> ${
                                  EMPRESA_INFO.cuentasBancarias[1].titular
                                }</p>
                                <p><strong>Referencia:</strong> PED-${
                                  pedido.identificador_pedido
                                }</p>
                                <p><strong>Monto a Transferir:</strong> HNL ${pedido.total.toFixed(
                                  2
                                )}</p>
                            </div>
                            <p class="advertencia">
                                <i class="fas fa-exclamation-triangle"></i>
                                <strong>IMPORTANTE:</strong> Envía el comprobante al WhatsApp: ${
                                  EMPRESA_INFO.whatsapp
                                }
                            </p>
                        </div>
                        
                        <div class="resumen-confirmacion">
                            <h4><i class="fas fa-receipt"></i> Resumen del Pedido</h4>
                            <div class="resumen-detalles">
                                <div class="resumen-linea">
                                    <span>Cliente:</span>
                                    <span>${pedido.cliente.nombre}</span>
                                </div>
                                <div class="resumen-linea">
                                    <span>Correo:</span>
                                    <span>${pedido.cliente.correo}</span>
                                </div>
                                <div class="resumen-linea">
                                    <span>Telefono:</span>
                                    <span>${pedido.cliente.telefono}</span>
                                </div>
                                <div class="resumen-linea">
                                    <span>Tipo de entrega:</span>
                                    <span>${textoEnvio}</span>
                                </div>
                                <div class="resumen-linea">
                                    <span>Costo de envío:</span>
                                    <span>HNL ${envioCosto.toFixed(2)}</span>
                                </div>
                                <div class="resumen-linea">
                                    <span>Total:</span>
                                    <span>HNL ${pedido.total.toFixed(2)}</span>
                                </div>
                                <div class="resumen-linea">
                                    <span>Estado:</span>
                                    <span class="estado-pedido">${
                                      pedido.estado
                                    }</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Mensaje de recordatorio -->
                        <div id="mensajeRecordatorio" class="mensaje-recordatorio" style="display: none;">
                            <div class="recordatorio-contenido">
                                <i class="fas fa-exclamation-triangle"></i>
                                <div>
                                    <strong>¡Descarga la factura!</strong>
                                    <p>Necesitas la factura para realizar el pago y saber dónde enviar el comprobante.</p>
                                    <p><small>Puedes descargarla cuantas veces necesites.</small></p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="acciones-confirmacion">
                            <button type="button" id="btnDescargarPDF" class="btn-pdf">
                                <i class="fas fa-file-pdf"></i> Descargar Factura (PDF)
                            </button>
                            <button type="button" id="btnVolverInicio" class="btn-inicio">
                                <i class="fas fa-home"></i> Volver al Inicio
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Agregar modal al DOM
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Configurar eventos del modal
  const modal = document.getElementById("modalConfirmacion");
  const cerrarBtn = modal.querySelector(".cerrar-modal");
  const mensajeRecordatorio = modal.querySelector("#mensajeRecordatorio");

  // Función para mostrar mensaje de advertencia
  function mostrarAdvertencia() {
    if (!facturaDescargada) {
      mensajeRecordatorio.style.display = "block";

      // Agregar animación de sacudida
      mensajeRecordatorio.style.animation = "shake 0.5s ease-in-out";
      setTimeout(() => {
        mensajeRecordatorio.style.animation = "";
      }, 500);

      return true; // Indica que se mostró advertencia
    }
    return false; // No se mostró advertencia
  }

  // Función para cerrar modal con validación
  function intentarCerrarModal() {
    if (!facturaDescargada) {
      if (mostrarAdvertencia()) {
        return false; // No cerrar el modal
      }
    }
    // Si la factura ya fue descargada o el usuario confirma, cerrar modal
    cerrarModal();
    return true;
  }

  // Función para cerrar el modal
  function cerrarModal() {
    const modal = document.getElementById("modalConfirmacion");
    if (modal) {
      modal.remove();
    }

    // Limpiar datos persistentes
    limpiarEstadoModal();

    // Limpiar carrito
    limpiarDatos();
    window.location.href = "../index.html";
  }

  // Nueva función para limpiar estado del modal
  function limpiarEstadoModal() {
    localStorage.removeItem("pedidoConfirmado");
    localStorage.removeItem("carritoPendienteLimpiar");
  }

  // Evento para el botón cerrar (X)
  cerrarBtn.addEventListener("click", intentarCerrarModal);

  // Evento para hacer clic fuera del modal
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      if (intentarCerrarModal()) {
        // El modal se cerrará desde la función intentarCerrarModal
      }
    }
  });

  /* Botón Descargar PDF - MEJORADO PARA MÚLTIPLES DESCARGAS v1
  document.getElementById("btnDescargarPDF").addEventListener("click", () => {
    descargarFacturaCliente(pedido, () => {
      // Callback que se ejecuta después de generar el PDF
      facturaDescargada = true; // Marcar que se intentó descargar la factura

      // Actualizar el botón para mostrar que ya se descargó al menos una vez
      const btnPDF = document.getElementById("btnDescargarPDF");
      btnPDF.innerHTML =
        '<i class="fas fa-check"></i> Factura Descargada (Puedes descargar nuevamente)';
      btnPDF.style.background = "#27ae60";

      // Ocultar mensaje de recordatorio si está visible
      mensajeRecordatorio.style.display = "none";

      // Agregar un pequeño delay y luego cambiar de nuevo a rojo para indicar que se puede descargar otra vez
      setTimeout(() => {
        btnPDF.style.background = "#e74c3c";
        btnPDF.innerHTML =
          '<i class="fas fa-redo"></i> Descargar Factura Nuevamente';
      }, 1000);
    });
  });
*/
  
// Botón Volver al Inicio
  document.getElementById("btnVolverInicio").addEventListener("click", () => {
    if (!facturaDescargada) {
      if (mostrarAdvertencia()) {
        return; // No continuar si se mostró advertencia
      }
    }
    cerrarModal();
  });



  // Mostrar modal
  modal.style.display = "flex";
}

/* Verificar Modal v1
function verificarModalPendiente() {
  const pedidoConfirmado = JSON.parse(localStorage.getItem("pedidoConfirmado"));

  if (pedidoConfirmado) {
    // Verificar si el pedido es reciente (menos de 30 minutos)
    const tiempoTranscurrido =
      new Date().getTime() - pedidoConfirmado.timestamp;
    const treintaMinutos = 30 * 60 * 1000;

    if (tiempoTranscurrido < treintaMinutos) {
      // Restaurar el modal
      mostrarConfirmacionExitosa({
        pedido: pedidoConfirmado.pedido,
        instrucciones: pedidoConfirmado.instrucciones,
      });

      // Restaurar el estado de descarga si es necesario
      facturaDescargada = pedidoConfirmado.facturaDescargada || false;
    } else {
      // Limpiar si ha pasado mucho tiempo
      limpiarEstadoModal();
    }
  }
}*/

function verificarModalPendiente() {
  const pedidoConfirmado = JSON.parse(localStorage.getItem("pedidoConfirmado"));

  if (pedidoConfirmado) {
    // Verificar si el pedido es reciente (menos de 30 minutos)
    const tiempoTranscurrido =
      new Date().getTime() - pedidoConfirmado.timestamp;
    const treintaMinutos = 30 * 60 * 1000;

    if (tiempoTranscurrido < treintaMinutos) {
      // AGREGAR ESTA LÍNEA: Restaurar el pedido en el scope global
      window.pedidoFacturacion = JSON.parse(JSON.stringify(pedidoConfirmado.pedido));
      
      // Restaurar el carrito si está guardado
      if (pedidoConfirmado.carrito) {
        console.log('🛒 Restaurando carrito desde localStorage');
        // No sobreescribimos carrito global, pero lo tenemos como referencia
      }
      
      // Restaurar el modal
      mostrarConfirmacionExitosa({
        pedido: pedidoConfirmado.pedido,
        instrucciones: pedidoConfirmado.instrucciones,
      });

      // Restaurar el estado de descarga si es necesario
      facturaDescargada = pedidoConfirmado.facturaDescargada || false;
    } else {
      // Limpiar si ha pasado mucho tiempo
      limpiarEstadoModal();
    }
  }
}

// ============================================
//     LIMPIAR CARRITO
// ============================================
function limpiarDatos() {
  localStorage.removeItem("carrito");
  localStorage.removeItem("carrito_total");
  localStorage.removeItem("costo_envio");
  localStorage.removeItem("tipo_envio");
  carrito = [];
  envioCosto = 0;
  tipoEnvio = "";

  // Actualizar badge en otras pestañas si existe la función
  if (typeof actualizarContadorCarritoGlobal === "function") {
    actualizarContadorCarritoGlobal();
  }
}

/* TEMPORALMENTE COMENTADO PARA EVITAR CONFLICTOS CON EL GLOBAL.JS
// ============================================
//     GENERAR PDF - MEJORADO CON CALLBACK
// ============================================
function generarPDF(pedido, callback) {
  // Cargar librería jsPDF dinámicamente si no está cargada
  if (!window.jspdf) {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";

    script.onload = function () {
      generarPDFInterno(pedido, callback);
    };

    document.head.appendChild(script);
  } else {
    generarPDFInterno(pedido, callback);
  }
}

// ============================================
//     GENERAR PDF
// ============================================
function generarPDFInterno(pedido, callback) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Configuración de colores
  const colores = {
    primario: [44, 62, 80],
    secundario: [231, 76, 60],
    acento: [52, 152, 219],
    texto: [52, 73, 94],
    borde: [206, 212, 218],
  };

  // Configurar fuentes
  doc.setFont("helvetica");

  // ============================================
  //     ENCABEZADO
  // ============================================
  doc.setFillColor(...colores.primario);
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(EMPRESA_INFO.nombre, 105, 20, null, null, "center");

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("FACTURA DE COMPRA", 105, 30, null, null, "center");

  doc.setDrawColor(...colores.secundario);
  doc.setLineWidth(2);
  doc.line(20, 35, 190, 35);

  // ============================================
  //     INFORMACIÓN DE LA EMPRESA
  // ============================================
  doc.setTextColor(...colores.texto);
  doc.setFontSize(9);

  let yPos = 45;

  doc.setFont("helvetica", "bold");
  doc.text("EMPRESA", 20, yPos);
  doc.text("FACTURA", 150, yPos);
  yPos += 5;

  doc.setFont("helvetica", "normal");
  doc.text(`${EMPRESA_INFO.nombre}`, 20, yPos);
  doc.text(`Tel: ${EMPRESA_INFO.telefono}`, 20, yPos + 5);
  doc.text(`Email: ${EMPRESA_INFO.correo}`, 20, yPos + 10);
  doc.text(`WhatsApp: ${EMPRESA_INFO.whatsapp}`, 20, yPos + 15);

  doc.text(`N° Factura: ${pedido.identificador_pedido}`, 150, yPos);
  doc.text(`Fecha: ${new Date().toLocaleDateString("es-HN")}`, 150, yPos + 5);
  doc.text(`Estado: Comprobante Pendiente`, 150, yPos + 10);

  yPos += 25;

  // ============================================
  //     INFORMACIÓN DEL CLIENTE
  // ============================================
  doc.setFillColor(248, 249, 250);
  doc.rect(20, yPos, 170, 25, "F");
  doc.setDrawColor(...colores.borde);
  doc.rect(20, yPos, 170, 25);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colores.primario);
  doc.text("DATOS DEL CLIENTE", 25, yPos + 7);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colores.texto);
  doc.text(`Nombre: ${pedido.cliente.nombre}`, 30, yPos + 15);
  doc.text(`Correo: ${pedido.cliente.correo}`, 30, yPos + 21);
  doc.text(`Teléfono: ${pedido.cliente.telefono}`, 110, yPos + 15);

  let textoEnvio = "";
  if (envioCosto === 0) {
    textoEnvio = "Recoger en tienda";
  } else if (envioCosto === 670) {
    textoEnvio = "Envío estándar";
  } else if (envioCosto === 1400) {
    textoEnvio = "Envío express";
  }

  doc.text(`Entrega: ${textoEnvio}`, 110, yPos + 21);
  yPos += 35;

  // ============================================
  //     TABLA DE PRODUCTOS
  // ============================================
  doc.setFillColor(...colores.primario);
  doc.rect(20, yPos, 170, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");

  doc.text("Producto", 25, yPos + 7);
  doc.text("Cantidad", 115, yPos + 7, null, null, "center");
  doc.text("Precio Unit.", 145, yPos + 7, null, null, "right");
  doc.text("Subtotal", 185, yPos + 7, null, null, "right");

  yPos += 10;
  doc.setTextColor(...colores.texto);
  doc.setFont("helvetica", "normal");

  let filaAlterna = false;
  carrito.forEach((producto) => {
    if (filaAlterna) {
      doc.setFillColor(248, 249, 250);
      doc.rect(20, yPos, 170, 10, "F");
    }

    const subtotal = producto.precio * producto.cantidad;
    let nombreProducto = producto.nombre;
    if (nombreProducto.length > 35) {
      nombreProducto = nombreProducto.substring(0, 32) + "...";
    }

    doc.text(nombreProducto, 25, yPos + 7);
    doc.text(`${producto.cantidad}`, 115, yPos + 7, null, null, "center");
    doc.text(
      `HNL ${producto.precio.toFixed(2)}`,
      145,
      yPos + 7,
      null,
      null,
      "right"
    );
    doc.text(`HNL ${subtotal.toFixed(2)}`, 185, yPos + 7, null, null, "right");

    yPos += 10;
    filaAlterna = !filaAlterna;
  });

  doc.setDrawColor(...colores.borde);
  doc.line(20, yPos, 190, yPos);
  yPos += 5;

  // ============================================
  //     SECCIÓN DE TOTALES
  // ============================================
  const subtotal = carrito.reduce((t, p) => t + p.precio * p.cantidad, 0);
  const impuestos = subtotal * 0.15;
  const total = subtotal + envioCosto + impuestos;

  doc.setDrawColor(...colores.acento);
  doc.setLineWidth(0.5);
  doc.rect(110, yPos, 80, 40);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colores.texto);

  doc.text("Subtotal:", 115, yPos + 10);
  doc.text(`HNL ${subtotal.toFixed(2)}`, 185, yPos + 10, null, null, "right");

  doc.text("Costo de envío:", 115, yPos + 18);
  doc.text(`HNL ${envioCosto.toFixed(2)}`, 185, yPos + 18, null, null, "right");

  doc.text("IVA (15%):", 115, yPos + 26);
  doc.text(`HNL ${impuestos.toFixed(2)}`, 185, yPos + 26, null, null, "right");

  doc.setDrawColor(...colores.borde);
  doc.line(115, yPos + 30, 185, yPos + 30);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colores.secundario);
  doc.setFontSize(12);
  doc.text("TOTAL:", 115, yPos + 38);
  doc.text(`HNL ${total.toFixed(2)}`, 185, yPos + 38, null, null, "right");

  yPos += 50;

  // ============================================
  //     INSTRUCCIONES DE PAGO - CON COLUMNAS
  // ============================================

  // Fondo para instrucciones (más compacto)
  const instruccionesAltura = 60; // Reducido de 80 a 60
  doc.setFillColor(255, 243, 205);
  doc.rect(20, yPos, 170, instruccionesAltura, "F");
  doc.setDrawColor(255, 193, 7);
  doc.setLineWidth(0.5);
  doc.rect(20, yPos, 170, instruccionesAltura);

  // Título instrucciones
  doc.setFont("helvetica", "bold");
  doc.setTextColor(133, 100, 4);
  doc.setFontSize(10);
  doc.text("INSTRUCCIONES PARA EL PAGO", 25, yPos + 8);

  // Separador
  doc.setDrawColor(133, 100, 4);
  doc.setLineWidth(0.3);
  doc.line(25, yPos + 11, 185, yPos + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  // Definir columnas
  const columnaIzquierdaX = 25;
  const columnaDerechaX = 105; // Mitad de la página
  let yColumnaIzquierda = yPos + 18;
  let yColumnaDerecha = yPos + 18;
  const lineHeight = 4.5;

  // ===== COLUMNA IZQUIERDA =====

  // 1. Transferencia
  doc.setFont("helvetica", "bold");
  doc.text(
    "1. Realiza la transferencia:",
    columnaIzquierdaX,
    yColumnaIzquierda
  );
  yColumnaIzquierda += lineHeight + 1;

  doc.setFont("helvetica", "normal");
  EMPRESA_INFO.cuentasBancarias.forEach((cuenta, index) => {
    // Número y banco
    doc.text(
      `${index + 1}. ${cuenta.banco}:`,
      columnaIzquierdaX + 5,
      yColumnaIzquierda
    );
    yColumnaIzquierda += lineHeight - 1;

    // Detalles con sangría
    doc.text(
      `Cuenta: ${cuenta.cuenta}`,
      columnaIzquierdaX + 10,
      yColumnaIzquierda
    );
    yColumnaIzquierda += lineHeight - 1;

    doc.text(
      `Titular: ${cuenta.titular}`,
      columnaIzquierdaX + 10,
      yColumnaIzquierda
    );
    yColumnaIzquierda += lineHeight - 1;

    doc.text(`Tipo: ${cuenta.tipo}`, columnaIzquierdaX + 10, yColumnaIzquierda);
    yColumnaIzquierda += lineHeight;
  });

  // 3. Monto (en columna izquierda)
  doc.setFont("helvetica", "bold");
  doc.text("3. Monto a transferir:", columnaIzquierdaX, yColumnaIzquierda);
  yColumnaIzquierda += lineHeight;

  doc.setFont("helvetica", "normal");
  doc.text(`HNL ${total.toFixed(2)}`, columnaIzquierdaX + 5, yColumnaIzquierda);

  // ===== COLUMNA DERECHA =====

  // 2. Referencia
  doc.setFont("helvetica", "bold");
  doc.text("2. Referencia de pago:", columnaDerechaX, yColumnaDerecha);
  yColumnaDerecha += lineHeight;

  doc.setFont("helvetica", "normal");
  // Si la referencia es muy larga, la partimos
  const referencia = pedido.identificador_pedido;
  if (referencia.length > 20) {
    const mitad = Math.floor(referencia.length / 2);
    doc.text(
      referencia.substring(0, mitad),
      columnaDerechaX + 5,
      yColumnaDerecha
    );
    yColumnaDerecha += lineHeight - 1;
    doc.text(referencia.substring(mitad), columnaDerechaX + 5, yColumnaDerecha);
    yColumnaDerecha += lineHeight;
  } else {
    doc.text(referencia, columnaDerechaX + 5, yColumnaDerecha);
    yColumnaDerecha += lineHeight + 1;
  }

  // 4. Comprobante
  doc.setFont("helvetica", "bold");
  doc.text("4. Envío del comprobante:", columnaDerechaX, yColumnaDerecha);
  yColumnaDerecha += lineHeight;

  doc.setFont("helvetica", "normal");
  doc.text(`WhatsApp:`, columnaDerechaX + 5, yColumnaDerecha);
  yColumnaDerecha += lineHeight - 1;
  doc.text(EMPRESA_INFO.whatsapp, columnaDerechaX + 5, yColumnaDerecha);

  yPos += instruccionesAltura + 10;

  // ============================================
  //     NOTAS IMPORTANTES (AHORA SÍ CABEN)
  // ============================================

  // Verificar que haya espacio
  const espacioRestante = 297 - yPos; // Altura página A4

  if (espacioRestante > 25) {
    // Marco para notas (opcional)
    doc.setDrawColor(108, 117, 125);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(20, yPos, 190, yPos);
    doc.setLineDashPattern([], 0);

    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(108, 117, 125);

    let notaY = yPos + 5;
    const espacioLineaNota = 4;

    doc.text(
      "• Esta factura no es válida como comprobante de pago.",
      20,
      notaY
    );
    notaY += espacioLineaNota;

    doc.text(
      "• El pedido se procesará al recibir el comprobante de pago.",
      20,
      notaY
    );
    notaY += espacioLineaNota;

    doc.text("• Para consultas contactar: " + EMPRESA_INFO.telefono, 20, notaY);
    notaY += espacioLineaNota;

    doc.text("• Horario: Lunes a Viernes 8:00 AM - 5:00 PM", 20, notaY);

    yPos = notaY + 10;
  } else {
    // Si no hay espacio, poner notas más compactas
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(108, 117, 125);

    doc.text(
      "Nota: Enviar comprobante al WhatsApp para procesar pedido.",
      20,
      yPos + 5
    );
  }

  // ============================================
  //     PIE DE PÁGINA
  // ============================================

  // Línea separadora
  doc.setDrawColor(...colores.primario);
  doc.setLineWidth(0.5);
  doc.setLineDashPattern([], 0);

  const pieY = Math.max(280, yPos + 15); // Asegurar posición mínima
  doc.line(20, pieY, 190, pieY);

  // Texto pie de página
  doc.setTextColor(...colores.texto);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  doc.text(
    "Gracias por su compra - " + EMPRESA_INFO.nombre,
    105,
    pieY + 5,
    null,
    null,
    "center"
  );
  doc.text(
    "Factura generada automáticamente",
    105,
    pieY + 10,
    null,
    null,
    "center"
  );

  // Número de página
  doc.text(`Página 1 de 1`, 190, pieY + 10, null, null, "right");

  // ============================================
  //     GUARDAR PDF
  // ============================================

  const nombreArchivo = `Factura-${pedido.identificador_pedido}.pdf`;
  doc.save(nombreArchivo);

  // Actualizar estado en localStorage
  const pedidoConfirmado = JSON.parse(localStorage.getItem("pedidoConfirmado"));
  if (pedidoConfirmado) {
    pedidoConfirmado.facturaDescargada = true;
    localStorage.setItem("pedidoConfirmado", JSON.stringify(pedidoConfirmado));
  }

  setTimeout(() => {
    if (callback && typeof callback === "function") {
      callback();
    }
  }, 100);
}

*/

// ============================================
//     FUNCIONES DE MENSAJES
// ============================================
function mostrarError(mensaje) {
  // Remover mensajes anteriores
  const mensajesAnteriores = document.querySelectorAll(".mensaje-error");
  mensajesAnteriores.forEach((msg) => msg.remove());

  // Crear nuevo mensaje
  const div = document.createElement("div");
  div.className = "mensaje-error";
  div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s;
    `;
  div.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${mensaje}`;

  document.body.appendChild(div);

  // Eliminar después de 5 segundos
  setTimeout(() => {
    div.style.animation = "slideOut 0.3s";
    setTimeout(() => div.remove(), 300);
  }, 5000);
}

function mostrarExito(mensaje) {
  const div = document.createElement("div");
  div.className = "mensaje-exito";
  div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2ecc71;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s;
    `;
  div.innerHTML = `<i class="fas fa-check-circle"></i> ${mensaje}`;

  document.body.appendChild(div);

  setTimeout(() => {
    div.style.animation = "slideOut 0.3s";
    setTimeout(() => div.remove(), 300);
  }, 5000);
}

// ============================================
//     AGREGAR ESTILOS CSS DINÁMICOS
// ============================================
if (!document.querySelector("#estilos-dinamicos-facturacion")) {
  const estilo = document.createElement("style");
  estilo.id = "estilos-dinamicos-facturacion";
  estilo.textContent = `
        /* Animaciones */
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        /* Modal de Confirmación */
        .modal-confirmacion {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 1000;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .modal-contenido {
            background: white;
            border-radius: 10px;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            animation: slideUp 0.4s;
        }
        
        @keyframes slideUp {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        .modal-header {
            background: #2c3e50;
            color: white;
            padding: 20px;
            border-radius: 10px 10px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-header h2 {
            margin: 0;
            font-size: 1.5rem;
        }
        
        .cerrar-modal {
            background: none;
            border: none;
            color: white;
            font-size: 2rem;
            cursor: pointer;
            line-height: 1;
        }
        
        .modal-body {
            padding: 30px;
        }
        
        .confirmacion-exitosa {
            text-align: center;
        }
        
        .icono-exito {
            background: #2ecc71;
            color: white;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 2.5rem;
        }
        
        .pedido-id {
            color: #3498db;
            font-weight: bold;
        }
        
        .mensaje-exito {
            color: #27ae60;
            font-size: 1.1rem;
            margin-bottom: 25px;
        }
        
        .info-transferencia {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }
        
        .info-transferencia h4 {
            color: #2c3e50;
            margin-top: 0;
        }
        
        .datos-bancarios {
            background: white;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid #3498db;
        }
        
        .datos-bancarios p {
            margin: 8px 0;
        }
        
        .advertencia {
            background: #fff3cd;
            color: #856404;
            padding: 12px;
            border-radius: 5px;
            border: 1px solid #ffeaa7;
            margin-top: 15px;
        }
        
        .resumen-confirmacion {
            margin: 25px 0;
            text-align: left;
        }
        
        .resumen-detalles {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
        }
        
        .resumen-linea {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding-bottom: 8px;
            border-bottom: 1px dashed #ddd;
        }
        
        .resumen-linea:last-child {
            border-bottom: none;
        }
        
        .estado-pedido {
            background: #f39c12;
            color: white;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 0.9rem;
        }
        
        /* Mensaje de recordatorio */
        .mensaje-recordatorio {
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: left;
            animation: fadeIn 0.3s;
        }
        
        .recordatorio-contenido {
            display: flex;
            align-items: flex-start;
            gap: 15px;
        }
        
        .recordatorio-contenido i {
            color: #856404;
            font-size: 1.5rem;
            margin-top: 2px;
        }
        
        .recordatorio-contenido strong {
            color: #856404;
            font-size: 1.1rem;
            display: block;
            margin-bottom: 5px;
        }
        
        .recordatorio-contenido p {
            color: #856404;
            margin: 0;
            font-size: 0.95rem;
        }
        
        .recordatorio-contenido small {
            color: #856404;
            opacity: 0.8;
            font-size: 0.85rem;
            display: block;
            margin-top: 5px;
        }
        
        /* Animación de sacudida */
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .acciones-confirmacion {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 30px;
            flex-wrap: wrap;
        }
        
        .btn-pdf {
            background: #e74c3c;
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 5px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 1rem;
            transition: background 0.3s, transform 0.2s;
        }
        
        .btn-pdf:hover {
            background: #c0392b;
            transform: translateY(-2px);
        }
        
        .btn-pdf:active {
            transform: translateY(0);
        }
        
        .btn-inicio {
            background: #3498db;
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 5px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: background 0.3s, transform 0.2s;
        }
        
        .btn-inicio:hover {
            background: #2980b9;
            transform: translateY(-2px);
        }
        
        .btn-inicio:active {
            transform: translateY(0);
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .modal-contenido {
                width: 95%;
                margin: 10px;
            }
            
            .acciones-confirmacion {
                flex-direction: column;
            }
            
            .btn-pdf, .btn-inicio {
                width: 100%;
                justify-content: center;
            }
            
            .recordatorio-contenido {
                flex-direction: column;
                text-align: center;
                gap: 10px;
            }
        }
    `;
  document.head.appendChild(estilo);
}

function descargarFacturaCliente(pedido, callback) {
  console.log('📄 Descargando factura cliente...', pedido);
  
  // CLONAR el pedido para no modificar el original
  const pedidoParaPDF = { ...pedido };
  
  // Verificar que el pedido tenga la estructura mínima
  if (!pedidoParaPDF.identificador_pedido && !pedidoParaPDF.id) {
    // Crear un ID temporal
    pedidoParaPDF.identificador_pedido = 'PED-' + Date.now();
  }
  
  // Configuración para cliente
  const config = {
    tipo: 'factura',
    mostrarInstruccionesPago: true,
    mostrarIVA: true,
    mostrarNotas: true,
    tituloPersonalizado: 'FACTURA DE COMPRA',
    callback: callback
  };
  
  // CORRECCIÓN: Verificar si productos es un array válido
  console.log('🔍 Analizando estructura de productos:', {
    productos: pedidoParaPDF.productos,
    tipo: typeof pedidoParaPDF.productos,
    esArray: Array.isArray(pedidoParaPDF.productos),
    longitud: Array.isArray(pedidoParaPDF.productos) ? pedidoParaPDF.productos.length : 'no es array'
  });
  
  // Si productos no es un array válido o está vacío, usar el carrito
  if (!pedidoParaPDF.productos || 
      !Array.isArray(pedidoParaPDF.productos) || 
      pedidoParaPDF.productos.length === 0) {
    
    console.log('🛒 Usando productos del carrito local');
    
    // Asegurarse de que carrito existe y tiene elementos
    if (carrito && carrito.length > 0) {
      pedidoParaPDF.productos = carrito.map(item => ({
        nombre_producto: item.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal: item.precio * item.cantidad
      }));
    } else {
      // Si no hay carrito, crear un array vacío
      pedidoParaPDF.productos = [];
      console.warn('⚠️ Carrito vacío, productos serán vacíos en la factura');
    }
  }
  
  // Si productos es un número (como "productos: 1"), convertirlo usando detalles o carrito
  if (typeof pedidoParaPDF.productos === 'number') {
    console.log(`🔢 Productos es un número (${pedidoParaPDF.productos}), buscando detalles...`);
    
    // Buscar en detalles
    if (pedidoParaPDF.detalles && Array.isArray(pedidoParaPDF.detalles)) {
      pedidoParaPDF.productos = pedidoParaPDF.detalles;
      console.log('📋 Usando detalles como productos');
    } 
    // Si no hay detalles, usar carrito
    else if (carrito && carrito.length > 0) {
      pedidoParaPDF.productos = carrito.map(item => ({
        nombre_producto: item.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal: item.precio * item.cantidad
      }));
      console.log('🛒 Usando carrito para productos');
    } else {
      // Crear productos basados en el total
      console.log('💰 Creando productos basados en el total');
      pedidoParaPDF.productos = [{
        nombre_producto: 'Productos varios',
        cantidad: 1,
        precio_unitario: pedidoParaPDF.total || 0,
        subtotal: pedidoParaPDF.total || 0
      }];
    }
  }
  
  // Agregar costo de envío si no existe
  if (!pedidoParaPDF.costo_envio) {
    pedidoParaPDF.costo_envio = envioCosto;
  }
  
  // Agregar fecha si no existe
  if (!pedidoParaPDF.fecha_pedido) {
    pedidoParaPDF.fecha_pedido = new Date();
  }
  
  // Agregar estado si no existe
  if (!pedidoParaPDF.estado) {
    pedidoParaPDF.estado = 'comprobante_pendiente';
  }
  
  // Calcular el total si no existe
  if (!pedidoParaPDF.total) {
    const subtotal = pedidoParaPDF.productos.reduce((sum, p) => sum + (p.subtotal || 0), 0);
    pedidoParaPDF.total = subtotal + (pedidoParaPDF.costo_envio || 0);
  }
  
  console.log('📋 Pedido final para PDF:', pedidoParaPDF);
  console.log('📊 Productos finales:', pedidoParaPDF.productos);
  
  generarFacturaPDF(pedidoParaPDF, config)
    .then((nombreArchivo) => {
      console.log('✅ Factura descargada:', nombreArchivo);
      
      // Actualizar localStorage
      const pedidoConfirmado = JSON.parse(localStorage.getItem("pedidoConfirmado"));
      if (pedidoConfirmado) {
        pedidoConfirmado.facturaDescargada = true;
        localStorage.setItem("pedidoConfirmado", JSON.stringify(pedidoConfirmado));
      }
    })
    .catch(error => {
      console.error('❌ Error:', error);
      alert('No se pudo generar la factura: ' + error.message);
    });
}

// Event listener mejorado para el botón PDF
document.addEventListener("click", function(e) {
  if (e.target.closest('#btnDescargarPDF')) {
    e.preventDefault();
    
    console.log('🖱️ Botón PDF clickeado');
    
    // Verificar de dónde obtener el pedido
    let pedidoParaFactura;
    
    // 1. Primero intentar con window.pedidoFacturacion
    if (window.pedidoFacturacion) {
      // CLONAR el pedido para no modificar el original
      pedidoParaFactura = JSON.parse(JSON.stringify(window.pedidoFacturacion));
      console.log('📦 Usando pedido de window.pedidoFacturacion (clonado)');
    } 
    // 2. Si no, buscar en localStorage
    else {
      const pedidoConfirmado = JSON.parse(localStorage.getItem("pedidoConfirmado"));
      if (pedidoConfirmado && pedidoConfirmado.pedido) {
        // CLONAR el pedido
        pedidoParaFactura = JSON.parse(JSON.stringify(pedidoConfirmado.pedido));
        window.pedidoFacturacion = pedidoParaFactura; // Asignar para futuros intentos
        console.log('📦 Usando pedido de localStorage (clonado)');
      }
    }
    
    // 3. Si todavía no hay pedido, mostrar error
    if (!pedidoParaFactura) {
      console.error('❌ No hay datos de pedido para generar la factura');
      
      // Buscar si hay un elemento con clase pedido-id en el modal
      const pedidoIdElement = document.querySelector('.pedido-id');
      if (pedidoIdElement) {
        const pedidoId = pedidoIdElement.textContent;
        alert('Información del pedido incompleta. Pedido ID: ' + pedidoId + 
              '\nPor favor, actualiza la página o contacta con soporte.');
      } else {
        alert('No hay información del pedido disponible. Por favor, actualiza la página.');
      }
      return;
    }
    
    console.log('📋 Pedido para factura:', pedidoParaFactura);
    
    // DEBUG: Mostrar estructura completa
    console.log('🔍 Estructura completa del pedido:', {
      id: pedidoParaFactura.id,
      identificador: pedidoParaFactura.identificador_pedido,
      productos: pedidoParaFactura.productos,
      tipoProductos: typeof pedidoParaFactura.productos,
      esArray: Array.isArray(pedidoParaFactura.productos),
      detalles: pedidoParaFactura.detalles,
      cliente: pedidoParaFactura.cliente,
      total: pedidoParaFactura.total,
      costo_envio: pedidoParaFactura.costo_envio
    });
    
    // Llamar a la función de descarga
    descargarFacturaCliente(pedidoParaFactura, () => {
      // Callback que se ejecuta después de generar el PDF
      facturaDescargada = true;

      // Actualizar el botón para mostrar que ya se descargó
      const btnPDF = e.target.closest('#btnDescargarPDF') || document.getElementById("btnDescargarPDF");
      if (btnPDF) {
        btnPDF.innerHTML = '<i class="fas fa-check"></i> Factura Descargada (Puedes descargar nuevamente)';
        btnPDF.style.background = "#27ae60";

        // Ocultar mensaje de recordatorio si está visible
        const mensajeRecordatorio = document.getElementById("mensajeRecordatorio");
        if (mensajeRecordatorio) {
          mensajeRecordatorio.style.display = "none";
        }

        // Cambiar de nuevo después de un tiempo
        setTimeout(() => {
          btnPDF.style.background = "#e74c3c";
          btnPDF.innerHTML = '<i class="fas fa-redo"></i> Descargar Factura Nuevamente';
        }, 1000);
      }
      
      // Actualizar localStorage
      const pedidoConfirmado = JSON.parse(localStorage.getItem("pedidoConfirmado"));
      if (pedidoConfirmado) {
        pedidoConfirmado.facturaDescargada = true;
        localStorage.setItem("pedidoConfirmado", JSON.stringify(pedidoConfirmado));
      }
    });
  }
});

// ============================================
//     FUNCIÓN DE DEBUG
// ============================================
function debugFacturacion() {
  console.log('=== DEBUG FACTURACIÓN ===');
  console.log('1. window.pedidoFacturacion:', window.pedidoFacturacion);
  console.log('2. Carrito:', carrito);
  console.log('3. Envío costo:', envioCosto);
  console.log('4. Factura descargada:', facturaDescargada);
  
  const pedidoConfirmado = JSON.parse(localStorage.getItem("pedidoConfirmado"));
  console.log('5. localStorage pedidoConfirmado:', pedidoConfirmado);
  
  if (window.generarFacturaPDF) {
    console.log('6. generarFacturaPDF disponible: ✅');
  } else {
    console.log('6. generarFacturaPDF disponible: ❌');
  }
  
  if (window.jspdf) {
    console.log('7. jsPDF cargado: ✅');
  } else {
    console.log('7. jsPDF cargado: ❌');
  }
  
  // Verificar si hay botón PDF
  const btnPDF = document.getElementById("btnDescargarPDF");
  console.log('8. Botón PDF encontrado:', btnPDF ? '✅' : '❌');
  
  console.log('=== FIN DEBUG ===');
}

// ============================================
//     FUNCIÓN PARA ANALIZAR ESTRUCTURA DEL PEDIDO
// ============================================
function analizarEstructuraPedido(pedido) {
  console.log('🔍 === ANÁLISIS DE ESTRUCTURA DEL PEDIDO ===');
  
  if (!pedido) {
    console.log('❌ Pedido es null/undefined');
    return;
  }
  
  // Mostrar todas las propiedades
  console.log('📋 Todas las propiedades:');
  for (const key in pedido) {
    console.log(`  ${key}:`, pedido[key], `(tipo: ${typeof pedido[key]})`);
  }
  
  // Análisis específico de productos
  console.log('\n🎯 Análisis de productos:');
  if (pedido.productos) {
    console.log('  - Existe propiedad "productos"');
    console.log('  - Tipo:', typeof pedido.productos);
    console.log('  - Es array:', Array.isArray(pedido.productos));
    
    if (Array.isArray(pedido.productos)) {
      console.log('  - Longitud:', pedido.productos.length);
      if (pedido.productos.length > 0) {
        console.log('  - Primer elemento:', pedido.productos[0]);
      }
    } else if (typeof pedido.productos === 'object') {
      console.log('  - Es objeto, claves:', Object.keys(pedido.productos));
    }
  } else {
    console.log('  - No existe propiedad "productos"');
  }
  
  // Análisis de detalles
  console.log('\n📝 Análisis de detalles:');
  if (pedido.detalles) {
    console.log('  - Existe propiedad "detalles"');
    console.log('  - Tipo:', typeof pedido.detalles);
    console.log('  - Es array:', Array.isArray(pedido.detalles));
  }
  
  console.log('=== FIN ANÁLISIS ===\n');
}

// Hacer disponible globalmente
window.analizarEstructuraPedido = analizarEstructuraPedido;

// Hacer disponible globalmente
window.debugFacturacion = debugFacturacion;
console.log('🔧 Función debugFacturacion disponible. Ejecuta debugFacturacion() en la consola.');