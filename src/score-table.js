'use strict'

const { orderBy } = require('lodash')
const Table = require('tty-table')

class ScoreTable {
  static generate (roomPlayers) {
    const headers = [{
      value: 'name',
      alias: 'Name',
      align: 'left'
    }, {
      value: 'kills',
      alias: 'Score',
      align: 'left'
    }, {
      value: 'killed',
      alias: 'Deaths',
      align: 'left'
    }]

    const players = roomPlayers.map(roomPlayer => ({
      name: roomPlayer.player.name,
      kills: String(roomPlayer.kills),
      killed: String(roomPlayer.killed)
    }))

    const sortedPlayers = orderBy(players, ['kills', 'killed', 'name'], ['desc', 'asc', 'asc'])

    const table = new Table(headers, sortedPlayers, [], {
      borderStyle: 2,
      color: null,
      headerColor: null
    })

    return table.render()
  }
}

module.exports = ScoreTable
