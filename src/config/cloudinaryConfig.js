// Configuración de Cloudinary
export const CLOUDINARY_CONFIG = {
  cloud_name: 'dqlzoeqeh',
  upload_preset: 'almacaninamovil',
};

// URL base para uploads
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/upload`;
