var express = require('express');
var router = express.Router();
var IndicadorControl = require('../controllers/indicadores')

router.get('/classes', function(req, res, next) {
    IndicadorControl.classes()
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/classesN1', function(req, res, next) {
    IndicadorControl.classesN1()
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/classesN2', function(req, res, next) {
    IndicadorControl.classesN2()
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/classesN3', function(req, res, next) {
    IndicadorControl.classesN3()
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/classesN4', function(req, res, next) {
    IndicadorControl.classesN4()
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/critJust', function(req, res, next) {
    IndicadorControl.critJust()
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/critJust/:critJust', function(req, res, next) {
    const v = ["legal", "gestionario", "utilidadeAdministrativa", "densidadeInfo", "complementaridadeInfo"]
    if (!v.includes(req.params.critJust)){
        res.status(422).json({error:"error"})
    } 
    else {
        IndicadorControl.critJustType(req.params.critJust)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
    }
    
});

router.get('/critstats', function(req, res, next) {
    IndicadorControl.critstats()
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/df/:df', function(req, res, next) {
    IndicadorControl.df(req.params.df)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/dfstats', function(req, res, next) {
    IndicadorControl.dfstats()
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/entidades', function(req, res, next) {
    IndicadorControl.entidades()
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/entidadesAtivas', function(req, res, next) {
    IndicadorControl.entidadesAtivas()
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/leg', function(req, res, next) {
    IndicadorControl.leg()
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/legVigor', function(req, res, next) {
    IndicadorControl.legVigor()
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/relacoes/:r', function(req, res, next) {
    IndicadorControl.relacoes(req.params.r)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/relstats', function(req, res, next) {
    IndicadorControl.relstats()
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/tipologias', function(req, res, next) {
    IndicadorControl.tipologias()
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/tabela', function(req, res, next) {
    IndicadorControl.tabela()
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

module.exports = router;

