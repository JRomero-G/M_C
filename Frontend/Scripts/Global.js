// ========== CONFIGURACIÓN URL GLOBAL ==========
const BACKEND_URL = "https://m-c-h5or.onrender.com/api"; /*URL del backend en linea */


// Configuración global de la empresa
const EMPRESA_INFO = {
  nombre: "MUEBLES COMAYAGUA",
  telefono: "(504) 2234-5678",
  correo: "info@tiendamuebles.com",
  whatsapp: "+504 9876-5432",
  direccion: "Blvd. Suyapa, Tegucigalpa, Honduras",
  cuentasBancarias: [
    {
      banco: "BAC Honduras",
      cuenta: "123-456789-0",
      titular: "MUEBLES COMAYAGUA",
      tipo: "Cuenta Corriente",
    },
    {
      banco: "Ficohsa",
      cuenta: "987-654321-0",
      titular: "MUEBLES COMAYAGUA",
      tipo: "Cuenta de Ahorros",
    },
  ],
};

// Variable global para verificar si jsPDF está cargado
let jsPDFCargado = false;

// ============================================
//     FUNCIÓN PARA CARGAR jspdf DINÁMICAMENTE
// ============================================
function cargarJSPDF() {
  return new Promise((resolve, reject) => {
    // Si ya está cargado, resolver inmediatamente
    if (typeof window.jspdf !== "undefined") {
      jsPDFCargado = true;
      resolve();
      return;
    }

    // Si ya se está cargando, esperar
    if (window.jsPDFLoading) {
      window.jsPDFLoading.then(resolve).catch(reject);
      return;
    }

    // Crear promesa de carga
    window.jsPDFLoading = new Promise((loadResolve, loadReject) => {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.async = true;

      script.onload = () => {
        jsPDFCargado = true;
        loadResolve();
      };

      script.onerror = (error) => {
        console.error("Error al cargar jsPDF:", error);
        loadReject(new Error("No se pudo cargar la librería PDF"));
      };

      document.head.appendChild(script);
    });

    window.jsPDFLoading.then(resolve).catch(reject);
  });
}

// ============================================
//     GENERADOR UNIVERSAL DE FACTURAS PDF
// ============================================
/**
 * Genera un PDF de factura (disponible globalmente)
 * @param {Object} pedido - Datos del pedido
 * @param {Object} config - Configuración opcional
 * @returns {Promise} - Promesa que se resuelve cuando se genera el PDF
 */
async function generarFacturaPDF(pedido, config = {}) {
  try {
    console.log("📄 Iniciando generación de PDF...", pedido);

    // Validar que se proporcione un pedido
    if (!pedido || typeof pedido !== "object") {
      throw new Error("Se requiere un objeto de pedido válido");
    }

    // Cargar jsPDF si no está cargado
    await cargarJSPDF();
    console.log("✅ jsPDF cargado");

    // Configuración por defecto
    const defaultConfig = {
      tipo: "factura", // 'factura', 'comprobante', 'admin'
      mostrarInstruccionesPago: true,
      mostrarIVA: true,
      mostrarNotas: true,
      empresaInfo: EMPRESA_INFO,
      usuarioGenerador: null,
      tituloPersonalizado: null,
      callback: null, // Callback opcional
    };

    // Fusionar configuraciones
    const configFinal = { ...defaultConfig, ...config };
    console.log("⚙️ Configuración:", configFinal);

    // Generar el PDF
    const nombreArchivo = await generarFacturaInterna(pedido, configFinal);
    console.log("✅ PDF generado:", nombreArchivo);

    // Ejecutar callback si existe
    if (configFinal.callback && typeof configFinal.callback === "function") {
      configFinal.callback();
    }

    return nombreArchivo;
  } catch (error) {
    console.error("❌ Error al generar factura PDF:", error);
    throw error;
  }
}

// ============================================
//     FUNCIÓN INTERNA DE GENERACIÓN (COMPLETA CON NOTAS ORIGINALES)
// ============================================
async function generarFacturaInterna(pedido, config) {
  return new Promise((resolve, reject) => {
    try {
      console.log("🖨️ Generando contenido PDF...");
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Configuración de colores
      const colores = {
        primario: [44, 62, 80], // Azul oscuro
        secundario: [231, 76, 60], // Rojo
        acento: [52, 152, 219], // Azul claro
        texto: [52, 73, 94], // Gris oscuro
        borde: [206, 212, 218], // Gris claro
        exito: [39, 174, 96], // Verde
        advertencia: [241, 196, 15], // Amarillo
      };

      // Configurar fuentes
      doc.setFont("helvetica");

      // ============================================
      //     ENCABEZADO
      // ============================================
      const titulo =
        config.tituloPersonalizado ||
        (config.tipo === "comprobante"
          ? "COMPROBANTE DE PEDIDO"
          : config.tipo === "admin"
            ? `FACTURA ADMIN - ${pedido.identificador_pedido || "PEDIDO"}`
            : "FACTURA DE COMPRA");

      // Encabezado con color
      doc.setFillColor(...colores.primario);
      doc.rect(0, 0, 210, 40, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text(config.empresaInfo.nombre, 105, 20, null, null, "center");

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(titulo, 105, 30, null, null, "center");

      // Línea decorativa
      doc.setDrawColor(...colores.secundario);
      doc.setLineWidth(2);
      doc.line(20, 35, 190, 35);

      // ============================================
      //     INFORMACIÓN DE LA EMPRESA Y FACTURA
      // ============================================
      doc.setTextColor(...colores.texto);
      doc.setFontSize(9);

      let yPos = 45;

      doc.setFont("helvetica", "bold");
      doc.text("EMPRESA", 20, yPos);
      doc.text("FACTURA", 150, yPos);
      yPos += 5;

      doc.setFont("helvetica", "normal");
      doc.text(`${config.empresaInfo.nombre}`, 20, yPos);
      doc.text(`Tel: ${config.empresaInfo.telefono}`, 20, yPos + 5);
      doc.text(`Email: ${config.empresaInfo.correo}`, 20, yPos + 10);
      doc.text(`WhatsApp: ${config.empresaInfo.whatsapp}`, 20, yPos + 15);

      // Información de la factura
      const fechaPedido = pedido.fecha_pedido
        ? new Date(pedido.fecha_pedido)
        : new Date();
      doc.text(
        `N° Factura: ${pedido.identificador_pedido || pedido.id || "N/A"}`,
        150,
        yPos,
      );
      doc.text(
        `Fecha: ${fechaPedido.toLocaleDateString("es-HN")}`,
        150,
        yPos + 5,
      );

      const estado = formatearEstadoPedido(pedido.estado || "pendiente");
      doc.text(`Estado: ${estado}`, 150, yPos + 10);

      if (config.usuarioGenerador) {
        doc.text(`Generado por: ${config.usuarioGenerador}`, 150, yPos + 15);
      }

      yPos += 25;

      // ============================================
      //     INFORMACIÓN DEL CLIENTE (ALTURA DINÁMICA)
      // ============================================
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colores.primario);
      doc.text("DATOS DEL CLIENTE", 25, yPos + 7);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colores.texto);

      // Obtener datos del cliente
      const clienteNombre = obtenerNombreCliente(pedido);
      const clienteEmail =
        pedido.cliente?.email ||
        pedido.cliente?.correo ||
        pedido.cliente_email ||
        "No especificado";
      const clienteTelefono =
        pedido.cliente?.telefono ||
        pedido.cliente?.telefono ||
        pedido.cliente_telefono ||
        "No especificado";

      // CALCULAR ALTURA DINÁMICAMENTE
      let lineasCliente = 3; // Mínimo: Nombre, Correo, Teléfono
      let textoDireccion = "";

      // Información de envío
      const envioInfo = pedido.envio_info || {};
      const tipoEnvio = envioInfo.tipo || pedido.tipo_entrega || "recoger";
      const costoEnvio = pedido.costo_envio || 0;

      let textoEnvio =
        tipoEnvio === "recoger" ? "Recoger en tienda" : "Envío a domicilio";
      if (costoEnvio > 0) {
        textoEnvio += ` - HNL ${costoEnvio.toFixed(2)}`;
      }

      // Verificar si hay dirección de envío
      if (
        tipoEnvio !== "recoger" &&
        envioInfo.direccion &&
        envioInfo.direccion.trim() !== ""
      ) {
        textoDireccion = envioInfo.direccion;
        lineasCliente++; // Agregar una línea extra para la dirección
      }

      // Calcular altura del cuadro (25px para primeras 3 líneas, +10px por línea extra)
      const alturaCuadro = 25 + Math.max(0, lineasCliente - 3) * 10;

      // Dibujar cuadro con altura dinámica
      doc.setFillColor(248, 249, 250);
      doc.rect(20, yPos, 170, alturaCuadro, "F");
      doc.setDrawColor(...colores.borde);
      doc.rect(20, yPos, 170, alturaCuadro);

      // Escribir información del cliente
      let yTexto = yPos + 15;
      doc.text(`Nombre: ${clienteNombre}`, 30, yTexto);
      yTexto += 6;
      doc.text(`Correo: ${clienteEmail}`, 30, yTexto);
      yTexto += 6;
      doc.text(`Teléfono: ${clienteTelefono}`, 110, yPos + 15);
      doc.text(`Entrega: ${textoEnvio}`, 110, yPos + 21);

      // Si hay dirección, agregarla en una nueva línea
      if (textoDireccion) {
        doc.text(`Dirección: ${textoDireccion}`, 30, yTexto);
        yTexto += 6;
      }

      yPos += alturaCuadro + 10; // Espacio después del cuadro

      // ============================================
      //     TABLA DE PRODUCTOS
      // ============================================
      // Preparar productos
      let productos = [];
      let subtotal = 0;

      if (pedido.productos && Array.isArray(pedido.productos)) {
        productos = pedido.productos;
      } else if (pedido.detalles && Array.isArray(pedido.detalles)) {
        productos = pedido.detalles;
      } else if (pedido.items && Array.isArray(pedido.items)) {
        productos = pedido.items;
      }

      console.log("🛒 Productos encontrados:", productos.length);

      if (productos.length > 0) {
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

        productos.forEach((producto, index) => {
          if (filaAlterna) {
            doc.setFillColor(248, 249, 250);
            doc.rect(20, yPos, 170, 10, "F");
          }

          const cantidad = producto.cantidad || 1;
          const precioUnitario =
            producto.precio_unitario ||
            producto.precio ||
            producto.precio_final ||
            0;
          const productoSubtotal = cantidad * precioUnitario;
          subtotal += productoSubtotal;

          let nombreProducto =
            producto.nombre_producto || producto.nombre || "Producto";
          if (nombreProducto.length > 35) {
            nombreProducto = nombreProducto.substring(0, 32) + "...";
          }

          doc.text(nombreProducto, 25, yPos + 7);
          doc.text(`${cantidad}`, 115, yPos + 7, null, null, "center");
          doc.text(
            `HNL ${precioUnitario.toFixed(2)}`,
            145,
            yPos + 7,
            null,
            null,
            "right",
          );
          doc.text(
            `HNL ${productoSubtotal.toFixed(2)}`,
            185,
            yPos + 7,
            null,
            null,
            "right",
          );

          yPos += 10;
          filaAlterna = !filaAlterna;

          // Si hay muchos productos, agregar nueva página
          if (index > 0 && index % 20 === 0 && index < productos.length - 1) {
            doc.addPage();
            yPos = 20;
          }
        });

        doc.setDrawColor(...colores.borde);
        doc.line(20, yPos, 190, yPos);
        yPos += 5;
      } else {
        // Si no hay productos
        doc.text("No hay productos registrados en este pedido", 20, yPos);
        yPos += 20;
      }

      // ============================================
      //     SECCIÓN DE TOTALES
      // ============================================
      const impuestos = config.mostrarIVA ? subtotal * 0.15 : 0;
      const total = subtotal + (pedido.costo_envio || 0) + impuestos;

      doc.setDrawColor(...colores.acento);
      doc.setLineWidth(0.5);
      const rectY = yPos;
      doc.rect(110, rectY, 80, config.mostrarIVA ? 40 : 30);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colores.texto);

      doc.text("Subtotal:", 115, rectY + 10);
      doc.text(
        `HNL ${subtotal.toFixed(2)}`,
        185,
        rectY + 10,
        null,
        null,
        "right",
      );

      const envioCosto = pedido.costo_envio || 0;
      doc.text("Costo de envío:", 115, rectY + 18);
      doc.text(
        `HNL ${envioCosto.toFixed(2)}`,
        185,
        rectY + 18,
        null,
        null,
        "right",
      );

      let totalY = rectY + 26;
      if (config.mostrarIVA) {
        doc.text("IVA (15%):", 115, rectY + 26);
        doc.text(
          `HNL ${impuestos.toFixed(2)}`,
          185,
          rectY + 26,
          null,
          null,
          "right",
        );

        doc.setDrawColor(...colores.borde);
        doc.line(115, rectY + 30, 185, rectY + 30);
        totalY = rectY + 38;
      }

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colores.secundario);
      doc.setFontSize(12);
      doc.text("TOTAL:", 115, totalY);
      doc.text(`HNL ${total.toFixed(2)}`, 185, totalY, null, null, "right");

      yPos = totalY + 20;

      // ============================================
      //     INSTRUCCIONES DE PAGO - CON COLUMNAS (ALTURA DINÁMICA)
      // ============================================
      if (
        config.mostrarInstruccionesPago &&
        config.empresaInfo.cuentasBancarias
      ) {
        // Calcular la altura necesaria dinámicamente
        const cuentasCount = config.empresaInfo.cuentasBancarias.length;
        const lineHeight = 4.5;
        // Altura base + (número de cuentas * líneas por cuenta * lineHeight)
        const alturaBase = 30;
        const alturaPorCuenta = 4 * lineHeight; // 4 líneas por cuenta
        const alturaCalculada = alturaBase + cuentasCount * alturaPorCuenta;
        const instruccionesAltura = Math.max(60, Math.min(alturaCalculada, 80)); // Mínimo 60, máximo 80

        // Fondo para instrucciones
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
        const columnaDerechaX = 105;
        let yColumnaIzquierda = yPos + 18;
        let yColumnaDerecha = yPos + 18;

        // ===== COLUMNA IZQUIERDA =====

        // 1. Transferencia
        doc.setFont("helvetica", "bold");
        doc.text(
          "1. Realiza la transferencia:",
          columnaIzquierdaX,
          yColumnaIzquierda,
        );
        yColumnaIzquierda += lineHeight + 1;

        doc.setFont("helvetica", "normal");
        config.empresaInfo.cuentasBancarias.forEach((cuenta, index) => {
          // Número y banco
          doc.text(
            `${index + 1}. ${cuenta.banco}:`,
            columnaIzquierdaX + 5,
            yColumnaIzquierda,
          );
          yColumnaIzquierda += lineHeight - 1;

          // Detalles con sangría
          doc.text(
            `Cuenta: ${cuenta.cuenta}`,
            columnaIzquierdaX + 10,
            yColumnaIzquierda,
          );
          yColumnaIzquierda += lineHeight - 1;

          doc.text(
            `Titular: ${cuenta.titular}`,
            columnaIzquierdaX + 10,
            yColumnaIzquierda,
          );
          yColumnaIzquierda += lineHeight - 1;

          doc.text(
            `Tipo: ${cuenta.tipo}`,
            columnaIzquierdaX + 10,
            yColumnaIzquierda,
          );
          yColumnaIzquierda += lineHeight;
        });

        // 3. Monto (en columna izquierda)
        doc.setFont("helvetica", "bold");
        doc.text(
          "3. Monto a transferir:",
          columnaIzquierdaX,
          yColumnaIzquierda,
        );
        yColumnaIzquierda += lineHeight;

        doc.setFont("helvetica", "normal");
        doc.text(
          `HNL ${total.toFixed(2)}`,
          columnaIzquierdaX + 5,
          yColumnaIzquierda,
        );

        // ===== COLUMNA DERECHA =====

        // 2. Referencia
        doc.setFont("helvetica", "bold");
        doc.text("2. Referencia de pago:", columnaDerechaX, yColumnaDerecha);
        yColumnaDerecha += lineHeight;

        doc.setFont("helvetica", "normal");
        // Si la referencia es muy larga, la partimos
        const referencia = pedido.identificador_pedido || pedido.id;
        if (referencia && referencia.length > 20) {
          const mitad = Math.floor(referencia.length / 2);
          doc.text(
            referencia.substring(0, mitad),
            columnaDerechaX + 5,
            yColumnaDerecha,
          );
          yColumnaDerecha += lineHeight - 1;
          doc.text(
            referencia.substring(mitad),
            columnaDerechaX + 5,
            yColumnaDerecha,
          );
          yColumnaDerecha += lineHeight;
        } else if (referencia) {
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
        doc.text(
          config.empresaInfo.whatsapp,
          columnaDerechaX + 5,
          yColumnaDerecha,
        );

        yPos += instruccionesAltura + 10;
      }

      // ============================================
      //     NOTAS IMPORTANTES (EXACTAMENTE COMO EN EL EJEMPLO)
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

        // NOTAS EXACTAMENTE COMO EN TU EJEMPLO
        doc.text(
          "• Esta factura no es válida como comprobante de pago.",
          20,
          notaY,
        );
        notaY += espacioLineaNota;

        doc.text(
          "• El pedido se procesará al recibir el comprobante de pago.",
          20,
          notaY,
        );
        notaY += espacioLineaNota;

        doc.text(
          "• Para consultas contactar: " + config.empresaInfo.telefono,
          20,
          notaY,
        );
        notaY += espacioLineaNota;

        doc.text("• Horario: Lunes a Viernes 8:00 AM - 5:00 PM", 20, notaY);

        yPos = notaY + 10;
      } else {
        // Si no hay espacio, poner notas más compactas (COMO EN EL EJEMPLO)
        doc.setFontSize(7);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(108, 117, 125);

        doc.text(
          "Nota: Enviar comprobante al WhatsApp para procesar pedido.",
          20,
          yPos + 5,
        );
        yPos += 10;
      }

      // ============================================
      //     PIE DE PÁGINA (EXACTAMENTE COMO EN EL EJEMPLO)
      // ============================================

      // Línea separadora
      doc.setDrawColor(...colores.primario);
      doc.setLineWidth(0.5);
      doc.setLineDashPattern([], 0);

      const pieY = Math.max(280, yPos + 15); // Asegurar posición mínima
      doc.line(20, pieY, 190, pieY);

      // Texto pie de página (EXACTAMENTE COMO EN EL EJEMPLO)
      doc.setTextColor(...colores.texto);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      doc.text(
        "Gracias por su compra - " + config.empresaInfo.nombre,
        105,
        pieY + 5,
        null,
        null,
        "center",
      );
      doc.text(
        "Factura generada automáticamente",
        105,
        pieY + 10,
        null,
        null,
        "center",
      );

      // Número de página (EXACTAMENTE COMO EN EL EJEMPLO)
      doc.text(`Página 1 de 1`, 190, pieY + 10, null, null, "right");

      // ============================================
      //     GUARDAR PDF
      // ============================================
      const nombreArchivo = obtenerNombreArchivo(pedido, config);
      doc.save(nombreArchivo);

      console.log("💾 PDF guardado como:", nombreArchivo);
      resolve(nombreArchivo);
    } catch (error) {
      console.error("❌ Error en generarFacturaInterna:", error);
      reject(error);
    }
  });
}

// ============================================
//     FUNCIONES AUXILIARES
// ============================================

/**
 * Obtiene el nombre del archivo según la configuración
 */
function obtenerNombreArchivo(pedido, config) {
  // Obtener identificador del pedido
  const identificador =
    pedido.identificador_pedido || pedido.id || `pedido-${Date.now()}`;

  // Obtener fecha actual en formato YYYYMMDD
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  const fechaActual = `${año}${mes}${dia}`;

  // Obtener hora actual en formato HHMM (opcional)
  const horas = String(ahora.getHours()).padStart(2, "0");
  const minutos = String(ahora.getMinutes()).padStart(2, "0");
  const horaActual = `${horas}${minutos}`;

  let nombreArchivo;

  switch (config.tipo) {
    case "admin":
      // Para administración: FACTURA-ADMIN-IDENTIFICADOR-FECHA-HORA
      nombreArchivo = `FACTURA-ADMIN-${identificador}-${fechaActual}-${horaActual}.pdf`;
      break;

    case "comprobante":
      // Para comprobante: COMPROBANTE-IDENTIFICADOR-FECHA
      nombreArchivo = `COMPROBANTE-${identificador}-${fechaActual}.pdf`;
      break;

    default:
      // Para cliente: VENT-IDENTIFICADOR-FECHA
      // Extraer solo la parte numérica del identificador si es posible
      let identificadorNum = identificador;
      if (identificador.includes("-")) {
        const partes = identificador.split("-");
        if (partes.length >= 2) {
          identificadorNum = partes[1]; // Tomar la parte numérica después del primer guion
        }
      }
      nombreArchivo = `VENT-${identificadorNum}-${fechaActual}.pdf`;
  }

  console.log("📄 Nombre de archivo generado:", nombreArchivo);
  return nombreArchivo;
}

/**
 * Formatea el estado del pedido para mostrar
 */
function formatearEstadoPedido(estado) {
  const estados = {
    comprobante_pendiente: "Comprobante Pendiente",
    en_revision: "En Revisión",
    confirmado: "Confirmado",
    cancelado: "Cancelado",
    completado: "Completado",
    entregado: "Entregado",
    en_proceso: "En Proceso",
    pendiente: "Pendiente",
  };

  const estadoLower = (estado || "").toLowerCase();
  return (
    estados[estadoLower] || estado.charAt(0).toUpperCase() + estado.slice(1)
  );
}

/**
 * Obtiene el nombre del cliente de diferentes formatos de pedido
 */
function obtenerNombreCliente(pedido) {
  if (pedido.cliente) {
    if (typeof pedido.cliente === "string") {
      return pedido.cliente;
    }
    if (typeof pedido.cliente === "object") {
      return (
        pedido.cliente.nombre ||
        pedido.cliente.nombre_completo ||
        "Cliente no especificado"
      );
    }
  }

  return (
    pedido.cliente_nombre || pedido.nombre_cliente || "Cliente no especificado"
  );
}

// ============================================
//     EXPORTAR FUNCIONES AL SCOPE GLOBAL
// ============================================

// Hacer las funciones disponibles globalmente
window.generarFacturaPDF = generarFacturaPDF;
window.cargarJSPDF = cargarJSPDF;
window.EMPRESA_INFO = EMPRESA_INFO;
window.formatearEstadoPedido = formatearEstadoPedido;
window.obtenerNombreCliente = obtenerNombreCliente;

console.log("✅ Funciones de facturación cargadas globalmente");
