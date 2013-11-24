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

  socket.on('play', function(fn) {
    if (player.opponent) {
      if (fn) fn('You already have an opponent');
    } else if (waitingPlayer == player) {
      if (fn) fn('You are already waiting for a player');
    } else if (waitingPlayer) {
      pairPlayers(player, waitingPlayer);
      waitingPlayer = null;
    } else {
      waitingPlayer = player;
    }
  });

  socket.on('play cancel', function(fn) {
    if (waitingPlayer == player) {
      waitingPlayer = null;
    } else {
      if (fn) fn('You are not waiting to play');
    }
  });

  socket.on('play id', function(id, fn) {
    var opponent = players[id];
    if (player.opponent) {
      if (fn) fn('You already have an opponent');
    } else if (opponent == player) {
      if (fn) fn('You cannot play yourself');
    } else if (opponent && opponent.opponent) {
      if (fn) fn('Player already has an opponent');
    } else if (opponent) {
      pairPlayers(player, opponent);
    } else {
      if (fn) fn('Player not found');
    }
  });

  socket.on('disconnect', function() {
    if (waitingPlayer == player)
      waitingPlayer = null;
    if (player.opponent) {
      player.opponent.socket.emit('opponent left');
      player.opponent.opponent = null;
    }
  });
});

module.exports = server;
