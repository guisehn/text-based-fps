'use strict'

const assert = require('chai').assert
const Items = require('../src/items')

describe('Items', () => {
  describe('all', () => {
    it('should return the items', () => {
      assert.deepEqual(Items.all().sort(), ['ammo', 'health'])
    })
  })

  describe('exists', () => {
    it('should return true for existent items', () => {
      assert.isTrue(Items.exists('ammo'))
      assert.isTrue(Items.exists('health'))
    })

    it('should return false for non-existent items', () => {
      assert.isFalse(Items.exists('lol'))
    })
  })

  describe('getRandom', () => {
    it('should return an item', () => {
      assert.isString(Items.getRandom())
    })
  })

  describe('symbolOf', () => {
    it('should return the symbol of the item', () => {
      assert.lengthOf(Items.symbolOf('ammo'), 1)
      assert.lengthOf(Items.symbolOf('health'), 1)
    })

    it('should throw error for non-existent items', () => {
      assert.throws(() => Items.symbolOf('lol'), 'Unknown item lol')
    })
  })

  describe('equipMessageOf', () => {
    it('should return the equip message of the item', () => {
      assert.isString(Items.equipMessageOf('ammo'))
      assert.isString(Items.equipMessageOf('health'))
    })

    it('should throw error for non-existent items', () => {
      assert.throws(() => Items.equipMessageOf('lol'), 'Unknown item lol')
    })
  })
})
