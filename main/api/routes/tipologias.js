var express = require('express');
var router = express.Router();
var TipologiaControl = require('../controllers/tipologias')


/* GET home page. */
router.get('/', function(req, res, next) {
    TipologiaControl.tipologias(req.query.info==='completa' ? true : false, req.query.tips,req.query.designacao,req.query.estado)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => {
			res.status(500).jsonp(err)
		})
});

router.get('/designacao', function(req, res, next) {
    TipologiaControl.designacao(req.query.valor)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => {
            console.log(err)
			res.status(500).jsonp(err)
		})
});

router.get('/sigla', function(req, res, next) {
    TipologiaControl.sigla(req.query.valor)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => {
            console.log(err)
			res.status(500).jsonp(err)
		})
});

router.get('/:id', function(req, res, next) {
    TipologiaControl.tipologia(req.query.info=='completa' ? true : false , req.params.id)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => {
			console.log(err)
			res.status(500).jsonp(err)
		})
});

router.get('/:id/elementos', function(req, res, next) {
    TipologiaControl.elementos(req.params.id)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => {
			res.status(500).jsonp(err)
		})
});

router.get('/:id/intervencao/dono', function(req, res, next) {
    TipologiaControl.dono(req.params.id)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => {
			res.status(500).jsonp(err)
		})
});

router.get('/:id/intervencao/participante', function(req, res, next) {
    TipologiaControl.participante(req.params.id)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => {
			res.status(500).jsonp(err)
		})
});

router.post('/', function(req, res, next) {
    TipologiaControl.insert(req.body)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => {
			res.status(500).jsonp(err)
		})
});

router.put('/:id', function(req, res, next) {
    TipologiaControl.edit(req.params.id,req.body)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => {
			res.status(500).jsonp(err)
		})
});

module.exports = router;
