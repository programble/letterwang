var path    = require('path'),
    express = require('express'),
    app     = express(),
    server  = require('http').createServer(app),
    io      = require('socket.io').listen(server),
    Player  = require('./player')(io);

if (app.get('env') != 'production') {
  app.use(express.logger());

  app.get('/css/letterwang.min.css', function(req, res) {
    res.sendfile(path.join(__dirname, '..', 'public', 'css', 'letterwang.css'));
  });
  app.get('/js/letterwang.min.js', function(req, res) {
    res.sendfile(path.join(__dirname, '..', 'public', 'js', 'letterwang.js'));
  });
} else {
  app.use(express.compress());
}

app.use(express.static(path.join(__dirname, '..', 'public')));

io.configure('production', function() {
  io.enable('browser client minification');
  io.enable('browser client etag');
  io.enable('browser client gzip');

  io.set('log level', 1);
});

io.sockets.on('connection', function(socket) { new Player(socket); });

module.exports = server;
