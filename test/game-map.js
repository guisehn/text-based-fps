'use strict'

const assert = require('chai').assert
const GameMap = require('../src/game-map')

describe('GameMap', () => {
  describe('constructor', () => {
    it('should throw an error if the map does not have any respawn position', () => {
      const map = `
###
# #
###
      `.trim()

      assert.throws(() => new GameMap(map), /respawn/)
    })

    it('should throw an error if the map has invalid characters', () => {
      const map = `
#####
# ) #
#####
      `.trim()

      assert.throws(() => new GameMap(map), `Invalid character ')' found on line 2, column 3`)
    })

    it('should not throw an error if the map is ok', () => {
      const map = `
##########
# NSWE . #
##########
      `.trim()

      assert.doesNotThrow(() => new GameMap(map))
    })
  })

  describe('getMatrix', () => {
    it('should be a representation of the map with walls and empty spaces only', () => {
      const map = `
#####
# N.#
#####
      `.trim()

      const gameMap = new GameMap(map)
      assert.deepEqual(gameMap.getMatrix(), [
        ['#', '#', '#', '#', '#'],
        ['#', ' ', ' ', ' ', '#'],
        ['#', '#', '#', '#', '#']
      ])
    })

    it('should create empty coordinates if not all lines are of the same size', () => {
      const map = `
####
#   ##
 #   W#
#   ##
####
      `.trim()

      const gameMap = new GameMap(map)
      assert.deepEqual(gameMap.getMatrix(), [
        ['#', '#', '#', '#', ' ', ' ', ' '],
        ['#', ' ', ' ', ' ', '#', '#', ' '],
        [' ', '#', ' ', ' ', ' ', ' ', '#'],
        ['#', ' ', ' ', ' ', '#', '#', ' '],
        ['#', '#', '#', '#', ' ', ' ', ' ']
      ])
    })

    it('it should discard empty lines at start and end, but not in the middle', () => {
      const map = `

####
#   ##

#    W#
#   ##
####

      `

      const gameMap = new GameMap(map)
      assert.deepEqual(gameMap.getMatrix(), [
        ['#', '#', '#', '#', ' ', ' ', ' '],
        ['#', ' ', ' ', ' ', '#', '#', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' '], // empty line in the middle should stay
        ['#', ' ', ' ', ' ', ' ', ' ', '#'],
        ['#', ' ', ' ', ' ', '#', '#', ' '],
        ['#', '#', '#', '#', ' ', ' ', ' ']
      ])
    })

    it('it should allow using dots or respawn positions to delimit the map', () => {
      const map = `
S

 ####

N
      .
      `

      const gameMap = new GameMap(map)
      assert.deepEqual(gameMap.getMatrix(), [
        [' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', '#', '#', '#', '#', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ']
      ])
    })
  })

  describe('getRespawnPositions', () => {
    it('should return the list of respawn positions based on the map', () => {
      const map = `
#######
# N S #
#  #  #
# W E #
#######
      `.trim()

      const gameMap = new GameMap(map)
      assert.deepEqual(gameMap.getRespawnPositions(), [
        { x: 2, y: 1, direction: 'north' },
        { x: 4, y: 1, direction: 'south' },
        { x: 2, y: 3, direction: 'west' },
        { x: 4, y: 3, direction: 'east' }
      ])
    })
  })

  describe('isWall', () => {
    const gameMap = new GameMap(`#N#`)

    it('should return true if coordinate is a wall', () => {
      assert.isTrue(gameMap.isWall({ x: 0, y: 0 }))
      assert.isTrue(gameMap.isWall({ x: 2, y: 0 }))
    })

    it('should return false if coordinate is not a wall', () => {
      assert.isFalse(gameMap.isWall({ x: 1, y: 0 }))
    })

    it('should return false if coordinate does not exist', () => {
      assert.isFalse(gameMap.isWall({ x: 5, y: 5 }))
    })
  })

  describe('coordinateExists', () => {
    const gameMap = new GameMap(`#N#`)

    it('should return true if coordinate exists', () => {
      assert.isTrue(gameMap.coordinateExists({ x: 0, y: 0 }))
      assert.isTrue(gameMap.coordinateExists({ x: 1, y: 0 }))
      assert.isTrue(gameMap.coordinateExists({ x: 2, y: 0 }))
    })

    it('should return false if coordinate does not exist', () => {
      assert.isFalse(gameMap.coordinateExists({ x: 3, y: 0 }))
      assert.isFalse(gameMap.coordinateExists({ x: 0, y: 1 }))
    })
  })
})
