'use strict'

const { orderBy } = require('lodash')
const Table = require('tty-table')

class RoomsTable {
  static generate (rooms) {
    const headers = [{
      value: 'name',
      alias: 'Name',
      align: 'left'
    }, {
      value: 'players',
      alias: 'Players',
      align: 'left'
    }]

    const data = rooms.map(room => ({
      name: room.name,
      players: String(room.roomPlayers.length)
    }))

    const sortedData = orderBy(data, ['players', 'name'], ['desc', 'asc'])

    const table = new Table(headers, sortedData, [], {
      borderStyle: 2,
      color: null,
      headerColor: null
    })

    return table.render()
  }
}

module.exports = RoomsTable
