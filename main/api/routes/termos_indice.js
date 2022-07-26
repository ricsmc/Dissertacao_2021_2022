var express = require('express');
var router = express.Router();
var TermoIndiceControl = require('../controllers/termos_indice')


/* GET home page. */
router.get('/', function(req, res, next) {
    TermoIndiceControl.termos()
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => {
			res.status(500).jsonp(err)
		})
});

router.get('/quantos', function(req, res, next) {
    TermoIndiceControl.quantos()
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => {
			res.status(500).jsonp(err)
		})
});

router.get('/termoIndice', function(req, res, next) {
    TermoIndiceControl.termo(req.query.valor)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => {
			res.status(500).jsonp(err)
		})
});



module.exports = router;
