'use strict'

const assert = require('chai').assert

const GameMap = require('../../src/game-map')
const RoomMap = require('../../src/room-map')
const RoomItem = require('../../src/room-item')
const RoomPlayer = require('../../src/room-player')
const Player = require('../../src/player')

const makeRoomPlayer = () => new RoomPlayer(new Player())

describe('RoomMap', () => {
  let roomMap

  beforeEach(() => {
    const gameMap = new GameMap(`#N #`)
    roomMap = new RoomMap(gameMap)
  })

  describe('getCoordinate', () => {
    it('should return null if coordinate does not exist', () => {
      assert.isNull(roomMap.getCoordinate({ x: 1, y: 1 }))
    })

    it('should return null if there is nothing on the coordinate', () => {
      assert.isNull(roomMap.getCoordinate({ x: 1, y: 0 }))

      // There's a wall on (0, 0) but the coordinate matrix of the RoomMap
      // stores only players and items, so this should be null as well
      assert.isNull(roomMap.getCoordinate({ x: 0, y: 0 }))
    })
  })

  describe('setCoordinate', () => {
    it('should set the coordinate and return true if coordinate exists', () => {
      const item = new RoomItem('health')

      const result = roomMap.setCoordinate({ x: 1, y: 0 }, item)
      assert.isTrue(result)
      assert.equal(roomMap.getCoordinate({ x: 1, y: 0 }), item)
    })

    it('should not set the coordinate and return false if the coordinate does not exist', () => {
      const item = new RoomItem('health')
      const result = roomMap.setCoordinate({ x: 1, y: 1 }, item)
      assert.isFalse(result)
      assert.isNull(roomMap.getCoordinate({ x: 1, y: 1 }))
    })
  })

  describe('addItemToCoordinate', () => {
    it('should add the item to the coordinate and return it', () => {
      const item = roomMap.addItemToCoordinate('health', { x: 1, y: 0 })

      assert.instanceOf(item, RoomItem)
      assert.equal(item.type, 'health')
      assert.equal(roomMap.getCoordinate({ x: 1, y: 0 }), item)
    })
  })

  describe('addRandomItemToCoordinate', () => {
    it('should add an item to the coordinate and return it', () => {
      const item = roomMap.addRandomItemToCoordinate({ x: 1, y: 0 })

      assert.instanceOf(item, RoomItem)
      assert.isString(item.type)
      assert.equal(roomMap.getCoordinate({ x: 1, y: 0 }), item)
    })
  })

  describe('hasItemAtCoordinate', () => {
    it('should return false if the coordinate does not exist', () => {
      assert.isFalse(roomMap.hasItemAtCoordinate({ x: 1, y: 1 }))
    })

    it('should return false if the coordinate is empty', () => {
      assert.isFalse(roomMap.hasItemAtCoordinate({ x: 1, y: 0 }))
    })

    it('should return false if the coordinate has a player ', () => {
      const roomPlayer = makeRoomPlayer()
      roomMap.setCoordinate({ x: 1, y: 0 }, roomPlayer)
      assert.isFalse(roomMap.hasItemAtCoordinate({ x: 1, y: 0 }))
    })

    it('should return true if the coordinate has an item', () => {
      roomMap.addItemToCoordinate('health', { x: 1, y: 0 })
      assert.isTrue(roomMap.hasItemAtCoordinate({ x: 1, y: 0 }))
    })
  })

  describe('getItemAtCoordinate', () => {
    it('should return null if the coordinate does not exist', () => {
      assert.isNull(roomMap.getItemAtCoordinate({ x: 1, y: 1 }))
    })

    it('should return null if the coordinate is empty', () => {
      assert.isNull(roomMap.getItemAtCoordinate({ x: 1, y: 0 }))
    })

    it('should return null if the coordinate has a player ', () => {
      const roomPlayer = makeRoomPlayer()
      roomMap.setCoordinate({ x: 1, y: 0 }, roomPlayer)
      assert.isNull(roomMap.getItemAtCoordinate({ x: 1, y: 0 }))
    })

    it('should return the item if the coordinate has an item', () => {
      const item = new RoomItem('health')
      roomMap.setCoordinate({ x: 1, y: 0 }, item)
      assert.equal(roomMap.getItemAtCoordinate({ x: 1, y: 0 }), item)
    })
  })

  describe('hasPlayerAtCoordinate', () => {
    it('should return false if the coordinate does not exist', () => {
      assert.isFalse(roomMap.hasPlayerAtCoordinate({ x: 1, y: 1 }))
    })

    it('should return false if the coordinate is empty', () => {
      assert.isFalse(roomMap.hasPlayerAtCoordinate({ x: 1, y: 0 }))
    })

    it('should return false if the coordinate has an item', () => {
      roomMap.addItemToCoordinate('health', { x: 1, y: 0 })
      assert.isFalse(roomMap.hasPlayerAtCoordinate({ x: 1, y: 0 }))
    })

    it('should return true if the coordinate has a player ', () => {
      const roomPlayer = makeRoomPlayer()
      roomMap.setCoordinate({ x: 1, y: 0 }, roomPlayer)
      assert.isTrue(roomMap.hasPlayerAtCoordinate({ x: 1, y: 0 }))
    })
  })

  describe('getPlayerAtCoordinate', () => {
    it('should return null if the coordinate does not exist', () => {
      assert.isNull(roomMap.getPlayerAtCoordinate({ x: 1, y: 1 }))
    })

    it('should return null if the coordinate is empty', () => {
      assert.isNull(roomMap.getPlayerAtCoordinate({ x: 1, y: 0 }))
    })

    it('should return null if the coordinate has an item', () => {
      roomMap.addItemToCoordinate('health', { x: 1, y: 0 })
      assert.isNull(roomMap.getPlayerAtCoordinate({ x: 1, y: 0 }))
    })

    it('should return the player if the coordinate has a player ', () => {
      const roomPlayer = makeRoomPlayer()
      roomMap.setCoordinate({ x: 1, y: 0 }, roomPlayer)
      assert.equal(roomMap.getPlayerAtCoordinate({ x: 1, y: 0 }), roomPlayer)
    })
  })

  describe('movePlayerToCoordinate', () => {
    let roomPlayer

    beforeEach(() => {
      roomPlayer = makeRoomPlayer()
    })

    function assertPlayerDidNotMove (nonMovedPlayer, fn) {
      const { x, y } = nonMovedPlayer
      const result = fn()

      assert.isFalse(result.success)
      assert.isNull(result.item)
      assert.equal(nonMovedPlayer.x, x, `player's x coordinate should stay the same`)
      assert.equal(nonMovedPlayer.y, y, `player's y coordinate should stay the same`)
    }

    it('should not move the player if the coordinate does not exist', () => {
      assertPlayerDidNotMove(roomPlayer,
        () => roomMap.movePlayerToCoordinate(roomPlayer, { x: 1, y: 1 }))
    })

    it('should not move the player if the coordinate has a wall', () => {
      assertPlayerDidNotMove(roomPlayer,
        () => roomMap.movePlayerToCoordinate(roomPlayer, { x: 0, y: 0 }))
    })

    it('should move the player if coordinate is empty', () => {
      const result = roomMap.movePlayerToCoordinate(roomPlayer, { x: 1, y: 0 })
      assert.isTrue(result.success)
      assert.isNull(result.item)
      assert.equal(roomPlayer.x, 1)
      assert.equal(roomPlayer.y, 0)
      assert.equal(roomMap.getPlayerAtCoordinate({ x: 1, y: 0 }), roomPlayer)
    })

    it('should move the player and return the item if coordinate had an item', () => {
      roomMap.addItemToCoordinate('health', { x: 1, y: 0 })

      const result = roomMap.movePlayerToCoordinate(roomPlayer, { x: 1, y: 0 })
      assert.isTrue(result.success)
      assert.equal(result.item, 'health')
      assert.equal(roomPlayer.x, 1)
      assert.equal(roomPlayer.y, 0)
      assert.equal(roomMap.getPlayerAtCoordinate({ x: 1, y: 0 }), roomPlayer)
    })

    it('should move the player out of the previous coordinate', () => {
      roomMap.movePlayerToCoordinate(roomPlayer, { x: 1, y: 0 })
      assert.equal(roomMap.getPlayerAtCoordinate({ x: 1, y: 0 }), roomPlayer)

      roomMap.movePlayerToCoordinate(roomPlayer, { x: 2, y: 0 })
      assert.isNull(roomMap.getPlayerAtCoordinate({ x: 1, y: 0 }))
      assert.equal(roomMap.getPlayerAtCoordinate({ x: 2, y: 0 }), roomPlayer)
    })

    it('should not move the player if there is another player on the coordinate', () => {
      roomMap.movePlayerToCoordinate(roomPlayer, { x: 1, y: 0 })

      const anotherRoomPlayer = makeRoomPlayer()
      roomMap.movePlayerToCoordinate(anotherRoomPlayer, { x: 2, y: 0 })

      assertPlayerDidNotMove(roomPlayer,
        () => roomMap.movePlayerToCoordinate(roomPlayer, { x: 2, y: 0 }))

      assertPlayerDidNotMove(anotherRoomPlayer,
        () => roomMap.movePlayerToCoordinate(anotherRoomPlayer, { x: 1, y: 0 }))
    })

    it('should return success as true if player is already on the coordinate passed', () => {
      roomMap.movePlayerToCoordinate(roomPlayer, { x: 1, y: 0 })

      const result = roomMap.movePlayerToCoordinate(roomPlayer, { x: 1, y: 0 })
      assert.isTrue(result.success)
      assert.isNull(result.item)
      assert.equal(roomPlayer.x, 1)
      assert.equal(roomPlayer.y, 0)
      assert.equal(roomMap.getPlayerAtCoordinate({ x: 1, y: 0 }), roomPlayer)
    })
  })

  describe('removePlayerFromMap', () => {
    let roomPlayer

    beforeEach(() => {
      roomPlayer = makeRoomPlayer()
    })

    it('should remove the player from map and return the coordinate they used to occupy', () => {
      roomMap.movePlayerToCoordinate(roomPlayer, { x: 1, y: 0 })

      const coord = roomMap.removePlayerFromMap(roomPlayer)
      assert.deepEqual(coord, { x: 1, y: 0 })
      assert.isNull(roomPlayer.x, null)
      assert.isNull(roomPlayer.y, null)
      assert.isNull(roomMap.getCoordinate({ x: 1, y: 0 }))
    })

    it('should return null coordinates if player was not in the map', () => {
      const coord = roomMap.removePlayerFromMap(roomPlayer)
      assert.deepEqual(coord, { x: null, y: null })
      assert.isNull(roomPlayer.x, null)
      assert.isNull(roomPlayer.y, null)
    })
  })
})
