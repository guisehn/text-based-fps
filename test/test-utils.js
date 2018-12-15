'use strict'

const GameMap = require('../src/game-map')
const Room = require('../src/room')

const constants = require('../src/constants')
const originalConstants = { ...constants }

function overrideConstants (obj) {
  setAll(constants, obj)
}

function restoreConstants () {
  setAll(constants, originalConstants)
}

function setAll (a, b) {
  for (const k in b) {
    a[k] = b[k]
  }
}

function createGenericRoom () {
  const gameMap = new GameMap(`#N #`)
  return new Room(null, 'test', gameMap)
}

module.exports = {
  overrideConstants,
  restoreConstants,
  createGenericRoom
}
