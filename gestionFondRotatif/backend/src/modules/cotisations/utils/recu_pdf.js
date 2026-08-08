const PDFDocument = require('pdfkit');

/**
 * Génère le reçu PDF d'une cotisation et l'écrit directement dans la
 * réponse HTTP (streaming — pas de fichier temporaire sur le disque).
 * @param {import('express').Response} res
 * @param {object} cotisation - instance du modèle Cotisation
 */
function genererRecuCotisation(res, cotisation) {
  const doc = new PDFDocument({ size: 'A5', margin: 40 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="recu_${cotisation.codeCotisation}.pdf"`);
  doc.pipe(res);

  doc.fontSize(16).font('Helvetica-Bold').text('Fonds Rotatif MMF', { align: 'center' });
  doc.fontSize(10).font('Helvetica').fillColor('#555').text('AJEOV Technologies', { align: 'center' });
  doc.moveDown(1.5);

  doc.fillColor('#000').fontSize(14).font('Helvetica-Bold').text('Reçu de cotisation', { align: 'center' });
  doc.moveDown(1);

  doc.fontSize(10).font('Helvetica');
  const ligne = (libelle, valeur) => {
    doc.font('Helvetica-Bold').text(libelle, { continued: true });
    doc.font('Helvetica').text(`  ${valeur}`);
    doc.moveDown(0.4);
  };

  ligne('Référence :', cotisation.codeCotisation);
  ligne('Date :', new Date(cotisation.dateVersement).toLocaleDateString('fr-FR'));
  ligne('Bénéficiaire :', `${cotisation.beneficiaireNom} ${cotisation.beneficiairePrenom}`);
  ligne('Groupe MMF :', cotisation.groupeNom);
  ligne('Montant versé :', `${Number(cotisation.montant).toLocaleString('fr-FR')} FCFA`);
  if (cotisation.observation) ligne('Observation :', cotisation.observation);
  ligne('Enregistré par :', `${cotisation.enregistreParNom} ${cotisation.enregistreParPrenom}`);

  doc.moveDown(2);
  doc.fontSize(8).fillColor('#888').text(
    "Ce reçu atteste du versement ci-dessus dans le cadre du Fonds Rotatif MMF. À conserver.",
    { align: 'center' }
  );

  doc.end();
}

module.exports = { genererRecuCotisation };
