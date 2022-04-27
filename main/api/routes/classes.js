var express = require('express');
var router = express.Router();
var ClassControl = require('../controllers/classes')


/* GET home page. */
router.get('/', function(req, res, next) {
    ClassControl.classes()
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
});

router.get('/:id/descendencia', function(req, res, next) {
    ClassControl.classChildren(req.params.id)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => res.status(500).jsonp(err))
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



module.exports = router;
