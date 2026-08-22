const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Stockage local simple (pas de service cloud configuré dans ce projet) —
// suffisant pour une appli de terrain : le fichier reste sur le serveur,
// servi ensuite via /uploads (voir server.js).
const DOSSIER_UPLOADS = path.join(__dirname, '../../uploads/beneficiaires');
fs.mkdirSync(DOSSIER_UPLOADS, { recursive: true });

const stockage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DOSSIER_UPLOADS),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
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
 * une connexion mobile en zone rurale.
 */
const uploadPhoto = multer({
  storage: stockage,
  fileFilter: filtrerFichier,
  limits: { fileSize: 3 * 1024 * 1024 },
});

module.exports = { uploadPhoto };
