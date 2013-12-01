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
    showWait('Player found: ' + id); // TODO: Start game
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
