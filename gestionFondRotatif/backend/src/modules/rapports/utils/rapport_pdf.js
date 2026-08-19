const PDFDocument = require('pdfkit');

/**
 * Formate un montant avec des espaces classiques comme séparateurs de
 * milliers. Même correction que pour le reçu de cotisation :
 * toLocaleString('fr-FR') insère une espace insécable que la police
 * PDFKit par défaut n'affiche pas correctement.
 */
function formaterMontant(montant) {
  return Number(montant).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Génère le PDF d'un rapport et l'écrit directement dans la réponse
 * HTTP (streaming — pas de fichier temporaire sur le disque).
 * @param {import('express').Response} res
 * @param {object} rapport - instance du modèle RapportGenere
 */
function genererRapportPdf(res, rapport) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  const nomFichier = `rapport_${rapport.periodeDebut}_${rapport.periodeFin}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${nomFichier}"`);
  doc.pipe(res);

  doc.fontSize(18).font('Helvetica-Bold').text('Fonds Rotatif MMF', { align: 'center' });
  doc.fontSize(10).font('Helvetica').fillColor('#555').text('AJEOV Technologies — COMDEKS4', { align: 'center' });
  doc.moveDown(1.5);

  doc.fillColor('#000').fontSize(15).font('Helvetica-Bold').text('Rapport d\'activité', { align: 'center' });
  doc.fontSize(11).font('Helvetica').fillColor('#555').text(
    `Période du ${new Date(rapport.periodeDebut).toLocaleDateString('fr-FR')} au ${new Date(rapport.periodeFin).toLocaleDateString('fr-FR')}`,
    { align: 'center' }
  );
  doc.moveDown(2);

  doc.fillColor('#000');
  const ligne = (libelle, valeur) => {
    doc.font('Helvetica-Bold').fontSize(11).text(libelle, { continued: true });
    doc.font('Helvetica').text(`  ${valeur}`);
    doc.moveDown(0.6);
  };

  ligne('Bénéficiaires touchés :', `${rapport.nombreBeneficiaires}`);
  ligne('Montant total financé :', `${formaterMontant(rapport.montantTotalFinance)} FCFA`);
  ligne('Montant total remboursé :', `${formaterMontant(rapport.montantTotalRembourse)} FCFA`);
  ligne('Taux de remboursement :', `${rapport.tauxRemboursement} %`);
  ligne('Nombre de retards :', `${rapport.nombreRetards}`);

  doc.moveDown(2);
  doc.fontSize(8).fillColor('#888').text(
    `Rapport généré le ${new Date(rapport.dateGeneration).toLocaleDateString('fr-FR')} — instantané figé, ne reflète pas d'éventuelles modifications postérieures des données.`,
    { align: 'center' }
  );

  doc.end();
}

module.exports = { genererRapportPdf };
