var express = require('express');
var router = express.Router();
var EntidadeControl = require('../controllers/entidades')

/* GET home page. */
router.get('/', function(req, res, next) {
    EntidadeControl.entidades()
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/designacao', function(req, res, next) {
    EntidadeControl.designacao(req.query.valor)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/sigla', function(req, res, next) {
    EntidadeControl.sigla(req.query.valor)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/:id', function(req, res, next) {
    EntidadeControl.id(req.params.id)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/:id/intervencao/dono', function(req, res, next) {
    EntidadeControl.intDono(req.params.id)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/:id/intervencao/participante', function(req, res, next) {
    EntidadeControl.intParticipante(req.params.id)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/:id/tipologias', function(req, res, next) {
    EntidadeControl.tipologias(req.params.id)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.post('/', function(req, res, next) {
    EntidadeControl.insert(req.body)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});



module.exports = router;
