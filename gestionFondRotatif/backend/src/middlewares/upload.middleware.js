const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Stockage sur Cloudinary — le disque local d'un serveur hébergé (Railway,
// Render...) n'est pas persistant : les photos disparaissaient à chaque
// redéploiement ou redémarrage du service. Cloudinary garde les fichiers
// durablement, indépendamment du cycle de vie du serveur applicatif.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const stockage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'mmf/beneficiaires',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    // Limite la taille de l'image conservée, sans déformer (crop: 'limit'
    // ne recadre pas, il empêche juste de dépasser ce format).
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
  },
});

const TYPES_ACCEPTES = ['image/jpeg', 'image/png', 'image/webp'];

function filtrerFichier(req, file, cb) {
  if (!TYPES_ACCEPTES.includes(file.mimetype)) {
    return cb(new Error('Format de photo non supporté (JPEG, PNG ou WEBP uniquement).'));
  }
  cb(null, true);
}

/**
 * Middleware d'upload d'UNE photo — champ multipart nommé "photo".
 * Limite à 3 Mo : suffisant pour une photo de terrain, assez léger pour
 * une connexion mobile en zone rurale. Une fois traité par ce middleware,
 * req.file.path contient l'URL Cloudinary complète et durable de l'image
 * (https://res.cloudinary.com/...), à enregistrer telle quelle en base.
 */
const uploadPhoto = multer({
  storage: stockage,
  fileFilter: filtrerFichier,
  limits: { fileSize: 3 * 1024 * 1024 },
});

module.exports = { uploadPhoto };
