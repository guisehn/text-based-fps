'use strict'

const constants = require('./constants')
const Directions = require('./directions')

const { pick } = require('lodash')

class RoomPlayer {
  constructor (player) {
    this.player = player
    this.x = null
    this.y = null
    this.direction = null
    this.health = 0
    this.unloadedAmmo = null
    this.loadedAmmo = null
    this.kills = 0
    this.killed = 0
  }

  turn (direction) {
    if (direction === 'around') {
      direction = Directions.inverseOf(this.direction)
    }

    if (!Directions.exists(direction)) {
      return false
    }

    this.direction = direction
    return true
  }

  reloadGun () {
    const { MAX_LOADED_AMMO } = constants

    let reloaded = false

    if (this.unloadedAmmo > 0 && this.loadedAmmo < MAX_LOADED_AMMO) {
      const loadAmount = Math.min(MAX_LOADED_AMMO - this.loadedAmmo, this.unloadedAmmo)
      this.loadedAmmo += loadAmount
      this.unloadedAmmo -= loadAmount

      reloaded = true
    }

    return { reloaded, ...pick(this, 'loadedAmmo', 'unloadedAmmo') }
  }

  addHealth (amount) {
    this.health = Math.min(this.health + amount, constants.MAX_HEALTH)
  }

  addAmmo (ammo) {
    this.unloadedAmmo = Math.min(this.unloadedAmmo + ammo, constants.MAX_UNLOADED_AMMO)
  }

  isDead () {
    return this.health <= 0
  }
}

module.exports = RoomPlayer
