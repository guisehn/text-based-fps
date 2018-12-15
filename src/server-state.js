'use strict'

const Player = require('./player')
const Room = require('./room')
const RoomsTable = require('./rooms-table')
const GameMap = require('./game-map')
const Items = require('./items')
const InactivePlayerRemover = require('./inactive-player-remover')

const { requireRoom } = require('./utils')
const { find, remove } = require('lodash')

// Load map
const fs = require('fs')
const gameMap = new GameMap(fs.readFileSync('map.txt').toString())

class ServerState {
  constructor (io) {
    this.io = io
    this.players = []
    this.rooms = []

    new InactivePlayerRemover(this).start()
  }

  getPlayerBySessionId (sessionId) {
    return find(this.players, p => p.sessionId === sessionId)
  }

  addPlayer (socket) {
    const player = new Player(socket)
    this.players.push(player)
    return player
  }

  removePlayer (player) {
    this.leaveRoom(player)
    player.disconnect()
    return remove(this.players, p => p === player)
  }

  renamePlayer (player, newName) {
    newName = newName.trim()

    const existent = find(this.players, p => p.name === newName)
    if (existent && existent !== player) {
      player.socket.emit('message', {
        type: 'error',
        content: 'This name is already in use'
      })
      return
    }

    const previousName = player.name
    const [success, errorMessage] = player.setName(newName)

    if (success) {
      let message = `Your name is now ${newName}.`

      if (player.room) {
        player.emitToRoom(player.room, 'message', {
          content: `${previousName} changed their name to ${player.name}`
        })
      } else {
        message += ` Now, type ||join-room <room name>|| to join a room.`
      }

      player.name = newName
      player.socket.emit('message', { content: message })
    } else {
      player.socket.emit('message', {
        type: 'error',
        content: errorMessage
      })
    }
  }

  movePlayer (player, direction) {
    requireRoom(player, () => {
      const { success, item } = player.room.movePlayer(player, direction)

      if (success) {
        if (item) {
          player.socket.emit('message', { content: Items.equipMessageOf(item) })
        }
      } else {
        player.socket.emit('message', { content: `You can't go in that direction.` })
      }
    })
  }

  turnPlayer (player, direction) {
    requireRoom(player, () => {
      if (!player.room.turnPlayer(player, direction)) {
        player.socket.emit('message', {
          content: `Unknown direction. Use ||<north/south/west/east/around>||`
        })
      }
    })
  }

  respawnPlayer (player) {
    requireRoom(player, () => {
      const respawned = player.room.respawnPlayer(player)
      if (respawned) {
        player.socket.emit('message', { content: `You're back in the game!` })
      } else {
        player.socket.emit('message', { type: 'error', content: `You are already alive.` })
      }
    })
  }

  joinRoom (player, roomName) {
    if (!player.name) {
      player.socket.emit('message', {
        type: 'error',
        content: `You need to have a name before joining a room. Type ||set-name <name>|| to set your name.`
      })
      return
    }

    if (player.room && player.room.name === roomName) {
      player.socket.emit('message', {
        type: 'error',
        content: 'You are already in this room.'
      })
      return
    }

    this.leaveRoom(player)

    let room = find(this.rooms, r => r.name === roomName)
    if (!room) {
      const [isValid, errorMessage] = Room.validateName(roomName)
      if (!isValid) {
        player.socket.emit('message', { type: 'error', content: errorMessage })
        return
      }

      room = new Room(this.io, roomName, gameMap)
      this.rooms.push(room)
    }

    room.addPlayer(player)
    player.socket.emit('message', {
      content: `You're now on ${room.name}! Type ||look|| to see where you are in the map.`
    })
  }

  leaveRoom (player, isVoluntary) {
    if (player.room) {
      const room = player.room

      room.removePlayer(player)
      player.room = null

      if (!room.hasPlayers) {
        remove(this.rooms, r => r === room)
      }

      room.emit('message', { content: `${player.name} left the room` })

      if (isVoluntary) {
        player.socket.emit('message', { content: 'You left the room.' })
      }
    }
  }

  playerVision (player) {
    requireRoom(player, () => {
      const { vision, isDead } = player.room.getVisionOfPlayer(player)
      if (vision) {
        player.socket.emit('message', { type: 'vision', content: vision })
      } else if (isDead) {
        player.socket.emit('message', { content: `You're dead. Type ||respawn|| to return to the game.` })
      }
    })
  }

  playerHealth (player) {
    requireRoom(player, () => {
      const health = player.room.getPlayerHealth(player)
      player.socket.emit('message', { content: `Health: ${health}%` })
    })
  }

  playerAmmo (player) {
    requireRoom(player, () => {
      const { loadedAmmo, unloadedAmmo } = player.room.getPlayerAmmo(player)
      player.socket.emit('message', { content: `Ammo: ${loadedAmmo}/${unloadedAmmo}` })
    })
  }

  reloadGun (player) {
    requireRoom(player, () => {
      const { reloaded, loadedAmmo, unloadedAmmo } = player.room.reloadGunOfPlayer(player)

      if (reloaded) {
        player.socket.emit('message', {
          content: `You've reloaded. Ammo: ${loadedAmmo}/${unloadedAmmo}`
        })
      } else if (unloadedAmmo === 0) {
        player.socket.emit('message', { content: `You're out of ammo` })
      }
    })
  }

  fire (player) {
    requireRoom(player, () => {
      const { hit, killed, ammo } = player.room.fireGunOfPlayer(player)
      let message

      if (hit.length || killed.length) {
        message = `You've `

        if (hit.length) {
          message += `hit ` + hit.map(p => p.player.name).join(', ')

          if (killed.length) {
            message += ` and `
          }
        }

        if (killed.length) {
          message += `killed ` + killed.map(p => p.player.name).join(', ')
        }
      } else if (ammo === 'reload_needed') {
        message = 'Reload your gun by typing ||reload||'
      } else if (ammo === 'empty') {
        message = `You're out of ammo!`
      } else {
        message = `You've shot the wall.`
      }

      player.socket.emit('message', { content: message })
    })
  }

  scoreTable (player) {
    requireRoom(player, () => {
      const scoreTable = player.room.getScoreTable()
      console.log(scoreTable)
      player.socket.emit('message', { content: scoreTable })
    })
  }

  roomList (player) {
    if (this.rooms.length > 0) {
      const roomsTable = RoomsTable.generate(this.rooms)
      player.socket.emit('message', { content: roomsTable })
    } else {
      player.socket.emit('message', { content: 'There are no rooms. Create your own room by typing ||join-room <room name>||' })
    }
  }
}

module.exports = ServerState
