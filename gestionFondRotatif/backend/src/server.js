require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(cors());
app.use(express.json());

// Documentation API interactive (Swagger) — module 8 (livrables de
// stage) : "API REST sécurisée et documentée". Consultable sur
// http://localhost:5000/api-docs, testable directement depuis le
// navigateur (bouton "Authorize" pour coller un token JWT).
const specificationOpenAPI = YAML.load(path.join(__dirname, '../docs/openapi.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specificationOpenAPI));

// Photos de bénéficiaires (module Bénéficiaires — upload local, pas de
// service cloud configuré dans ce projet). Accessible en lecture via
// /uploads/beneficiaires/<fichier>.
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes des modules (à brancher au fur et à mesure du developpement)
app.use('/api/authentification', require('./modules/authentification/routes/authentification.routes'));
app.use('/api/beneficiaires', require('./modules/beneficiaires/routes/beneficiaire.routes'));
app.use('/api/membres-comite', require('./modules/membres_comite/routes/membre_comite.routes'));
app.use('/api/demandes-financement', require('./modules/demandes_financement/routes/demande_financement.routes'));
app.use('/api/validations', require('./modules/validations/routes/validation.routes'));
app.use('/api/financements', require('./modules/financements/routes/financement.routes'));
app.use('/api/attributions', require('./modules/attributions/routes/attribution.routes'));
app.use('/api/remboursements', require('./modules/remboursements/routes/remboursement.routes'));
app.use('/api/domaines', require('./modules/domaines/routes/domaine.routes'));
app.use('/api/vagues', require('./modules/vagues/routes/vague.routes'));
app.use('/api/programmes', require('./modules/programmes/routes/programme.routes'));
app.use('/api/fond-rotatif', require('./modules/fond_rotatif/routes/fond_rotatif.routes'));
app.use('/api/rapports', require('./modules/rapports/routes/rapport.routes'));
app.use('/api/autorites', require('./modules/autorites/routes/autorite.routes'));
app.use('/api/parametres', require('./modules/parametrage/routes/parametre.routes'));
app.use('/api/parametrage', require('./modules/parametrage/routes/parametrage.routes'));
app.use('/api/administration', require('./modules/administration/routes/administration.routes'));
app.use('/api/conseiller-ia', require('./modules/conseiller_ia/routes/conseiller_ia.routes'));
app.use('/api/groupes-mmf', require('./modules/groupes_mmf/routes/groupe_mmf.routes'));
app.use('/api/cotisations', require('./modules/cotisations/routes/cotisation.routes'));
app.use('/api/notifications', require('./modules/notifications/routes/notification.routes'));
app.use(cors({ origin: 'https://dapper-otter-3c4b79.netlify.app', credentials: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'mmf-backend' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`MMF backend demarre sur le port ${PORT}`);
});

// Rappels d'échéance de remboursement (3 jours avant), vérifiés chaque
// jour à 7h00 — voir src/jobs/rappelsEcheance.js.
const { planifierRappelsEcheance } = require('./jobs/rappelsEcheance');
planifierRappelsEcheance();
