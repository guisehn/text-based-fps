'use strict'

const assert = require('chai').assert

const GameMap = require('../../src/game-map')
const RoomMap = require('../../src/room-map')
const RoomPlayer = require('../../src/room-player')
const Player = require('../../src/player')

const makeRoomPlayer = () => new RoomPlayer(new Player())

describe('RoomMap', () => {
  describe('getPlayersOnPath', () => {
    const mapText = `
##########
#. . .#. #
#        #N
##########
`.trim()

    const gameMap = new GameMap(mapText)
    const roomMap = new RoomMap(gameMap)

    // p1 is where the first dot is (left to right)
    const p1 = makeRoomPlayer()
    roomMap.movePlayerToCoordinate(p1, { x: 1, y: 1 })

    // p2 is where the second dot is (left to right)
    const p2 = makeRoomPlayer()
    roomMap.movePlayerToCoordinate(p2, { x: 3, y: 1 })

    // p3 is where the third dot is (left to right)
    const p3 = makeRoomPlayer()
    roomMap.movePlayerToCoordinate(p3, { x: 5, y: 1 })

    // p4 is where the fourth dot is (left to right), separated
    // from the other players by the wall
    const p4 = makeRoomPlayer()
    roomMap.movePlayerToCoordinate(p4, { x: 7, y: 1 })

    // add an item to make sure if gets ignored
    roomMap.addItemToCoordinate('health', { x: 2, y: 1 })

    // scenario #1 - looking east from the coordinate between p1 and p2
    // p2 and p3 should be visible, p4 shouldn't because it's behind the wall
    it('should return the players and distances correctly (scenario #1)', () => {
      const result = roomMap.getPlayersOnPath({ x: 2, y: 1, direction: 'east' })
      assert.deepEqual(result, [
        { player: p2, distance: 1 },
        { player: p3, distance: 3 }
      ])
    })

    // scenario #2 - looking west from the coordinate to the east of p4
    // only p4 should be visible, p2 and p3 are behind the wall
    it('should return the players and distances correctly (scenario #2)', () => {
      const result = roomMap.getPlayersOnPath({ x: 8, y: 1, direction: 'west' })
      assert.deepEqual(result, [
        { player: p4, distance: 1 }
      ])
    })

    // scenario #3 - looking west from the coordinate to the east of p2
    // only p2 and p1 should be visible
    it('should return the players and distances correctly (scenario #3)', () => {
      const result = roomMap.getPlayersOnPath({ x: 4, y: 1, direction: 'west' })
      assert.deepEqual(result, [
        { player: p2, distance: 1 },
        { player: p1, distance: 3 }
      ])
    })

    // scenario #4 - looking north from the point to the south of p1
    // only p1 should be visible
    it('should return the players and distances correctly (scenario #4)', () => {
      const result = roomMap.getPlayersOnPath({ x: 1, y: 2, direction: 'north' })
      assert.deepEqual(result, [
        { player: p1, distance: 1 }
      ])
    })

    // scenario #5 - looking north from the point to the southeast of p1
    it('should return the players and distances correctly (scenario #5)', () => {
      const result = roomMap.getPlayersOnPath({ x: 2, y: 2, direction: 'north' })
      assert.deepEqual(result, [])
    })
  })
})
