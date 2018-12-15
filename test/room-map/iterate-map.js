'use strict'

const assert = require('chai').assert

const GameMap = require('../../src/game-map')
const RoomMap = require('../../src/room-map')

describe('RoomMap', () => {
  describe('iterateMap', () => {
    const mapText = `
#####
# S #
# N #
#####
`.trim()

    const gameMap = new GameMap(mapText)
    const roomMap = new RoomMap(gameMap)

    it('should iterate correctly for north', () => {
      const log = []
      const fn = coord => log.push(coord)
      roomMap.iterateMap({ x: 2, y: 2, direction: 'north' }, fn)
      assert.deepEqual(log, [{ x: 2, y: 1 }, { x: 2, y: 0 }])
    })

    it('should iterate correctly for south', () => {
      const log = []
      const fn = coord => log.push(coord)
      roomMap.iterateMap({ x: 2, y: 1, direction: 'south' }, fn)
      assert.deepEqual(log, [{ x: 2, y: 2 }, { x: 2, y: 3 }])
    })

    it('should iterate correctly for west', () => {
      const log = []
      const fn = coord => log.push(coord)
      roomMap.iterateMap({ x: 2, y: 1, direction: 'west' }, fn)
      assert.deepEqual(log, [{ x: 1, y: 1 }, { x: 0, y: 1 }])
    })

    it('should iterate correctly for east', () => {
      const log = []
      const fn = coord => log.push(coord)
      roomMap.iterateMap({ x: 2, y: 1, direction: 'east' }, fn)
      assert.deepEqual(log, [{ x: 3, y: 1 }, { x: 4, y: 1 }])
    })

    it('should stop the loop when the callback function returns false', () => {
      const log = []
      const fn = coord => {
        log.push(coord)
        return false
      }
      roomMap.iterateMap({ x: 2, y: 1, direction: 'east' }, fn)
      assert.deepEqual(log, [{ x: 3, y: 1 }])
    })

    it('should throw error for invalid directions', () => {
      assert.throws(
        () => roomMap.iterateMap({ x: 2, y: 1, direction: 'lol' }, () => {}),
        'Unknown direction lol'
      )
    })
  })
})
