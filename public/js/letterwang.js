var socket;

$(function() {
  socket = io.connect();

  socket.on('id', function(id) {
    console.log('Player ID ' + id);
  });

  socket.on('opponent id', function(id) {
    console.log('Opponent ID ' + id);
  });
});
