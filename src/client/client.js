/* global io */
'use strict'

const UP_ARROW_KEYCODE = 38
const DOWN_ARROW_KEYCODE = 40
const MAX_COMMAND_LOG_SIZE = 50
const SESSION_COOKIE_NAME = 'fps_sid'

const Game = {
  commandLog: [],
  commandLogPosition: 0,
  lostConnection: false,

  init () {
    this.initializeSocket()
    this.initializeInput()

    this.appendToTerminal(
      `Welcome to the text-based FPS! Type ||set-name <your name>|| to enter the game.`,
      'message'
    )
  },

  getSessionId () {
    const cookies = decodeURIComponent(document.cookie).split(';').map(c => c.trim())
    const cookie = cookies.filter(c => c.startsWith(`${SESSION_COOKIE_NAME}=`))[0]
    return cookie ? cookie.substr(`${SESSION_COOKIE_NAME}=`.length) : null
  },

  setSessionId (id) {
    document.cookie = `${SESSION_COOKIE_NAME}=${id}; path=/`
  },

  initializeSocket () {
    const sessionId = this.getSessionId()
    const query = sessionId ? `fps_sid=${sessionId}` : ''

    this.socket = io.connect('', { query: query })
    this.socket.on('message', this.handleMessage.bind(this))
    this.socket.on('sessionId', sessionId => this.setSessionId(sessionId))

    this.socket.on('connect', () => {
      if (this.lostConnection) {
        this.appendToTerminal(`You've been reconnected.`, 'success')
        this.lostConnection = false
      }
    })

    this.socket.on('disconnect', () => {
      this.lostConnection = true
      this.appendToTerminal('Connection lost', 'error')
    })
  },

  initializeInput () {
    this.form = document.querySelector('#terminal-input')
    this.input = this.form.querySelector('input')

    this.form.addEventListener('submit', e => {
      this.submit()
      e.preventDefault()
    })

    this.input.addEventListener('blur', () => this.input.focus())
    this.input.addEventListener('keydown', e => this.handleKeydown(e))

    this.input.focus()
  },

  submit () {
    const text = this.input.value.trim()
    if (text === '') {
      return
    }

    this.appendToTerminal(text, 'command')
    this.socket.emit('command', text)

    this.input.value = ''
    this.input.focus()

    this.commandLogPosition = this.commandLog.push(text)
    if (this.commandLog.length > MAX_COMMAND_LOG_SIZE) {
      this.commandLog.splice(0, this.commandLog.length - MAX_COMMAND_LOG_SIZE)
      this.commandLogPosition = MAX_COMMAND_LOG_SIZE
    }
  },

  appendToTerminal (text, messageType) {
    if (messageType !== 'vision') {
      text = text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }

    text = text.replace(/\|\|([^|]+)\|\|/g, '<span class="command-example">$1</span>')

    const terminal = document.querySelector('#terminal')
    terminal.innerHTML += `<pre class="${messageType}">${text}</pre>`

    const container = document.querySelector('#terminal-container')
    setTimeout(() => { container.scrollTop = container.scrollHeight }, 1)
  },

  handleMessage (message) {
    if (!message) {
      return
    }

    let content = message.content

    if (message.type === 'vision') {
      content = content
        .map(line => line.map(coord => coord.replace(/^([a-z]+):(.)/, '<span class="$1">$2</span>')))
        .map(line => line.join(' '))
        .join('\n')
    }

    this.appendToTerminal(content, message.type || 'message')
  },

  handleKeydown (e) {
    switch (e.which) {
      case UP_ARROW_KEYCODE:
        this.handleUpArrowKey()
        e.preventDefault()
        break

      case DOWN_ARROW_KEYCODE:
        this.handleDownArrowKey()
        e.preventDefault()
        break
    }
  },

  handleUpArrowKey () {
    if (this.commandLogPosition > 0) {
      this.commandLogPosition--
      this.input.value = this.commandLog[this.commandLogPosition]
    }
  },

  handleDownArrowKey () {
    if (this.commandLogPosition < this.commandLog.length - 1) {
      this.commandLogPosition++
      this.input.value = this.commandLog[this.commandLogPosition]
    } else {
      this.commandLogPosition = this.commandLog.length
      this.input.value = ''
    }
  }
}

Game.init()
