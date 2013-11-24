function showTab(id) {
  return $('<a href="#' + id + '">').tab('show');
}

function showWait(message, link) {
  $('#wait-message').text(message);
  $('#wait-link').toggleClass('hidden', !link);
  $('#wait-link a').attr('href', link).text(link);
  return showTab('wait');
}

function showError(message) {
  $('#error-message').text(message);
  return showTab('error');
}

var socket,
    playerId;

$(function() {
  socket = io.connect();

  socket.on('id', function(id) {
    playerId = id;
    console.log('Player ID ' + id);
    if (window.location.hash.slice(1)) {
      var friendId = window.location.hash.slice(1);
      socket.emit('play id', friendId, function(err) {
        showError(err);
      });
      showWait('Waiting for player...');
      window.location.hash = '';
    } else {
      showTab('main');
    }
  });

  $('#play-anyone').click(function() {
    socket.emit('play');
    showWait('Waiting for player...');
  });

  $('#play-friend').click(function() {
    var friendUrl = window.location.href.split('#')[0] + '#' + playerId;
    showWait('Waiting for player...', friendUrl);
  });

  socket.on('opponent id', function(id) {
    console.log('Opponent ID ' + id);
    showWait('Player found: ' + id); // TODO: Start game
  });
});
