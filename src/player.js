'use strict'

const constants = require('./constants')

const pluralize = require('pluralize')
const uuid = require('uuid/v4')
const moment = require('moment')
const { isString } = require('lodash')

const now = () => moment().format()

class Player {
  constructor (socket) {
    this.name = null
    this.room = null
    this.sessionId = uuid()
    this.disconnectedAt = null
    this.lastCommandAt = now()
    this.lastNameChangeAt = null

    if (socket) {
      this.setSocket(socket)
    }
  }

  setName (name) {
    if (name === '') {
      return [false, 'Name cannot be empty']
    }

    const { NAME_MAX_LENGTH: maxLength } = constants
    if (name.length > maxLength) {
      return [false, `Name cannot exceed ${maxLength} characters`]
    }

    const [n, period] = constants.NAME_CHANGE_FLOOD_LIMIT
    if (this.room && moment().subtract(n, period).isBefore(this.lastNameChangeAt)) {
      const wait = n - moment().diff(this.lastNameChangeAt, period)
      return [false, `Wait ${wait} ${pluralize(period, wait)} to change your name again`]
    }

    this.name = name
    this.lastNameChangeAt = now()

    return [true, name]
  }

  touch () {
    this.lastCommandAt = now()
  }

  disconnect () {
    this.socket.disconnect()
  }

  setSocket (socket) {
    // if this player had a socket before, disconnect it
    if (this.socket) {
      this.socket.disconnect()
    }

    this.socket = socket
    this.socket.on('disconnect', () => {
      this.disconnectedAt = now()
    })

    this.disconnectedAt = socket.connected ? null : now()
  }

  emitToRoom (room, ...args) {
    const roomName = isString(room) ? room : room.name
    this.socket.broadcast.to(roomName).emit(...args)
  }
}

module.exports = Player
