var waitTimeout;

function setTitle(title) {
  if (title)
    document.title = title;
  else
    document.title = 'Letterwang!';
}

function showTab(id) {
  clearTimeout(waitTimeout);
  setTitle();
  return $('<a href="#' + id + '">').tab('show');
}

function showWait(message, cancel, link) {
  waitTimeout = setTimeout(function() {
    $('#wait-message').text(message);
    $('#wait-cancel').toggleClass('hidden', !cancel);
    $('#wait-link').toggleClass('hidden', !link);
    $('#wait-link a').attr('href', link).text(link);
    showTab('wait');
  }, 100);
}

function showError(message) {
  if (message) {
    $('#error-message').text(message);
    return showTab('error');
  }
}

var socket, playerId, turn;

$(function() {
  socket = io.connect();

  socket.on('players', function(count) {
    $('#player-count').addClass('in');
    $('#players').text(count);
    $('#playerss').text(count == 1 ? '' : 's');
  });

  socket.on('id', function(id) {
    playerId = id;
    if (window.location.hash.slice(1)) {
      var friendId = window.location.hash.slice(1);
      socket.emit('play id', friendId, showError);
      showWait('Waiting for player...');
      window.location.hash = '';
    } else {
      showTab('menu');
    }
  });

  $('#play-anyone').click(function() {
    socket.emit('play', showError);
    showWait('Waiting for player...', true);
  });

  $('#play-friend').click(function() {
    socket.emit('play friend', showError);
    var friendUrl = window.location.href.split('#')[0] + '#' + playerId;
    showWait('Waiting for player...', true, friendUrl);
  });

  $('#wait-cancel').click(function() {
    socket.emit('play cancel', showError);
    showTab('menu');
  });

  socket.on('opponent id', function(id) {
    showTab('game');
  });

  socket.on('score', function(score, word) {
    $('#player-score').text(score);
    if (word)
      $('#player-words').prepend($('<ul>').text(word));
    else
      $('#player-words').empty();
  });

  socket.on('opponent score', function(score, word) {
    $('#opponent-score').text(score);
    if (word)
      $('#opponent-words').prepend($('<ul>').text(word));
    else
      $('#opponent-words').empty();
  });

  socket.on('letters', function(letters) {
    var $letters = $('#letters').toggleClass('invisible', !letters.length);
    if (letters.length) $letters.text(letters);
  });

  socket.on('turn', function() {
    turn = true;
    setTitle('Letterwang! (Your turn)');
  });

  $(document).keypress(function(e) {
    if (!turn) return true;
    var letter = String.fromCharCode(e.charCode);
    if (letter && letter >= 'a' && letter <= 'z') {
      socket.emit('type', letter, function(err) {
        if (err)
          throw err; // TODO: Display error
        else {
          turn = false;
          setTitle();
        }
      });
      return false;
    }
  });

  $('#leave-confirm').click(function() {
    socket.emit('leave', function(err) {
      if (err)
        showError(err);
      else
        showTab('menu');
    });
  });

  socket.on('opponent left', function() {
    showError('Your opponent left the game');
  });

  $('#play-again').click(function() {
    showTab('menu');
  });

  socket.on('reconnecting', function() {
    showWait('Reconnecting...');
  });

  socket.on('connect_failed', function() {
    showError('Connection failed');
    $('#play-again').hide();
  });
});
