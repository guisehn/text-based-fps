'use strict'

const constants = require('./constants')
const { keys, sample } = require('lodash')

const ITEMS = {
  ammo: {
    symbol: '¶',
    equip: roomPlayer => roomPlayer.addAmmo(constants.AMMO_PACK_AMOUNT),
    equipMessage: `You've found ammo`
  },

  health: {
    symbol: '+',
    equip: roomPlayer => roomPlayer.addHealth(constants.HEALTH_PACK_AMOUNT),
    equipMessage: `You've picked a health pack`
  }
}

class Items {
  static all () {
    return keys(ITEMS)
  }

  static exists (item) {
    return Boolean(ITEMS[item])
  }

  static getRandom () {
    return sample(this.all())
  }

  static symbolOf (item) {
    return this._get(item).symbol
  }

  static equip (item, roomPlayer) {
    return this._get(item).equip(roomPlayer)
  }

  static equipMessageOf (item) {
    return this._get(item).equipMessage
  }

  static _get (item) {
    if (!ITEMS[item]) {
      throw new Error(`Unknown item ${item}`)
    }

    return ITEMS[item]
  }
}

module.exports = Items
