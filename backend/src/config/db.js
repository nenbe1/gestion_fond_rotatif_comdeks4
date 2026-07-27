require('dotenv').config();
const mysql = require('mysql2/promise');

/**
 * dateStrings: true — corrige un bug de fuseau horaire important.
 *
 * Sans cette option, mysql2 convertit les colonnes DATE/DATETIME en objets
 * Date JavaScript (minuit heure locale), qui sont ensuite reconvertis en
 * UTC lors de la sérialisation JSON. Le Cameroun étant en UTC+1, une date
 * comme "2026-07-23" se retrouvait décalée en "2026-07-22T23:00:00.000Z"
 * une fois envoyée au frontend — la veille à 23h au lieu de la bonne date.
 *
 * Avec dateStrings: true, les dates sont renvoyées telles quelles en texte
 * (ex: "2026-07-23"), sans conversion de fuseau horaire ambiguë.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
});

module.exports = pool;
