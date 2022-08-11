var express = require('express');
var router = express.Router();
var ClassControl = require('../controllers/classes')


/* GET home page. */
router.get('/', function(req, res, next) {
    ClassControl.classes(req.query.estrutura,req.query.tipo,parseInt(req.query.nivel),req.query.ents,req.query.tips,req.query.info)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => {
			res.status(500).jsonp(err)
		})
});


router.get('/codigo', function(req, res, next) {
    ClassControl.codigo(req.query.valor)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/justificacao/:id', function(req, res, next) {
    ClassControl.justificacao(req.params.id)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/titulo', function(req, res, next) {
    ClassControl.titulo(req.query.valor)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});


router.get('/:id', function(req, res, next) {
    ClassControl.class(req.params.id,req.query.tipo == 'subarvore' ? true : false)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => {
			console.log(err)
			res.status(500).jsonp(err)
		})
});

router.get('/:id/descendencia', function(req, res, next) {
    ClassControl.classChildren(req.params.id)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => {
			console.log(err)
			res.status(500).jsonp(err)
		})
});

router.get('/:id/df', function(req, res, next) {
    ClassControl.classDF(req.params.id)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/:id/dono', function(req, res, next) {
    ClassControl.classDono(req.params.id)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/:id/exemplosNotasAp', function(req, res, next) {
    ClassControl.exemplosNotasAp(req.params.id)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});


router.get('/:id/legislacao', function(req, res, next) {
    ClassControl.legislacao(req.params.id)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/:id/meta', function(req, res, next) {
    ClassControl.meta(req.params.id)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/:id/notasAp', function(req, res, next) {
    ClassControl.notasApEx(req.params.id,'Aplicacao')
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/:id/notasEx', function(req, res, next) {
    ClassControl.notasApEx(req.params.id,'Exclusao')
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/:id/participante', function(req, res, next) {
    ClassControl.participante(req.params.id)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/:id/pca', function(req, res, next) {
    ClassControl.pca(req.params.id)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/:id/procRel', function(req, res, next) {
    ClassControl.procRel(req.params.id)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});


router.get('/:id/procRel/:relacao', function(req, res, next) {
    ClassControl.procRel(req.params.id, req.params.relacao)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/:id/ti', function(req, res, next) {
    ClassControl.ti(req.params.id)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});


module.exports = router;
