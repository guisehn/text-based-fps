'use strict'

const constants = require('./constants')

const { find, pick, remove } = require('lodash')
const Items = require('./items')
const Directions = require('./directions')
const ScoreTable = require('./score-table')

const RoomPlayer = require('./room-player')
const RoomMap = require('./room-map')

class Room {
  constructor (io, name, gameMap) {
    this.io = io
    this.name = name
    this.roomPlayers = []
    this.roomMap = new RoomMap(gameMap)
  }

  static validateName (name) {
    if (name === '') {
      return [false, 'Room name cannot be empty']
    }

    const { NAME_MAX_LENGTH: maxLength } = constants
    if (name.length > maxLength) {
      return [false, `Room name cannot exceed ${maxLength} characters`]
    }

    return [true]
  }

  get hasPlayers () {
    return this.roomPlayers.length > 0
  }

  addPlayer (player) {
    this.roomPlayers.push(new RoomPlayer(player))

    player.room = this
    this.respawnPlayer(player)

    player.socket.join(this.name)
    player.emitToRoom(this, 'message', { content: `${player.name} joined the room!` })
  }

  removePlayer (player) {
    const roomPlayer = this.getRoomPlayer(player)
    if (roomPlayer) {
      player.socket.leave(this.name)
      remove(this.roomPlayers, r => r === roomPlayer)
      this.emit(`${player.name} left the room`)
    }
  }

  respawnPlayer (player) {
    const roomPlayer = this.getRoomPlayer(player)

    if (roomPlayer && roomPlayer.isDead()) {
      const { x, y, direction } = this.roomMap.respawnPositionFinder.findRespawnPosition(true)
      this.roomMap.movePlayerToCoordinate(roomPlayer, { x, y })
      roomPlayer.direction = direction
      roomPlayer.health = constants.MAX_HEALTH
      roomPlayer.loadedAmmo = constants.MAX_LOADED_AMMO
      roomPlayer.unloadedAmmo = constants.MAX_UNLOADED_AMMO
      return true
    }

    return false
  }

  turnPlayer (player, direction) {
    const roomPlayer = this.getRoomPlayer(player)
    return roomPlayer.turn(direction)
  }

  movePlayer (player, direction) {
    const roomPlayer = this.getRoomPlayer(player)

    if (direction.trim() === '') {
      direction = roomPlayer.direction
    }

    if (!Directions.exists(direction)) {
      return { success: false }
    }

    const coord = Directions.calculateMovement(direction, roomPlayer)
    const { success, item } = this.roomMap.movePlayerToCoordinate(roomPlayer, coord)

    if (item) {
      Items.equip(item, roomPlayer)
    }

    return { success, item }
  }

  getVisionOfPlayer (player) {
    const roomPlayer = this.getRoomPlayer(player)
    if (roomPlayer.isDead()) {
      return { vision: null, isDead: true }
    }

    const vision = this.roomMap.getVisionOfPlayer(roomPlayer)
    return { vision }
  }

  getPlayerHealth (player) {
    const roomPlayer = this.getRoomPlayer(player)
    return roomPlayer.health
  }

  getPlayerAmmo (player) {
    const roomPlayer = this.getRoomPlayer(player)
    return pick(roomPlayer, ['loadedAmmo', 'unloadedAmmo'])
  }

  reloadGunOfPlayer (player) {
    const roomPlayer = this.getRoomPlayer(player)
    return roomPlayer.reloadGun()
  }

  fireGunOfPlayer (player) {
    const roomPlayer = this.getRoomPlayer(player)
    const result = { hit: [], killed: [], ammo: null }

    if (roomPlayer.loadedAmmo > 0) {
      roomPlayer.loadedAmmo--

      const playerPosition = pick(roomPlayer, ['x', 'y', 'direction'])
      const playersOnPath = this.roomMap.getPlayersOnPath(playerPosition)

      for (let n = 0; n < playersOnPath.length; n++) {
        const { player: shootedPlayer, distance } = playersOnPath[n]
        const shootPower = 30 - (distance - 1) - (n * 10)

        const { killed } = this.shoot({
          shooterPlayer: roomPlayer,
          shootedPlayer: shootedPlayer,
          shootPower: shootPower
        })

        if (killed) {
          result.killed.push(shootedPlayer)
        } else {
          result.hit.push(shootedPlayer)
        }
      }
    }

    if (roomPlayer.loadedAmmo === 0) {
      result.ammo = 'reload_needed'

      if (roomPlayer.unloadedAmmo === 0) {
        result.ammo = 'empty'
      }
    }

    return result
  }

  shoot ({ shootedPlayer, shooterPlayer, shootPower }) {
    let killed

    shootPower = Math.max(shootPower, 0)
    shootedPlayer.health = Math.max(shootedPlayer.health - shootPower, 0)

    if (shootedPlayer.health > 0) {
      shootedPlayer.player.socket.emit('message', {
        type: 'shot',
        content: `uh oh! ${shooterPlayer.player.name} shot you!`
      })

      killed = false
    } else {
      killed = true
      shooterPlayer.kills++
      shootedPlayer.killed++

      const { x, y } = shootedPlayer
      this.roomMap.removePlayerFromMap(shootedPlayer)
      this.roomMap.addRandomItemToCoordinate({ x, y })

      shootedPlayer.player.socket.emit(`message`, {
        type: 'shot',
        content: `${shooterPlayer.player.name} killed you! Type ||respawn|| to return to the game`
      })
    }

    return { killed }
  }

  getScoreTable () {
    return ScoreTable.generate(this.roomPlayers)
  }

  getRoomPlayer (player) {
    return find(this.roomPlayers, roomPlayer => roomPlayer.player === player)
  }

  emit () {
    this.io.to(this.name).emit(...arguments)
  }
}

module.exports = Room
