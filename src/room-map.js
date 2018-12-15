'use strict'

const RoomPlayer = require('./room-player')
const RoomItem = require('./room-item')
const RespawnPositionFinder = require('./respawn-position-finder')

const Directions = require('./directions')
const Items = require('./items')

const { get, cloneDeep } = require('lodash')

class RoomMap {
  constructor (gameMap) {
    this.gameMap = gameMap
    this.respawnPositionFinder = new RespawnPositionFinder(this)
    this.coordinateMatrix = this.gameMap.getMatrix().map(line => line.map(() => null))
  }

  iterateMap ({ x, y, direction }, fn) {
    if (!Directions.exists(direction)) {
      throw new Error(`Unknown direction ${direction}`)
    }

    let coord = { x, y }
    while (true) {
      coord = Directions.calculateMovement(direction, coord)
      if (!this.gameMap.coordinateExists(coord)) {
        break
      }

      const returnValue = fn(coord)
      if (returnValue === false) {
        break
      }
    }
  }

  getVisionOfPlayer (roomPlayer) {
    const matrix = cloneDeep(this.gameMap.getMatrix())
    matrix[roomPlayer.y][roomPlayer.x] = `me:${Directions.symbolOf(roomPlayer.direction)}`

    this.iterateMap(roomPlayer, coord => {
      const enemy = this.getPlayerAtCoordinate(coord)
      if (enemy) {
        matrix[coord.y][coord.x] = `enemy:${Directions.symbolOf(enemy.direction)}`
        return
      }

      const item = this.getItemAtCoordinate(coord)
      if (item) {
        matrix[coord.y][coord.x] = `item:${Items.symbolOf(item.type)}`
        return
      }

      // Player can't see behind walls
      if (this.gameMap.isWall(coord)) {
        return false // stop the iteration
      }
    })

    return matrix
  }

  getPlayersOnPath ({ x, y, direction }) {
    const players = []
    let distance = 1

    this.iterateMap({ x, y, direction }, coord => {
      const player = this.getPlayerAtCoordinate(coord)
      if (player) {
        players.push({ player, distance })
      }

      // Stop the search when we find a wall
      if (this.gameMap.isWall(coord)) {
        return false // stop the iteration
      }

      distance++
    })

    return players
  }

  addRandomItemToCoordinate ({ x, y }) {
    const itemType = Items.getRandom()
    return this.addItemToCoordinate(itemType, { x, y })
  }

  addItemToCoordinate (itemType, { x, y }) {
    const roomItem = new RoomItem(itemType)
    this.setCoordinate({ x, y }, roomItem)
    return roomItem
  }

  removePlayerFromMap (roomPlayer) {
    const { x, y } = roomPlayer

    if (x !== null && y !== null) {
      this.setCoordinate({ x, y }, null)
      roomPlayer.x = roomPlayer.y = null
    }

    return { x, y }
  }

  movePlayerToCoordinate (roomPlayer, coord) {
    let success = false
    let item = null

    if (this.getPlayerAtCoordinate(coord) === roomPlayer) {
      success = true
    } else if (this.gameMap.coordinateExists(coord) && !this.gameMap.isWall(coord) &&
      !this.hasPlayerAtCoordinate(coord)) {
      item = this.getItemAtCoordinate(coord)
      item = item ? item.type : null

      this.removePlayerFromMap(roomPlayer)

      this.coordinateMatrix[coord.y][coord.x] = roomPlayer
      roomPlayer.x = coord.x
      roomPlayer.y = coord.y

      success = true
    }

    return { success, item }
  }

  getCoordinate ({ x, y }) {
    return get(this.coordinateMatrix, `${y}.${x}`, null)
  }

  setCoordinate ({ x, y }, value) {
    if (this.gameMap.coordinateExists({ x, y })) {
      this.coordinateMatrix[y][x] = value
      return true
    }

    return false
  }

  getPlayerAtCoordinate ({ x, y }) {
    const player = this.getCoordinate({ x, y })
    return player instanceof RoomPlayer ? player : null
  }

  hasPlayerAtCoordinate ({ x, y }) {
    return Boolean(this.getPlayerAtCoordinate({ x, y }))
  }

  getItemAtCoordinate ({ x, y }) {
    const item = this.getCoordinate({ x, y })
    return item instanceof RoomItem ? item : null
  }

  hasItemAtCoordinate ({ x, y }) {
    return Boolean(this.getItemAtCoordinate({ x, y }))
  }
}

module.exports = RoomMap
