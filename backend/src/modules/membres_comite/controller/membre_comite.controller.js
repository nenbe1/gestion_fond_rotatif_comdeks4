const membreComiteService = require('../service/membre_comite.service');

async function creer(req, res) {
  try {
    const membre = await membreComiteService.creer(req.body);
    res.status(201).json({ membre });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function consulterTous(req, res) {
  try {
    const membres = await membreComiteService.consulterTous();
    res.status(200).json({ membres });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function consulterParId(req, res) {
  try {
    const membre = await membreComiteService.consulterParId(req.params.id);
    res.status(200).json({ membre });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function modifier(req, res) {
  try {
    const membre = await membreComiteService.modifier(req.params.id, req.body);
    res.status(200).json({ membre });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function listerFonctions(req, res) {
  try {
    const fonctions = await membreComiteService.listerFonctions();
    res.status(200).json({ fonctions });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function listerCantons(req, res) {
  try {
    const cantons = await membreComiteService.listerCantons();
    res.status(200).json({ cantons });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = { creer, consulterTous, consulterParId, modifier, listerFonctions, listerCantons };
