'use strict'

function requireRoom (player, callback) {
  if (player.room) {
    callback()
  } else {
    player.socket.emit('message', {
      type: 'error',
      content: `You need to be in a room to use this command. Type ||join-room <room_name>|| to join a room.`
    })
  }
}

module.exports = {
  requireRoom
}
