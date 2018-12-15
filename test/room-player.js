'use strict'

const assert = require('chai').assert
const { overrideConstants, restoreConstants } = require('./test-utils')

const Player = require('../src/player')
const RoomPlayer = require('../src/room-player')

describe('RoomPlayer', () => {
  let roomPlayer

  before(() => overrideConstants({
    MAX_HEALTH: 100,
    MAX_LOADED_AMMO: 8,
    MAX_UNLOADED_AMMO: 24
  }))

  after(() => restoreConstants())

  beforeEach(() => {
    const player = new Player()
    roomPlayer = new RoomPlayer(player)
  })

  describe('turn', () => {
    it('should allow turning around', () => {
      roomPlayer.direction = 'north'
      roomPlayer.turn('around')
      assert.equal(roomPlayer.direction, 'south')
      roomPlayer.turn('around')
      assert.equal(roomPlayer.direction, 'north')

      roomPlayer.direction = 'west'
      roomPlayer.turn('around')
      assert.equal(roomPlayer.direction, 'east')
      roomPlayer.turn('around')
      assert.equal(roomPlayer.direction, 'west')
    })

    it('should allow turning to pre-defined directions', () => {
      roomPlayer.turn('north')
      assert.equal(roomPlayer.direction, 'north')

      roomPlayer.turn('south')
      assert.equal(roomPlayer.direction, 'south')

      roomPlayer.turn('west')
      assert.equal(roomPlayer.direction, 'west')

      roomPlayer.turn('east')
      assert.equal(roomPlayer.direction, 'east')
    })

    it('should return true if the turn is successful', () => {
      assert.isTrue(roomPlayer.turn('north'))
      assert.isTrue(roomPlayer.turn('south'))
      assert.isTrue(roomPlayer.turn('west'))
      assert.isTrue(roomPlayer.turn('east'))
      assert.isTrue(roomPlayer.turn('around'))
    })

    it('should return false if the direction does not exist', () => {
      assert.isFalse(roomPlayer.turn('lol'))
    })
  })

  describe('addHealth', () => {
    it('should add health to the player', () => {
      roomPlayer.health = 50
      roomPlayer.addHealth(10)
      assert.equal(roomPlayer.health, 60)

      roomPlayer.addHealth(20)
      assert.equal(roomPlayer.health, 80)
    })

    it('should not surpass the maximum health', () => {
      roomPlayer.health = 90
      roomPlayer.addHealth(15)
      assert.equal(roomPlayer.health, 100)
    })
  })

  describe('addAmmo', () => {
    it('should add ammo to the player', () => {
      roomPlayer.unloadedAmmo = 5
      roomPlayer.addAmmo(8)
      assert.equal(roomPlayer.unloadedAmmo, 13)

      roomPlayer.addAmmo(8)
      assert.equal(roomPlayer.unloadedAmmo, 21)
    })

    it('should not surpass the maximum ammo', () => {
      roomPlayer.unloadedAmmo = 20
      roomPlayer.addAmmo(8)
      assert.equal(roomPlayer.unloadedAmmo, 24)
    })
  })

  describe('reloadGun', () => {
    it('should not reload the gun if the user does not have ammo', () => {
      roomPlayer.loadedAmmo = 2
      roomPlayer.unloadedAmmo = 0

      assert.deepEqual(roomPlayer.reloadGun(), {
        reloaded: false,
        loadedAmmo: 2,
        unloadedAmmo: 0
      })
    })

    it('should not reload gun if gun has no space', () => {
      roomPlayer.loadedAmmo = 8 // equal to MAX_UNLOADED_AMMO
      roomPlayer.unloadedAmmo = 10

      assert.deepEqual(roomPlayer.reloadGun(), {
        reloaded: false,
        loadedAmmo: 8,
        unloadedAmmo: 10
      })
    })

    it('should reload gun if user has ammo and gun has space', () => {
      roomPlayer.loadedAmmo = 2 // below MAX_UNLOADED_AMMO
      roomPlayer.unloadedAmmo = 10

      assert.deepEqual(roomPlayer.reloadGun(), {
        reloaded: true,
        loadedAmmo: 8,
        unloadedAmmo: 4
      })
    })
  })
})
