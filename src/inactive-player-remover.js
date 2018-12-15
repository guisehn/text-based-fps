'use strict'

const constants = require('./constants')
const moment = require('moment')

class InactivePlayerRemover {
  constructor (serverState) {
    this.serverState = serverState
    this.interval = null
  }

  start () {
    this.interval = setInterval(() => this.check(), 30 * 1000)
  }

  stop () {
    clearInterval(this.interval)
    this.interval = null
  }

  getDisconnectionTimeCutoff () {
    const [n, period] = constants.DISCONNECTION_TIME_LIMIT
    return moment().subtract(n, period)
  }

  getInactivityTimeCutoff () {
    const [n, period] = constants.INACTIVITY_LIMIT
    return moment().subtract(n, period)
  }

  check () {
    const disconnectionTimeCutoff = this.getDisconnectionTimeCutoff()
    const inactivityTimeCutoff = this.getInactivityTimeCutoff()

    const playersToRemove = this.serverState.players
      .filter(player => {
        const disconnected = player.disconnectedAt && disconnectionTimeCutoff.isAfter(player.disconnectedAt)
        const inactive = inactivityTimeCutoff.isAfter(player.lastCommandAt)
        return disconnected || inactive
      })

    for (const player of playersToRemove) {
      player.socket.emit('message', {
        type: 'message',
        content: 'You have been kicked out of the server for inactivity. Refresh the page to play again.'
      })

      this.serverState.removePlayer(player)
    }
  }
}

module.exports = InactivePlayerRemover
