'use strict'

const assert = require('chai').assert
const Directions = require('../src/directions')

describe('Directions', () => {
  describe('all', () => {
    it('should return the four directions', () => {
      const directions = Directions.all()
      assert.lengthOf(directions, 4)
    })
  })

  describe('exists', () => {
    it('should return true for existent directions', () => {
      assert.isTrue(Directions.exists('north'))
      assert.isTrue(Directions.exists('south'))
      assert.isTrue(Directions.exists('west'))
      assert.isTrue(Directions.exists('east'))
    })

    it('should return false for non-existent directions', () => {
      assert.isFalse(Directions.exists('lol'))
    })
  })

  describe('inverseOf', () => {
    it('should return the inverse directions', () => {
      assert.equal(Directions.inverseOf('north'), 'south')
      assert.equal(Directions.inverseOf('south'), 'north')
      assert.equal(Directions.inverseOf('west'), 'east')
      assert.equal(Directions.inverseOf('east'), 'west')
    })

    it('should throw error for non-existent directions', () => {
      assert.throws(() => Directions.inverseOf('lol'), 'Unknown direction lol')
    })
  })

  describe('symbolOf', () => {
    it('should return the symbols', () => {
      assert.isString(Directions.symbolOf('north'))
      assert.isString(Directions.symbolOf('south'))
      assert.isString(Directions.symbolOf('west'))
      assert.isString(Directions.symbolOf('east'))
    })

    it('should throw error for non-existent directions', () => {
      assert.throws(() => Directions.symbolOf('lol'), 'Unknown direction lol')
    })
  })

  describe('getFromInitial', () => {
    it('should return the direction from the initial letter', () => {
      assert.equal(Directions.getFromInitial('N'), 'north')
      assert.equal(Directions.getFromInitial('S'), 'south')
      assert.equal(Directions.getFromInitial('W'), 'west')
      assert.equal(Directions.getFromInitial('E'), 'east')
    })

    it('should return undefined for other initials', () => {
      assert.throws(() => Directions.getFromInitial('l'), 'Unknown direction for initial letter L')
    })
  })

  describe('calculateMovement', () => {
    it('should calculate correctly for north', () => {
      const result = Directions.calculateMovement('north', { x: 5, y: 5 })
      assert.deepEqual(result, { x: 5, y: 4 })
    })

    it('should calculate correctly for south', () => {
      const result = Directions.calculateMovement('south', { x: 5, y: 5 })
      assert.deepEqual(result, { x: 5, y: 6 })
    })

    it('should calculate correctly for west', () => {
      const result = Directions.calculateMovement('west', { x: 5, y: 5 })
      assert.deepEqual(result, { x: 4, y: 5 })
    })

    it('should calculate correctly for east', () => {
      const result = Directions.calculateMovement('east', { x: 5, y: 5 })
      assert.deepEqual(result, { x: 6, y: 5 })
    })

    it('should throw error for unknown direction', () => {
      const fn = () => Directions.calculateMovement('lol', { x: 5, y: 5 })
      assert.throws(fn, 'Unknown direction lol')
    })
  })
})
