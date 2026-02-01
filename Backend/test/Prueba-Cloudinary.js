// utils/Prueba-Cloudinary.js
const cloudinary = require('../utils/Cloudinary');
const path = require('path');

async function probarSubida() {
  try {
    console.log('🔄 Iniciando prueba de Cloudinary...');
    
    // Ruta ABSOLUTA a una imagen de prueba
    const rutaImagen = path.join(__dirname, '../test/Eclipse01.jpg');
    console.log('📁 Buscando imagen en:', rutaImagen);
    
    // Verifica si el archivo existe
    const fs = require('fs');
    if (!fs.existsSync(rutaImagen)) {
      console.log('⚠️  Creando imagen de prueba...');
      // Crea un archivo de texto como fallback
      fs.writeFileSync(rutaImagen, 'contenido de prueba');
    }
    
    const resultado = await cloudinary.uploader.upload(rutaImagen, {
      folder: 'venta_muebles/productos', // MINÚSCULAS, sin espacios
      upload_preset: 'venta_muebles_unsigned'
    });
    
    console.log('\n✅ ¡IMAGEN SUBIDA EXITOSAMENTE!');
    console.log('===============================');
    console.log('📂 Carpeta:', resultado.folder);
    console.log('🆔 Public ID:', resultado.public_id);
    console.log('🔗 URL:', resultado.secure_url);
    console.log('📏 Tamaño:', resultado.bytes, 'bytes');
    console.log('🖼️  Formato:', resultado.format);
    console.log('📅 Creada:', resultado.created_at);
    
    return resultado;
    
  } catch (error) {
    console.error('\n❌ ERROR EN LA PRUEBA:');
    console.error('Mensaje:', error.message);
    
    if (error.http_code) {
      console.error('Código HTTP:', error.http_code);
    }
    
    // Errores comunes:
    if (error.message.includes('Invalid api_key')) {
      console.log('\n💡 SOLUCIÓN: Verifica tus credenciales en Cloudinary.js');
    } else if (error.message.includes('File not found')) {
      console.log('\n💡 SOLUCIÓN: La ruta de la imagen es incorrecta');
    } else if (error.message.includes('upload_preset')) {
      console.log('\n💡 SOLUCIÓN: El upload_preset no existe o está mal escrito');
    }
    
    return null;
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  probarSubida().then(resultado => {
    if (resultado) {
      console.log('\n🎉 ¡Prueba completada! Verifica en:');
      console.log('https://cloudinary.com/console/media_library');
    } else {
      console.log('\n🔴 Prueba fallida. Revisa los errores arriba.');
    }
  });
}

module.exports = probarSubida;