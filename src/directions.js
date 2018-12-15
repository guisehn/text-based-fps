'use strict'

const { findKey, keys } = require('lodash')

const DIRECTIONS = {
  north: {
    symbol: '▲',
    inverse: 'south',
    move: ({ x, y }) => ({ x, y: y - 1 })
  },

  south: {
    symbol: '▼',
    inverse: 'north',
    move: ({ x, y }) => ({ x, y: y + 1 })
  },

  west: {
    symbol: '◄',
    inverse: 'east',
    move: ({ x, y }) => ({ x: x - 1, y })
  },

  east: {
    symbol: '►',
    inverse: 'west',
    move: ({ x, y }) => ({ x: x + 1, y })
  }
}

class Directions {
  static all () {
    return keys(DIRECTIONS)
  }

  static exists (direction) {
    return Boolean(DIRECTIONS[direction])
  }

  static inverseOf (direction) {
    return this._get(direction).inverse
  }

  static symbolOf (direction) {
    return this._get(direction).symbol
  }

  static getFromInitial (initial) {
    initial = initial.toUpperCase()
    const direction = findKey(DIRECTIONS, (_, direction) => direction[0].toUpperCase() === initial)

    if (!direction) {
      throw new Error(`Unknown direction for initial letter ${initial}`)
    }

    return direction
  }

  static calculateMovement (direction, { x, y }) {
    return this._get(direction).move({ x, y })
  }

  static _get (direction) {
    if (!DIRECTIONS[direction]) {
      throw new Error(`Unknown direction ${direction}`)
    }

    return DIRECTIONS[direction]
  }
}

module.exports = Directions
