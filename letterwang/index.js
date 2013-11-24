var path    = require('path'),
    express = require('express'),
    app     = express(),
    server  = require('http').createServer(app),
    io      = require('socket.io').listen(server);

app.use(express.logger());
app.use(express.static(path.normalize(__dirname + '/../public')));
app.get('/', function(req, res) {
  res.sendfile(path.normalize(__dirname + '/../public/index.html'));
});

var nextId = 10000000,
    players = {},
    randomPool = [];

function pairPlayers(player1, player2) {
  player1.opponent = player2;
  player2.opponent = player1;
  player1.emit('opponent', player2.id);
  player2.emit('opponent', player1.id);
}

io.sockets.on('connection', function(player) {
  player.id = nextId.toString(36);
  nextId++;
  players[id] = player;

  player.on('play random', function() {
    if (randomPool.length) {
      pairPlayers(player, randomPool.shift());
    } else {
      randomPool.push(player);
    }
  });

  player.on('play id', function(id, fn) {
    if (opponent = players[id]) {
      pairPlayers(player, opponent);
    } else {
      fn('Player not found');
    }
  });
});

module.exports = server;
