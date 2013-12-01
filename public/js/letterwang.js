var waitTimeout;

function showTab(id) {
  clearTimeout(waitTimeout);
  return $('<a href="#' + id + '">').tab('show');
}

function showWait(message, cancel, link) {
  waitTimeout = setTimeout(function() {
    $('#wait-message').text(message);
    $('#wait-cancel').toggleClass('hidden', !cancel);
    $('#wait-link').toggleClass('hidden', !link);
    $('#wait-link a').attr('href', link).text(link);
    showTab('wait');
  }, 20);
}

function showError(message) {
  $('#error-message').text(message);
  return showTab('error');
}

var socket, playerId;

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
      $('#opponent-words').prepend($('<ul>').text(word))
    else
      $('#opponent-words').empty();
  });

  socket.on('letters', function(letters) {
    var $letters = $('#letters').toggleClass('invisible', !letters.length);
    if (letters.length) $letters.text(letters);
  });

  socket.on('turn', function() {
    console.log('turn');
  });

  $(document).keypress(function(e) {
    var letter = String.fromCharCode(e.charCode);
    if (letter && letter >= 'a' && letter <= 'z') {
      socket.emit('type', letter, function(err) {
        throw err;
      });
      return false;
    }
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
