'use strict'

const assert = require('chai').assert

const GameMap = require('../src/game-map')
const RoomMap = require('../src/room-map')
const RoomPlayer = require('../src/room-player')
const RespawnPositionFinder = require('../src/respawn-position-finder')
const Player = require('../src/player')

const makeRoomPlayer = () => new RoomPlayer(new Player())

describe('RespawnPositionFinder', () => {
  describe('isSafeCoordinate', () => {
    let roomMap
    let respawnPositionFinder

    beforeEach(() => {
      const mapText = `
###########
#         #
#    #    #
#         #
#   # #   #
# #  N  # #
#   # #   #
#         #
#    #    #
#         #
###########
`.trim()

      const gameMap = new GameMap(mapText)
      roomMap = new RoomMap(gameMap)
      respawnPositionFinder = new RespawnPositionFinder(roomMap)
    })

    const coordinateToCheck = { x: 5, y: 5 } // coordinate indicated by the N on the map text

    describe('north test', () => {
      it('should return false if there is any player to the north of the coordinate with no wall in between', () => {
        const p = makeRoomPlayer()
        roomMap.movePlayerToCoordinate(p, { x: 5, y: 3 })
        assert.isFalse(respawnPositionFinder.isSafeCoordinate(coordinateToCheck))
      })

      it('should return true if the only player to the north of the coordinate is behind a wall', () => {
        const p = makeRoomPlayer()
        roomMap.movePlayerToCoordinate(p, { x: 5, y: 1 })
        assert.isTrue(respawnPositionFinder.isSafeCoordinate(coordinateToCheck))
      })
    })

    describe('south test', () => {
      it('should return false if there is any player to the south of the coordinate with no wall in between', () => {
        const p = makeRoomPlayer()
        roomMap.movePlayerToCoordinate(p, { x: 5, y: 7 })
        assert.isFalse(respawnPositionFinder.isSafeCoordinate(coordinateToCheck))
      })

      it('should return true if the only player to the south of the coordinate is behind a wall', () => {
        const p = makeRoomPlayer()
        roomMap.movePlayerToCoordinate(p, { x: 5, y: 9 })
        assert.isTrue(respawnPositionFinder.isSafeCoordinate(coordinateToCheck))
      })
    })

    describe('west test', () => {
      it('should return false if there is any player to the west of the coordinate with no wall in between', () => {
        const p = makeRoomPlayer()
        roomMap.movePlayerToCoordinate(p, { x: 3, y: 5 })
        assert.isFalse(respawnPositionFinder.isSafeCoordinate(coordinateToCheck))
      })

      it('should return true if the only player to the west of the coordinate is behind a wall', () => {
        const p = makeRoomPlayer()
        roomMap.movePlayerToCoordinate(p, { x: 1, y: 5 })
        assert.isTrue(respawnPositionFinder.isSafeCoordinate(coordinateToCheck))
      })
    })

    describe('east test', () => {
      it('should return false if there is any player to the east of the coordinate with no wall in between', () => {
        const p = makeRoomPlayer()
        roomMap.movePlayerToCoordinate(p, { x: 7, y: 5 })
        assert.isFalse(respawnPositionFinder.isSafeCoordinate(coordinateToCheck))
      })

      it('should return true if the only player to the east of the coordinate is behind a wall', () => {
        const p = makeRoomPlayer()
        roomMap.movePlayerToCoordinate(p, { x: 9, y: 5 })
        assert.isTrue(respawnPositionFinder.isSafeCoordinate(coordinateToCheck))
      })
    })

    describe('multiple direction test', () => {
      it('should return false if at least one player is close horizontally or vertically with no wall in between', () => {
        const p1 = makeRoomPlayer()
        roomMap.movePlayerToCoordinate(p1, { x: 5, y: 1 })

        const p2 = makeRoomPlayer()
        roomMap.movePlayerToCoordinate(p2, { x: 5, y: 9 })

        const p3 = makeRoomPlayer()
        roomMap.movePlayerToCoordinate(p3, { x: 3, y: 5 }) // this one

        const p4 = makeRoomPlayer()
        roomMap.movePlayerToCoordinate(p4, { x: 9, y: 5 })

        assert.isFalse(respawnPositionFinder.isSafeCoordinate(coordinateToCheck))
      })

      it('should return true if all players are behind walls', () => {
        const p1 = makeRoomPlayer()
        roomMap.movePlayerToCoordinate(p1, { x: 5, y: 1 })

        const p2 = makeRoomPlayer()
        roomMap.movePlayerToCoordinate(p2, { x: 5, y: 9 })

        const p3 = makeRoomPlayer()
        roomMap.movePlayerToCoordinate(p3, { x: 1, y: 5 })

        const p4 = makeRoomPlayer()
        roomMap.movePlayerToCoordinate(p4, { x: 9, y: 5 })

        assert.isTrue(respawnPositionFinder.isSafeCoordinate(coordinateToCheck))
      })
    })
  })

  // TODO: findRespawnPosition
})
