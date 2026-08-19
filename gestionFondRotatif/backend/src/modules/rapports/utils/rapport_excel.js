const ExcelJS = require('exceljs');

const VERT_FONCE = '2C4A3A'; // même couleur que le thème de l'application (--vert-fonce)

/**
 * Style commun appliqué à une ligne d'en-tête de tableau, sur les
 * colonnes 1..nombreColonnes de la feuille — fond vert foncé, texte
 * blanc en gras, cohérent avec l'identité visuelle du reste de l'appli.
 */
function styliserEntete(feuille, ligneIndex, nombreColonnes) {
  const ligne = feuille.getRow(ligneIndex);
  for (let col = 1; col <= nombreColonnes; col += 1) {
    const cellule = ligne.getCell(col);
    cellule.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cellule.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${VERT_FONCE}` } };
    cellule.alignment = { vertical: 'middle' };
  }
  ligne.height = 20;
}

/**
 * Génère le rapport au format Excel (3 feuilles : indicateurs, situation
 * par canton, détail nominatif des bénéficiaires financés sur la
 * période) et l'écrit directement dans la réponse HTTP — même principe
 * de streaming que rapport_pdf.js, sans fichier temporaire sur le disque.
 * @param {import('express').Response} res
 * @param {object} rapport - instance du modèle RapportGenere
 * @param {Array<object>} remboursementsParCanton - voir rapport.service.consulterRemboursementsParCanton
 * @param {Array<object>} detailBeneficiaires - voir rapport.service.consulterDetailBeneficiaires
 */
async function genererRapportExcel(res, rapport, remboursementsParCanton, detailBeneficiaires) {
  const classeur = new ExcelJS.Workbook();
  classeur.creator = 'Fonds Rotatif MMF — AJEOV Technologies';
  classeur.created = new Date();

  // --- Feuille 1 : Indicateurs -----------------------------------
  const feuilleIndicateurs = classeur.addWorksheet('Indicateurs');
  feuilleIndicateurs.columns = [
    { header: 'Indicateur', key: 'libelle', width: 32 },
    { header: 'Valeur', key: 'valeur', width: 22 },
  ];
  styliserEntete(feuilleIndicateurs, 1, 2);

  feuilleIndicateurs.addRows([
    { libelle: 'Période', valeur: `${new Date(rapport.periodeDebut).toLocaleDateString('fr-FR')} au ${new Date(rapport.periodeFin).toLocaleDateString('fr-FR')}` },
    { libelle: 'Bénéficiaires touchés', valeur: rapport.nombreBeneficiaires },
    { libelle: 'Montant total financé (FCFA)', valeur: Number(rapport.montantTotalFinance) },
    { libelle: 'Montant total remboursé (FCFA)', valeur: Number(rapport.montantTotalRembourse) },
    { libelle: 'Taux de remboursement (%)', valeur: Number(rapport.tauxRemboursement) },
    { libelle: 'Nombre de retards', valeur: rapport.nombreRetards },
    { libelle: 'Généré le', valeur: new Date(rapport.dateGeneration).toLocaleDateString('fr-FR') },
  ]);
  feuilleIndicateurs.getColumn('valeur').numFmt = '#,##0';
  feuilleIndicateurs.getCell('B4').numFmt = '#,##0 "FCFA"';
  feuilleIndicateurs.getCell('B5').numFmt = '#,##0 "FCFA"';
  feuilleIndicateurs.getCell('B6').numFmt = '0.0"%"';

  // --- Feuille 2 : Remboursements par canton ----------------------
  const feuilleCantons = classeur.addWorksheet('Remboursements par canton');
  feuilleCantons.columns = [
    { header: 'Canton', key: 'cantonNom', width: 24 },
    { header: 'Montant remboursé (FCFA)', key: 'montantRembourse', width: 24 },
    { header: 'Nombre de remboursements', key: 'nombreRemboursements', width: 24 },
  ];
  styliserEntete(feuilleCantons, 1, 3);
  remboursementsParCanton.forEach((r) => {
    feuilleCantons.addRow({
      cantonNom: r.cantonNom,
      montantRembourse: r.montantRembourse,
      nombreRemboursements: r.nombreRemboursements,
    });
  });
  feuilleCantons.getColumn('montantRembourse').numFmt = '#,##0';

  // --- Feuille 3 : Détail des bénéficiaires financés --------------
  const feuilleDetail = classeur.addWorksheet('Détail bénéficiaires');
  feuilleDetail.columns = [
    { header: 'Nom', key: 'beneficiaireNom', width: 18 },
    { header: 'Prénom', key: 'beneficiairePrenom', width: 18 },
    { header: 'Canton', key: 'cantonNom', width: 20 },
    { header: 'Code financement', key: 'codeFinancement', width: 20 },
    { header: 'Montant attribué (FCFA)', key: 'montantAttribue', width: 22 },
    { header: 'Date attribution', key: 'dateAttribution', width: 18 },
  ];
  styliserEntete(feuilleDetail, 1, 6);
  detailBeneficiaires.forEach((b) => {
    feuilleDetail.addRow({
      beneficiaireNom: b.beneficiaireNom,
      beneficiairePrenom: b.beneficiairePrenom,
      cantonNom: b.cantonNom,
      codeFinancement: b.codeFinancement,
      montantAttribue: b.montantAttribue,
      dateAttribution: b.dateAttribution ? new Date(b.dateAttribution).toLocaleDateString('fr-FR') : '—',
    });
  });
  feuilleDetail.getColumn('montantAttribue').numFmt = '#,##0';

  const nomFichier = `rapport_${rapport.periodeDebut}_${rapport.periodeFin}.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${nomFichier}"`);

  await classeur.xlsx.write(res);
  res.end();
}

module.exports = { genererRapportExcel };
