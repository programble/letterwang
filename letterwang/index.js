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
    waitingPlayer;

function pairPlayers(player1, player2) {
  player1.opponent = player2;
  player2.opponent = player1;
  player1.socket.emit('opponent id', player2.id);
  player2.socket.emit('opponent id', player1.id);
}

io.sockets.on('connection', function(socket) {
  var player = {socket: socket, id: nextId.toString(36)};
  nextId++;
  players[player.id] = player;
  socket.emit('id', player.id);

  socket.on('play', function() {
    if (waitingPlayer) {
      pairPlayers(player, waitingPlayer);
      waitingPlayer = null;
    } else {
      waitingPlayer = player;
    }
  });

  socket.on('play id', function(id, fn) {
    var opponent = players[id];

    if (opponent == player) {
      if (fn) fn('You cannot play yourself');
    } else if (opponent) {
      pairPlayers(player, opponent);
    } else {
      if (fn) fn('Player not found');
    }
  });

  socket.on('disconnect', function() {
    if (waitingPlayer == player)
      waitingPlayer = null;
    // TODO: Handle leaving a game
  });
});

module.exports = server;
