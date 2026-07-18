require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Routes des modules (à brancher au fur et à mesure du developpement)
app.use('/api/authentification', require('./modules/authentification/routes/authentification.routes'));
// app.use('/api/beneficiaires', require('./modules/beneficiaires/routes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'mmf-backend' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`MMF backend demarre sur le port ${PORT}`);
});
