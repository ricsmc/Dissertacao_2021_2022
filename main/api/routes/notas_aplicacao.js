var express = require('express');
var router = express.Router();
var NotaApControl = require('../controllers/notas_aplicacao')


/* GET home page. */
router.get('/', function(req, res, next) {
    NotaApControl.notas()
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => {
			res.status(500).jsonp(err)
		})
});

router.get('/notaAp', function(req, res, next) {
    NotaApControl.nota(req.query.valor)
	    .then(dados =>  res.status(200).jsonp(dados))
	    .catch(err => {
			res.status(500).jsonp(err)
		})
});



module.exports = router;
