import { CLOUDINARY_CONFIG, CLOUDINARY_UPLOAD_URL } from './cloudinaryConfig';

/**
 * Sube una imagen a Cloudinary
 * @param {string} imageUri - URI local de la imagen
 * @param {string} folder - Carpeta en Cloudinary (opcional)
 * @returns {Promise<string>} - URL segura de la imagen en Cloudinary
 */
export const uploadImageToCloudinary = async (imageUri, folder = 'products') => {
  try {
    // Crear FormData para enviar la imagen
    const formData = new FormData();
    
    // Obtener el nombre y tipo del archivo
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // Agregar la imagen al FormData
    formData.append('file', {
      uri: imageUri,
      type: type,
      name: filename,
    });

    // Agregar configuración de Cloudinary
    formData.append('upload_preset', CLOUDINARY_CONFIG.upload_preset);
    formData.append('folder', folder);

    // Realizar el upload
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return data.secure_url; // URL segura de la imagen
    } else {
      throw new Error(data.error?.message || 'Error al subir imagen');
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Elimina una imagen de Cloudinary (requiere backend con firma)
 * Nota: La eliminación directa desde el frontend no es segura
 * @param {string} publicId - Public ID de la imagen en Cloudinary
 */
export const deleteImageFromCloudinary = async (publicId) => {
  console.warn('La eliminación de imágenes requiere un backend para firmar la petición');
  // Implementar con backend cuando sea necesario
};
