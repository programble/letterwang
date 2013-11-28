var path    = require('path'),
    express = require('express'),
    app     = express(),
    server  = require('http').createServer(app),
    io      = require('socket.io').listen(server);

if (app.get('env') != 'production') {
  app.use(express.logger());

  app.get('/css/letterwang.min.css', function(req, res) {
    res.redirect('/css/letterwang.css');
  });
  app.get('/js/letterwang.min.js', function(req, res) {
    res.redirect('/js/letterwang.js');
  });
}

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

function safe(fn) {
  return function() {
    if (typeof fn == 'function')
      fn.apply(this, arguments);
  }
}

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

Player.prototype = {
  remove: function() {
    if (Player.waiting == this)
      Player.waiting = null;
    if (this.opponent) {
      this.opponent.socket.emit('opponent left');
      this.opponent.opponent = null;
    }
    delete Player.players[this.id];
    Player.emitCount();
  },

  play: function(fn) {
    if (this.opponent) {
      fn('You already have an opponent');
    } else if (Player.waiting && Player.waiting != this) {
      this.pair(Player.waiting);
      Player.waiting = null;
    } else {
      Player.waiting = this;
    }
  },

  playFriend: function(fn) {
    if (this.opponent)
      fn('You already have an opponent');
    else if (Player.waiting == this)
      fn('You are already waiting for a player');
    else
      this.waitingForFriend = true;
  },

  playCancel: function(fn) {
    if (Player.waiting == this)
      Player.waiting = null;
    else if (this.waitingForFriend)
      this.waitingForFriend = false;
    else
      fn('You are not waiting to play');
  },

  playId: function(id, fn) {
    var other = Player.players[id];
    if (this.opponent) {
      fn('You already have an opponent');
    } else if (other == this) {
      fn('You cannot play yourself');
    } else if (other && other.opponent) {
      fn('Player already has an opponent');
    } else if (other && other.waitingForFriend) {
      other.waitingForFriend = false;
      this.pair(other);
    } else if (other) {
      fn('Player is not waiting for a friend');
    } else {
      fn('Player not found');
    }
  },

  pair: function(other) {
    this.opponent = other;
    other.opponent = this;
    this.socket.emit('opponent id', other.id);
    other.socket.emit('opponent id', this.id);

    this.letters = other.letters = [];
    this.emitLetters();

    this.score = 0;
    other.score = 0;
    this.emitScore();
    other.emitScore();

    this.turn = true;
    other.turn = false;
    this.socket.emit('turn');
  },

  emitLetters: function() {
    this.socket.emit('letters', this.letters);
    this.opponent.socket.emit('letters', this.letters);
  },

  emitScore: function(word) {
    this.socket.emit('score', this.score, word);
    this.opponent.socket.emit('score', this.score, word);
  },

  type: function(letter, fn) {
    if (!this.opponent)
      fn('You are not playing');
    else if (!this.turn)
      fn('It is not your turn');
    else if (typeof letter != 'string' || letter.length != 1 ||
             letter < 'a' || letter > 'z')
      fn('Invalid letter');
    else {
      this.letters.push(letter);
      this.letters = this.opponent.letters = this.letters.slice(-50);
      this.emitLetters();

      // TODO: Check for scoring

      this.turn = false;
      this.opponent.turn = true;
      this.opponent.socket.emit('turn');
    }
  }
}

io.sockets.on('connection', function(socket) {
  var player = new Player(socket);
  socket.on('play',        function(fn)     { player.play(safe(fn)); });
  socket.on('play friend', function(fn)     { player.playFriend(safe(fn)); });
  socket.on('play cancel', function(fn)     { player.playCancel(safe(fn)); });
  socket.on('play id',     function(id, fn) { player.playId(id, safe(fn)); });
  socket.on('type',        function(l, fn)  { player.type(l, safe(fn)); });
  socket.on('disconnect',  function()       { player.remove(); });
});

module.exports = server;
