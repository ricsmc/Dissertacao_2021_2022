var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var jwt = require('jsonwebtoken');

var indexRouter = require('./routes/index');
var classRouter = require('./routes/classes');
var entidadeRouter = require('./routes/entidades');
var indicadorRouter = require('./routes/indicadores');
var legislacaoRouter = require('./routes/legislacao');
var notasApRouter = require('./routes/notas_aplicacao');
var termosIndiceRouter = require('./routes/termos_indice');
var tipologiasRouter = require('./routes/tipologias');


var app = express();


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use(function(req,res,next){
  var myToken = req.headers.authorization || req.body.token;
  jwt.verify(myToken, 'CLAV', function(e){
    if(e) {
      res.status(401).jsonp({error:'TOKEN VERIFICATION ERROR (ACCESS DENIED): ' + e})
    }
    else {
      next()
    }
  })
})

app.use('/', indexRouter);
app.use('/classes', classRouter);
app.use('/entidades', entidadeRouter);
app.use('/indicadores', indicadorRouter);
app.use('/legislacao', legislacaoRouter);
app.use('/notasAp', notasApRouter);
app.use('/termosIndice', termosIndiceRouter);
app.use('/tipologias', tipologiasRouter);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500).jsonp(err);
});

module.exports = app;
