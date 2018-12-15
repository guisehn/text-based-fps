'use strict'

const assert = require('chai').assert
const sinon = require('sinon')
const { overrideConstants, restoreConstants, createGenericRoom } = require('./test-utils')

const Player = require('../src/player')

describe('Player', () => {
  let clock, player

  before(() => overrideConstants({
    NAME_MAX_LENGTH: 20,
    NAME_CHANGE_FLOOD_LIMIT: [5, 'seconds']
  }))

  after(() => restoreConstants())

  beforeEach(() => {
    clock = sinon.useFakeTimers()
    player = new Player()
  })

  afterEach(() => clock.restore())

  const tick = (n, fn) => {
    clock.tick(n)
    fn()
  }

  describe('setName', () => {
    it('should not allow using an empty name', () => {
      const [success, message] = player.setName('')
      assert.isFalse(success)
      assert.equal(message, 'Name cannot be empty')
    })

    it('should not allow using a name larger than the max length', () => {
      const [success, message] = player.setName('I am a 26 character string')
      assert.isFalse(success)
      assert.equal(message, 'Name cannot exceed 20 characters')
    })

    it('should allow setting the name if everything is correct', () => {
      const [success, message] = player.setName('foo')
      assert.isTrue(success)
      assert.equal(message, 'foo')
    })

    it('should not allow updating the name too often if the user is in a room', () => {
      player.room = createGenericRoom()

      const [success, message] = player.setName('Ines')
      assert.isTrue(success)
      assert.equal(message, 'Ines')

      tick(3000, () => {
        const [success, message] = player.setName('Brasil')
        assert.isFalse(success)
        assert.equal(message, 'Wait 2 seconds to change your name again')
      })

      tick(1000, () => {
        const [success, message] = player.setName('Brasil')
        assert.isFalse(success)
        assert.equal(message, 'Wait 1 second to change your name again')
      })

      tick(1000, () => {
        const [success, message] = player.setName('Brasil')
        assert.isTrue(success)
        assert.equal(message, 'Brasil')
      })

      tick(1000, () => {
        const [success, message] = player.setName('Alo alo')
        assert.isFalse(success)
        assert.equal(message, 'Wait 4 seconds to change your name again')
      })
    })

    it('should allow the user to update their name with no flood control if they are outside a room', () => {
      const [success, message] = player.setName('Ines')
      assert.isTrue(success)
      assert.equal(message, 'Ines')

      tick(1000, () => {
        const [success, message] = player.setName('Brasil')
        assert.isTrue(success)
        assert.equal(message, 'Brasil')
      })

      tick(1000, () => {
        const [success, message] = player.setName('Alo alo')
        assert.isTrue(success)
        assert.equal(message, 'Alo alo')
      })

      tick(1000, () => {
        const [success, message] = player.setName('Graças a Deus')
        assert.isTrue(success)
        assert.equal(message, 'Graças a Deus')
      })
    })
  })
})
