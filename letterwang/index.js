var path    = require('path'),
    express = require('express'),
    app     = express(),
    server  = require('http').createServer(app),
    io      = require('socket.io').listen(server);

app.configure('production', function() {
  app.use(express.logger());
});

app.use(express.static(path.normalize(__dirname + '/../public')));
app.get('/', function(req, res) {
  res.sendfile(path.normalize(__dirname + '/../public/index.html'));
});

io.configure('production', function() {
  io.enable('browser client minification');
  io.enable('browser client etag');
  io.enable('browser client gzip');

  io.set('log level', 1);
});

function Player(socket) {
  this.socket = socket;
  this.id = Player.nextId.toString(36);
  Player.nextId++;
  Player.players[this.id] = this;
  Player.emitCount();
  socket.emit('id', this.id);
}

Player.nextId = 10000000;
Player.players = {};

Player.emitCount = function() {
  io.sockets.emit('players', Object.keys(Player.players).length);
}

Player.prototype.remove = function() {
  delete Player.players[this.id];
  Player.emitCount();
}

Player.prototype.pair = function(other) {
  this.opponent = other;
  other.opponent = this;
  this.socket.emit('opponent id', other.id);
  other.socket.emit('opponent id', this.id);
}

io.sockets.on('connection', function(socket) {
  var player = new Player(socket);

  socket.on('play', function(fn) {
    if (player.opponent) {
      if (fn) fn('You already have an opponent');
    } else if (Player.waiting == player) {
      if (fn) fn('You are already waiting for a player');
    } else if (Player.waiting) {
      player.pair(Player.waiting);
      Player.waiting = null;
    } else {
      Player.waiting = player;
    }
  });

  socket.on('play friend', function(fn) {
    if (player.opponent) {
      if (fn) fn('You already have an opponent');
    } else if (Player.waiting == player) {
      if (fn) fn('You are already waiting for a player');
    } else {
      player.waitingForFriend = true;
    }
  });

  socket.on('play cancel', function(fn) {
    if (Player.waiting == player) {
      Player.waiting = null;
    } else if (player.waitingForFriend) {
      player.waitingForFriend = false;
    } else {
      if (fn) fn('You are not waiting to play');
    }
  });

  socket.on('play id', function(id, fn) {
    var opponent = Player.players[id];
    if (player.opponent) {
      if (fn) fn('You already have an opponent');
    } else if (opponent == player) {
      if (fn) fn('You cannot play yourself');
    } else if (opponent && opponent.opponent) {
      if (fn) fn('Player already has an opponent');
    } else if (opponent && opponent.waitingForFriend) {
      player.waitingForFriend = false;
      player.pair(opponent);
    } else if (opponent) {
      if (fn) fn('Player is not waiting for a friend');
    } else {
      if (fn) fn('Player not found');
    }
  });

  socket.on('disconnect', function() {
    if (Player.waiting == player)
      Player.waiting = null;
    if (player.opponent) {
      player.opponent.socket.emit('opponent left');
      player.opponent.opponent = null;
    }
    player.remove();
  });
});

module.exports = server;
