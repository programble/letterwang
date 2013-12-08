var fs    = require('fs'),
    path  = require('path'),
    words = fs.readFileSync(path.join(__dirname, '..', 'data', 'words'),
                            {encoding: 'utf8'}).trim().split('\n');

function safe(fn) {
  return function() {
    if (typeof fn == 'function')
      fn.apply(this, arguments);
  };
}

module.exports = function(io) {
  function Player(socket) {
    this.socket = socket;

    var id = Player.nextId;
    Player.nextId++;

    this.id = (id + 9999999).toString(36);
    Player.players[this.id] = this;
    Player.emitCount();
    socket.emit('id', this.id);

    this.name = Player.nextName[0] + ' ' + id;
    Player.nextName.push(Player.nextName.shift());
    socket.emit('name', this.name);

    var $this = this;
    socket.on('name',        function(n, fn)  { $this.rename(n, safe(fn));  });
    socket.on('play',        function(fn)     { $this.play(safe(fn));       });
    socket.on('play friend', function(fn)     { $this.playFriend(safe(fn)); });
    socket.on('play cancel', function(fn)     { $this.playCancel(safe(fn)); });
    socket.on('play id',     function(id, fn) { $this.playId(id, safe(fn)); });
    socket.on('type',        function(l, fn)  { $this.type(l, safe(fn));    });
    socket.on('leave',       function(fn)     { $this.leave(safe(fn));      });
    socket.on('disconnect',  function()       { $this.remove();             });
  }

  Player.players = {};
  Player.nextId = 1;
  Player.nextName = ['Julie', 'Simon'];

  Player.emitCount = function() {
    io.sockets.emit('players', Object.keys(Player.players).length);
  };

  Player.prototype = {
    rename: function(name, fn) {
      this.name = name;
      if (this.opponent)
        this.opponent.socket.emit('opponent name', name);
    },

    play: function(fn) {
      var err;
      if (this.opponent) {
        err = 'You already have an opponent';
      } else if (Player.waiting && Player.waiting != this) {
        this.pair(Player.waiting);
        Player.waiting = null;
      } else {
        Player.waiting = this;
      }
      fn(err);
    },

    playFriend: function(fn) {
      var err;
      if (this.opponent)
        err = 'You already have an opponent';
      else if (Player.waiting == this)
        err = 'You are already waiting for a player';
      else
        this.waitingForFriend = true;
      fn(err);
    },

    playCancel: function(fn) {
      var err;
      if (Player.waiting == this)
        Player.waiting = null;
      else if (this.waitingForFriend)
        this.waitingForFriend = false;
      else
        err = 'You are not waiting to play';
      fn(err);
    },

    playId: function(id, fn) {
      var other = Player.players[id],
          err;
      if (this.opponent) {
        err = 'You already have an opponent';
      } else if (other == this) {
        err = 'You cannot play yourself';
      } else if (other && other.opponent) {
        err = 'Player already has an opponent';
      } else if (other && other.waitingForFriend) {
        other.waitingForFriend = false;
        this.pair(other);
      } else if (other) {
        err = 'Player is not waiting for a friend';
      } else {
        err = 'Player not found';
      }
      fn(err);
    },

    pair: function(other) {
      this.opponent = other;
      other.opponent = this;
      this.socket.emit('opponent id', other.id);
      this.socket.emit('opponent name', other.name);
      other.socket.emit('opponent id', this.id);
      other.socket.emit('opponent name', this.name);

      this.letters = other.letters = '';
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
      this.opponent.socket.emit('opponent score', this.score, word);
    },

    type: function(letter, fn) {
      var err;
      if (!this.opponent)
        err = 'You are not playing';
      else if (!this.turn)
        err = 'It is not your turn';
      else if (typeof letter != 'string' || letter.length != 1 ||
               letter < 'a' || letter > 'z')
        err = 'Invalid letter';
      else {
        this.letters = (this.letters + letter).slice(-50);
        this.opponent.letters = this.letters;
        this.emitLetters();

        words.forEach(function(word) {
          var index = this.letters.lastIndexOf(word);
          if (index != -1 && index == this.letters.length - word.length) {
            this.score += word.length - 2;
            this.emitScore(word);
          }
        }, this);

        this.turn = false;
        this.opponent.turn = true;
        this.opponent.socket.emit('turn');
      }
      fn(err);
    },

    leave: function(fn) {
      if (!this.opponent) {
        fn('You are not playing');
      } else {
        this.opponent.socket.emit('opponent left');
        this.opponent.opponent = null;
        this.opponent = null;
        fn();
      }
    },

    remove: function() {
      if (Player.waiting == this)
        Player.waiting = null;
      if (this.opponent)
        this.leave(safe());
      delete Player.players[this.id];
      Player.emitCount();
    }
  };

  return Player;
};
