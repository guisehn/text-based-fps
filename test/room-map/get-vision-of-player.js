'use strict'

const assert = require('chai').assert

const GameMap = require('../../src/game-map')
const RoomMap = require('../../src/room-map')
const RoomPlayer = require('../../src/room-player')
const Player = require('../../src/player')

describe('RoomMap', () => {
  describe('getVisionOfPlayer', () => {
    // Main player will be positioned on coordinate represented by N on the map
    // To each side of the player there will be:
    // 1. an enemy (another player)
    // 2. an item
    // 3. another enemy behind the wall
    const mapText = `
###########
#         #
#   ###   #
#   # #   #
# ### ### #
# #  N  # #
# ### ### #
#   # #   #
#   ###   #
#         #
###########
`.trim()

    const gameMap = new GameMap(mapText)
    const roomMap = new RoomMap(gameMap)
    const makeRoomPlayer = (coord, direction) => {
      const roomPlayer = new RoomPlayer(new Player())
      roomMap.movePlayerToCoordinate(roomPlayer, coord)
      roomPlayer.turn(direction)
      return roomPlayer
    }

    const mainPlayer = makeRoomPlayer({ x: 5, y: 5 }, 'north')

    // north
    makeRoomPlayer({ x: 5, y: 4 }, 'south')
    roomMap.addItemToCoordinate('ammo', { x: 5, y: 3 })
    makeRoomPlayer({ x: 5, y: 1 }, 'south')

    // south
    makeRoomPlayer({ x: 5, y: 6 }, 'north')
    roomMap.addItemToCoordinate('health', { x: 5, y: 7 })
    makeRoomPlayer({ x: 5, y: 9 }, 'north')

    // west
    makeRoomPlayer({ x: 4, y: 5 }, 'east')
    roomMap.addItemToCoordinate('ammo', { x: 3, y: 5 })
    makeRoomPlayer({ x: 1, y: 5 }, 'east')

    // east
    makeRoomPlayer({ x: 6, y: 5 }, 'west')
    roomMap.addItemToCoordinate('health', { x: 7, y: 5 })
    makeRoomPlayer({ x: 9, y: 5 }, 'west')

    it('should return the vision correctly when player is turned to north', () => {
      mainPlayer.turn('north')

      const vision = roomMap.getVisionOfPlayer(mainPlayer)

      const expectedVision = [
        ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#'],
        ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
        ['#', ' ', ' ', ' ', '#', '#', '#', ' ', ' ', ' ', '#'],
        ['#', ' ', ' ', ' ', '#', 'item:¶', '#', ' ', ' ', ' ', '#'],
        ['#', ' ', '#', '#', '#', 'enemy:▼', '#', '#', '#', ' ', '#'],
        ['#', ' ', '#', ' ', ' ', 'me:▲', ' ', ' ', '#', ' ', '#'],
        ['#', ' ', '#', '#', '#', ' ', '#', '#', '#', ' ', '#'],
        ['#', ' ', ' ', ' ', '#', ' ', '#', ' ', ' ', ' ', '#'],
        ['#', ' ', ' ', ' ', '#', '#', '#', ' ', ' ', ' ', '#'],
        ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
        ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#']
      ]

      assert.deepEqual(vision, expectedVision)
    })

    it('should return the vision correctly when player is turned to south', () => {
      mainPlayer.turn('south')

      const vision = roomMap.getVisionOfPlayer(mainPlayer)

      const expectedVision = [
        ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#'],
        ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
        ['#', ' ', ' ', ' ', '#', '#', '#', ' ', ' ', ' ', '#'],
        ['#', ' ', ' ', ' ', '#', ' ', '#', ' ', ' ', ' ', '#'],
        ['#', ' ', '#', '#', '#', ' ', '#', '#', '#', ' ', '#'],
        ['#', ' ', '#', ' ', ' ', 'me:▼', ' ', ' ', '#', ' ', '#'],
        ['#', ' ', '#', '#', '#', 'enemy:▲', '#', '#', '#', ' ', '#'],
        ['#', ' ', ' ', ' ', '#', 'item:+', '#', ' ', ' ', ' ', '#'],
        ['#', ' ', ' ', ' ', '#', '#', '#', ' ', ' ', ' ', '#'],
        ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
        ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#']
      ]

      assert.deepEqual(vision, expectedVision)
    })

    it('should return the vision correctly when player is turned to west', () => {
      mainPlayer.turn('west')

      const vision = roomMap.getVisionOfPlayer(mainPlayer)

      const expectedVision = [
        ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#'],
        ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
        ['#', ' ', ' ', ' ', '#', '#', '#', ' ', ' ', ' ', '#'],
        ['#', ' ', ' ', ' ', '#', ' ', '#', ' ', ' ', ' ', '#'],
        ['#', ' ', '#', '#', '#', ' ', '#', '#', '#', ' ', '#'],
        ['#', ' ', '#', 'item:¶', 'enemy:►', 'me:◄', ' ', ' ', '#', ' ', '#'],
        ['#', ' ', '#', '#', '#', ' ', '#', '#', '#', ' ', '#'],
        ['#', ' ', ' ', ' ', '#', ' ', '#', ' ', ' ', ' ', '#'],
        ['#', ' ', ' ', ' ', '#', '#', '#', ' ', ' ', ' ', '#'],
        ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
        ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#']
      ]

      assert.deepEqual(vision, expectedVision)
    })

    it('should return the vision correctly when player is turned to east', () => {
      mainPlayer.turn('east')

      const vision = roomMap.getVisionOfPlayer(mainPlayer)

      const expectedVision = [
        ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#'],
        ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
        ['#', ' ', ' ', ' ', '#', '#', '#', ' ', ' ', ' ', '#'],
        ['#', ' ', ' ', ' ', '#', ' ', '#', ' ', ' ', ' ', '#'],
        ['#', ' ', '#', '#', '#', ' ', '#', '#', '#', ' ', '#'],
        ['#', ' ', '#', ' ', ' ', 'me:►', 'enemy:◄', 'item:+', '#', ' ', '#'],
        ['#', ' ', '#', '#', '#', ' ', '#', '#', '#', ' ', '#'],
        ['#', ' ', ' ', ' ', '#', ' ', '#', ' ', ' ', ' ', '#'],
        ['#', ' ', ' ', ' ', '#', '#', '#', ' ', ' ', ' ', '#'],
        ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
        ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#']
      ]

      assert.deepEqual(vision, expectedVision)
    })
  })
})
