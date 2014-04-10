
/**
 * Module dependencies.
 */

var express = require('express')
, routes = require('./routes')
, http = require('http')
, path = require('path')
, compressor = require('node-minify')
, newrelic = require('newrelic')
, WebSocketServer = require('ws').Server;

var app = express();

new compressor.minify({
  // type: 'uglifyjs',
  type: 'no-compress',
  fileIn: 'assets/scripts/js/byodj.js',
  fileOut: 'public/js/byodj.min.js',
  callback: function(err){
    if(err) console.log("minify: " + err);
  }
});

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

wss = new WebSocketServer({
  server: server
});

require('./routes/index.js') (app, wss);


