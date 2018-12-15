'use strict'

const Directions = require('./directions')

const { find, shuffle } = require('lodash')

class RespawnPositionFinder {
  constructor (roomMap) {
    this.roomMap = roomMap
  }

  findRespawnPosition (shufflePositions = true) {
    let respawnPositions = this.roomMap.gameMap.getRespawnPositions()

    if (shufflePositions) {
      respawnPositions = shuffle(respawnPositions)
    }

    const emptyRespawnPositions = respawnPositions
      .filter(({ x, y }) => !this.roomMap.hasPlayerAtCoordinate({ x, y }))

    const safeRespawnPosition = find(emptyRespawnPositions,
      ({ x, y }) => this.isSafeCoordinate({ x, y }))

    return safeRespawnPosition || emptyRespawnPositions[0]
  }

  isSafeCoordinate ({ x, y }) {
    let safe = true

    for (const direction of Directions.all()) {
      this.roomMap.iterateMap({ x, y, direction }, coord => {
        // If we find an enemy at this coordinate, it's not safe
        if (this.roomMap.hasPlayerAtCoordinate(coord)) {
          safe = false
          return false // stop the iteration
        }

        // If we found a wall at this coordinate, there's no enemy nearby.
        if (this.roomMap.gameMap.isWall(coord)) {
          return false // stop the iteration
        }
      })

      if (!safe) {
        break
      }
    }

    return safe
  }
}

module.exports = RespawnPositionFinder
