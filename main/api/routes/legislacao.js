var express = require('express');
var router = express.Router();
var LegislacaoControl = require('../controllers/legislacao')

router.get('/', function(req, res, next) {
    LegislacaoControl.legislacao()
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => {
			res.status(500).jsonp(err)
		})
});

router.get('/numero', function(req, res, next) {
    LegislacaoControl.numero(req.query.valor)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => {
			res.status(500).jsonp(err)
		})
});

router.get('/portarias', function(req, res, next) {
    LegislacaoControl.portarias()
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => {
			res.status(500).jsonp(err)
		})
});

router.get('/:id', function(req, res, next) {
    LegislacaoControl.legislacaoId(req.params.id)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => {
			res.status(500).jsonp(err)
		})
});

router.get('/:id/processos', function(req, res, next) {
    LegislacaoControl.processos(req.params.id)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => {
			res.status(500).jsonp(err)
		})
});

router.put('/:id', function(req, res, next) {
    LegislacaoControl.edit(req.params.id, req.body)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => {
			res.status(500).jsonp(err)
		})
});

router.put('/:id/revogar', function(req, res, next) {
    LegislacaoControl.revogar(req.params.id,req.body)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => {
			res.status(500).jsonp(err)
		})
});

module.exports = router;
