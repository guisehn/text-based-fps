'use strict'

const Directions = require('./directions')
const { flatten, get, has, maxBy, times, trimEnd } = require('lodash')

class GameMap {
  constructor (textRepresentation) {
    this.textRepresentation = textRepresentation.trim()
    this.validateMap()
    this.mountMatrixWithRespawnPositions()
  }

  // Map matrix (only walls and empty spaces)
  getMatrix () {
    if (!this._matrix) {
      this._matrix = this._matrixWithRespawnPositions
        .map(line => line.map(position => position === '#' ? '#' : ' '))
    }

    return this._matrix
  }

  // List of respawn positions of the map with coordinates and direction
  getRespawnPositions () {
    if (!this._respawnPositions) {
      const positions = flatten(
        this._matrixWithRespawnPositions
          .map((line, y) => line.map((char, x) => ({ x, y, char })))
      )

      this._respawnPositions = positions
        .filter(item => /[NSEW]/.test(item.char))
        .map(item => ({
          x: item.x,
          y: item.y,
          direction: Directions.getFromInitial(item.char)
        }))
    }

    return this._respawnPositions
  }

  // Mounts full matrix representing the map with walls, empty spaces and respawn positions
  mountMatrixWithRespawnPositions () {
    // First, trim the end and separate the lines
    let lines = trimEnd(this.textRepresentation).split('\n')

    // Now, let's trim empty lines on the start
    let mapStarted = false
    lines = lines.filter(line => {
      const isEmpty = line.trim() === ''
      if (!isEmpty) {
        mapStarted = true
      }
      return mapStarted
    })

    // Mount the initial matrix trimming the end of all lines
    const trimmedMatrix = lines.map(line => trimEnd(line).split(''))

    // Now, let's equalize the width of all lines in case the text representation doesn't
    // form a rectangle
    const largerLine = maxBy(trimmedMatrix, line => line.length)
    const equalizedMatrix = trimmedMatrix
      .map(line => [...line, ...times(largerLine.length - line.length, () => ' ')])

    this._matrixWithRespawnPositions = equalizedMatrix
  }

  validateMap () {
    const lines = this.textRepresentation.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const match = /[^NSWE. #]/.exec(line)
      if (match) {
        throw new Error(`Invalid character '${match[0]}' found on line ${i + 1}, column ${match.index + 1}`)
      }
    }

    if (!/[NSWE]/.test(this.textRepresentation)) {
      throw new Error('Map should have at least one respawn position')
    }
  }

  coordinateExists ({ x, y }) {
    const matrix = this.getMatrix()
    return has(matrix, `${y}.${x}`)
  }

  isWall ({ x, y }) {
    const matrix = this.getMatrix()
    return get(matrix, `${y}.${x}`) === '#'
  }
}

module.exports = GameMap
