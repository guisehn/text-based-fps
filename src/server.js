'use strict'

const PORT = process.env.PORT || 3000

const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

const ServerState = require('./server-state')
const state = new ServerState(io)

app.use(express.static(`${__dirname}/client`))

io.on('connection', socket => {
  const sessionId = socket.handshake.query.fps_sid

  let player = state.getPlayerBySessionId(sessionId)
  if (player) {
    player.setSocket(socket)
  } else {
    player = state.addPlayer(socket)
    socket.emit('sessionId', player.sessionId)
  }

  const commands = {
    'set-name': playerName => state.renamePlayer(player, playerName),
    'join-room': roomName => state.joinRoom(player, roomName),
    'move': direction => state.movePlayer(player, direction),
    'turn': direction => state.turnPlayer(player, direction),
    'look': () => state.playerVision(player),
    'health': () => state.playerHealth(player),
    'ammo': () => state.playerAmmo(player),
    'respawn': () => state.respawnPlayer(player),
    'fire': () => state.fire(player),
    'reload': () => state.reloadGun(player),
    'score': () => state.scoreTable(player),
    'leave-room': () => state.leaveRoom(player, true),
    'room-list': () => state.roomList(player)
  }

  socket.on('command', message => {
    const parts = message.trim().split(' ')
    const command = parts[0]
    const argument = parts.slice(1).join(' ')

    player.touch()

    if (commands[command]) {
      commands[command](argument)
    } else {
      socket.emit('message', { type: 'error', content: 'Command not found' })
    }
  })
})

http.listen(PORT, () => console.log(`Listenin on *:${PORT}`))
