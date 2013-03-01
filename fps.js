/**
 * Text-based FPS node.js experiment
 * Developed by Guilherme Henrique Sehn
 * Original game by Eigen Lenk
 */

var	http = require('http'),
	url = require('url'),
	fs = require('fs'),
	events = require('events')

/**
 * Game settings
 */
var Settings = {
	port: 1337,
	gun_max_available_ammo: 8,
	gun_max_ammo: 24,
	renaming_interval_limit: 10,
	symbols: {N: '▲', S: '▼', E: '►', W: '◄', IH: '+', IA: '¶'}
}

/**
 * Server properties
 */
var Server = {
	http: null,
	map: null,
	respawn_places: [],
	page: null,
	started_at: null,
	events: new (events.EventEmitter),
	players: {},
	rooms: {},
}

/**
 * Utility functions
 */
var Util = {
	generate_id: function()
	{
		var	random = Math.random().toString(36).substring(7),
			id = ''

		for (var i = 0, j = random.length; i < j; i++)
		{
			if ((Math.floor(Math.random() * 2) + 1) == 2)
				id += random[i].toUpperCase()
			else
				id += random[i]
		}

		return id + Util.current_timestamp()
	},

	player_name_exists: function(name)
	{
		var exists = false

		for (var sid in Server.players)
		{
			if (Server.players[sid].name == name)
			{
				exists = true
				break
			}
		}

		return exists
	},

	remove_inactive_players: function()
	{
		var	remove = [],
			count = 0,
			now = Util.current_timestamp()

		for (var sid in Server.players)
		{
			if (Server.players.hasOwnProperty(sid) && Server.players[sid].updated + 60 * 5 < now)
			{
				remove.push(sid)
				++count
			}
		}

		for (var i = 0; i < count; i++)
		{
			Server.players[remove[i]].quit()
			delete Server.players[remove[i]]	
		}

		return count
	},

	current_timestamp: function()
	{
		return Math.floor(new Date().getTime() / 1000)
	},

	generate_hit_message: function(who, killed)
	{
		var msg

		if (killed)
			msg = who + ' killed you! Type \'respawn\' to back to the game'
		else
			msg = 'uh oh! ' + who + ' shot you!'

		return Util.colorize('red', msg)
	},

	generate_rename_message: function(old_name, new_name)
	{
		return Util.colorize('lime', old_name + ' changed his name to ' + new_name)
	},

	colorize: function(color, text)
	{
		return '<span style="color:' + color + '">' + text + '</span>'
	}
}

/**
 * Player class
 */
function Player(name)
{
	// Fixed session properties
	this.sid = Util.generate_id()
	this.name = name
	this.room = null
	this.updated = Util.current_timestamp()
	this.renamed_at = 0

	// Game properties
	this.x = null
	this.y = null
	this.direction = null
	this.health = null
	this.total_ammo = null
	this.available_ammo = null
	this.kills = 0
	this.killed = 0
}

Player.prototype.join_room = function(room_name)
{
	this.room = null

	if (typeof(Server.rooms[room_name]) !== 'object')
	{
		this.room = Server.rooms[room_name] = new Room(room_name)

		var y_len = Server.map.length
		var x_len = Server.map[0].length

		for (var y = 0; y < y_len; y++)
		{
			this.room.coordinates[y] = []

			for (var x = 0; x < x_len; x++)
				this.room.coordinates[y][x] = null
		}
	}
	else
	{
		this.room = Server.rooms[room_name]

		if (this.room.players.length >= 5)
		{
			return false
		}
	}

	this.room.add_player(this)
	return this.room.messages.length
}

Player.prototype.rename = function(new_name)
{
	var now = Util.current_timestamp()

	if (Util.player_name_exists(new_name))
	{
		return [false, 'exists']
	}
	else if (now - this.renamed_at < Settings.renaming_interval_limit)
	{
		return [false, 'flood']
	}

	var old_name = this.name

	this.name = new_name
	this.renamed_at = now

	if (this.room !== null)
	{
		this.send_message({'text': Util.generate_rename_message(old_name, new_name), 'sender': this.sid})
	}

	return [true, new_name]
}

Player.prototype.touch = function()
{
	this.updated = Util.current_timestamp()
}

Player.prototype.is_playing = function()
{
	return this.room !== null
}

Player.prototype.fire = function()
{
	var	hit = this.visible_to_me(true),
		result = {killed: [], hit: []},
		ammo_power = 30

	if (this.available_ammo <= 0)
	{
		result.ammo = (player.total_ammo <= 0) ? 'out' : 'reload' 
		return result
	}

	this.available_ammo--

	for (var i = 0, j = hit.length; i < j; i++, ammo_power--)
	{
		this.room.players[hit[i].sid].health -= ammo_power

		var killed = false
		var msg_data = {
			receiver: hit[i].sid,
			text: null
		}

		if (this.room.players[hit[i].sid].health <= 0)
		{
			killed = true

			this.room.players[hit[i].sid].killed++
			this.room.players[hit[i].sid].x = null
			this.room.players[hit[i].sid].y = null

			this.kills++

			this.room.coordinates[hit[i].y][hit[i].x] = ['h', 'a'][Math.floor(Math.random() * 2)]

			result.killed.push(Server.players[hit[i].sid].name)
		}
		else
		{
			result.hit.push(Server.players[hit[i].sid].name)
		}

		msg_data.text = Util.generate_hit_message(this.name, killed)
		this.send_message(msg_data, hit[i].sid)
	}

	return result
}

Player.prototype.turn = function(direction)
{
	direction = direction.toUpperCase()

	if (['N', 'S', 'E', 'W'].indexOf(direction) != -1)
	{
		this.direction = direction
		return true
	}

	return false
}

Player.prototype.turn_around = function()
{
	var opposite = {N: 'S', S: 'N', E: 'W', W: 'E'}
	this.turn(opposite[Rooms.data[Sessions.list[cookies.sid].room].players[cookies.sid].direction])
}

Player.prototype.move = function(direction)
{
	var	success = true,
		x = this.x, y = this.y,
		old_x = this.x, old_y = this.y

	direction = direction.toUpperCase()

	switch (direction)
	{
		case 'N': y--; break;
		case 'S': y++; break;
		case 'E': x++; break;
		case 'W': x--; break;
		default: success = false;
	}

	if (success)
	{
		if (Server.map[y][x] != '#' && !this.room.has_item(x, y, true))
		{
			var msg = ''

			if (this.room.coordinates[y][x] == 'h')
			{
				this.health += 10
				if (this.health > 100) this.health = 100
				msg = 'You\'ve picked a health pack'
			}
			else if (this.room.coordinates[y][x] == 'a')
			{
				this.total_ammo += Settings.gun_max_ammo
				msg = 'You\'ve found ammo'
			}

			this.room.coordinates[old_y][old_x] = null
			this.room.coordinates[y][x] = this
			this.x = x
			this.y = y

			return msg
		}
		else
		{
			return 'You can\'t go in that direction'
		}
	}

	return ''
}

Player.prototype.reload_gun = function(sid)
{
	if (this.available_ammo <= 0 && this.total_ammo <= 0)
		return false

	if (this.available_ammo >= Settings.gun_max_available_ammo)
		return [this.available_ammo, this.total_ammo]

	var diff = Settings.gun_max_available_ammo - this.available_ammo

	if (diff > this.total_ammo)
		diff = this.total_ammo

	this.available_ammo += diff
	this.total_ammo -= diff

	return [this.available_ammo, this.total_ammo]
}

Player.prototype.respawn = function()
{
	if (this.health > 0)
		return false

	var respawn_place = this.room.find_respawn_position()

	this.health = 100
	this.available_ammo = Settings.gun_max_available_ammo
	this.total_ammo = Settings.gun_max_ammo
	this.x = respawn_place.x
	this.y = respawn_place.y
	this.direction = respawn_place.direction

	this.room.coordinates[respawn_place.y][respawn_place.x] = this

	return true
}

Player.prototype.look_map = function()
{
	var	y_len = Server.map.length,
		x_len = Server.map[0].length,
		visible = this.visible_to_me(),
		txt = ''

	visible.push({'x': this.x, 'y': this.y, 'direction': this.direction, 'me': true})

	for (var y = 0; y < y_len; y++)
	{
		for (var x = 0; x < x_len; x++)
		{
			var found = false

			for (var i = 0, j = visible.length; i < j; i++)
			{
				if (x == visible[i].x && y == visible[i].y)
				{
					if (visible[i].item)
					{
						txt += '<span class="item">' + Settings.symbols['I' + visible[i].item.toUpperCase()]
					}
					else
					{
						txt += visible[i].me ? '<span class="me">' : '<span class="enemy">'
						txt += Settings.symbols[visible[i].direction]
					}

					txt += '</span>'

					found = true
					break
				}
			}

			if (!found)
				txt += (Server.map[y][x] == '#') ? '#' : ' '

			txt += ' '
		}

		txt += '\n'
	}

	return txt
}

Player.prototype.visible_to_me = function(only_enemies)
{
	var	y_len = Server.map.length,
		x_len = Server.map[0].length,
		found = [],
		item = null,
		only_enemies = !!only_enemies

	if (this.direction == 'N')
	{
		for (var y = this.y - 1; y > 0 && Server.map[y][this.x] != '#'; --y)
			if (item = this.room.find_item(this.x, y, only_enemies)) found.push(item)
	}
	else if (this.direction == 'S')
	{
		for (var y = this.y + 1; y < y_len && Server.map[y][this.x] != '#'; ++y)
			if (item = this.room.find_item(this.x, y, only_enemies)) found.push(item)
	}
	else if (this.direction == 'E')
	{
		for (var x = this.x + 1; x < x_len && Server.map[this.y][x] != '#'; ++x)
			if (item = this.room.find_item(x, this.y, only_enemies)) found.push(item)
	}
	else if (this.direction == 'W')
	{
		for (var x = this.x - 1; x > 0 && Server.map[this.y][x] != '#'; --x)
		{
			if (item = this.room.find_item(x, this.y, only_enemies)) found.push(item)
		}
	}

	return found
}

Player.prototype.send_message = function(data, receiver)
{
	this.room.messages.push(data)

	if (typeof(receiver) === 'string')
	{
		Server.events.emit(receiver, data)
	}
	else
	{
		for (var sid in this.room.players)
		{
			if (this.room.players[sid] != this.sid)
				Server.events.emit(sid, data)
		}
	}
}

Player.prototype.quit = function()
{
	if (this.room !== null)
	{
		this.room.kick(this.sid)
	}
}

/**
 * Room class
 */
function Room(name)
{
	this.name = name
	this.players = {}
	this.coordinates = []
	this.messages = []
}

Room.prototype.add_player = function(player)
{
	var respawn_place = this.find_respawn_position()

	player.x = respawn_place.x
	player.y = respawn_place.y
	player.direction = respawn_place.direction
	player.health = 100
	player.total_ammo = Settings.gun_max_ammo
	player.available_ammo = Settings.gun_max_available_ammo

	this.players[player.sid] = player
	this.coordinates[respawn_place.y][respawn_place.x] = player
}

Room.prototype.has_player = function(sid)
{
	return typeof(this.players[sid]) !== 'undefined';
}

Room.prototype.kick = function(sid)
{
	if (!this.has_player(sid))
	{
		return false
	}

	if (this.players[sid].x !== null && this.players[sid].y !== null)
	{
		this.coordinates[this.players[sid].y][this.players[sid].x] = null
	}

	this.players[sid].room = null
	this.players[sid].direction = null
	this.players[sid].health = null
	this.players[sid].total_ammo = null
	this.players[sid].available_ammo = null
	this.players[sid].kills = 0
	this.players[sid].killed = 0

	delete this.players[sid]
}

Room.prototype.has_item = function(x, y, only_enemies)
{
	var cond = typeof(this.coordinates[y][x]) !== 'undefined' && this.coordinates[y][x] !== null

	if (only_enemies)
		cond = cond && this.coordinates[y][x].constructor.name == 'Player'

	return cond
}

Room.prototype.find_item = function(x, y, only_enemies)
{
	only_enemies = !!only_enemies

	if (this.has_item(x, y, only_enemies))
	{
		if (this.coordinates[y][x].constructor.name == 'Player')
		{
			return {
				'sid': this.coordinates[y][x].sid,
				'x': x,
				'y': y,
				'direction': this.coordinates[y][x].direction,
				'me': false,
				'item': false
			}
		}
		else if (!only_enemies)
		{
			return {
				'x': x,
				'y': y,
				'me': false,
				'item': this.coordinates[y][x]
			}
		}
	}

	return null
}

Room.prototype.score = function()
{
	var	players_array = [],
		players_count = 0,
		larger_name_length = 0,
		text = ''

	for (var sid in this.players)
	{
		var length = this.players[sid].name.length

		if (length > larger_name_length)
			larger_name_length = length

		players_array.push({'name': this.players[sid].name, 'data': this.players[sid]})
		++players_count
	}

	players_array.sort(function(a, b)
	{
		return (b.data.kills - a.data.kills) + (a.data.killed - b.data.killed)
	})

	text += '+-----'

	var expand = larger_name_length - 3

	if (expand <= 0)
		expand = 1

	for (var i = 0; i < expand; i++) text += '-'
	text += '+-------+--------+\n'
	text += '| Name'
	for (var i = 0; i < expand; i++) text += ' '
	text += '| Score | Deaths |\n+-----'
	for (var i = 0; i < expand; i++) text += '-'
	text += '+-------+--------+\n'

	for (var i = 0; i < players_count; i++)
	{
		text += '| ' + players_array[i].name
		for (var j = 0, k = 4 + expand - players_array[i].name.length; j < k; j++) text += ' '
		text += '| ' + players_array[i].data.kills
		for (var j = 0, k = 6 - players_array[i].data.kills.toString().length; j < k; j++) text += ' '
		text += '| ' + players_array[i].data.killed
		for (var j = 0, k = 7 - players_array[i].data.killed.toString().length; j < k; j++) text += ' '
		text += '|\n'
	}

	text += '+-----'
	for (var i = 0; i < expand; i++) text += '-'
	text += '+-------+--------+\n'

	return text
}

Room.prototype.find_respawn_position = function()
{
	var	count = Server.respawn_places.length,
		index = Math.floor(Math.random() * count)

	for (var i = index; i < count; i++)
	{
		var place = Server.respawn_places[i]

		if (this.is_safe_place(place.x, place.y))
			return place
	}

	for (var i = 0; i < index; i++)
	{
		var place = Server.respawn_places[i]

		if (this.is_safe_place(place.x, place.y))
			return place
	}

	return place
}

Room.prototype.is_safe_place = function(x, y)
{
	var	y_len = Server.map.length,
		x_len = Server.map[0].length

	// North
	for (var _y = y; _y > 0; _y--)
	{
		if (Server.map[_y][x] == '#') break
		if (this.has_item(x, _y, true)) return false
	}

	// South
	for (var _y = y + 1; _y < y_len; _y++)
	{
		if (Server.map[_y][x] == '#') break
		if (this.has_item(x, _y, true)) return false
	}

	// East
	for (var _x = x + 1; _x < x_len; _x++)
	{
		if (Server.map[y][_x] == '#') break
		if (this.has_item(_x, y, true)) return false
	}

	// West
	for (var _x = x - 1; _x > 0; _x--)
	{
		if (Server.map[y][_x] == '#') break
		if (this.has_item(_x, y, true)) return false
	}

	return true
}

/**
 * Long polling ajax for messages
 */
var receive_messages = function(req, res)
{
	var	cookies = {},
		params = url.parse(req.url, true).query

	req.headers.cookie && req.headers.cookie.split(';').forEach(function(cookie)
	{
		var parts = cookie.split('=')
		cookies[parts[0].trim()] = (parts[1] || '').trim()
	})

	if (typeof(cookies.sid) !== 'string' || typeof(Server.players[cookies.sid]) === 'undefined' || Server.players[cookies.sid].room === null)
	{
		res.writeHead(401)
		res.end()
		return
	}

	var player = Server.players[cookies.sid]
	var last = (typeof(params.last) === 'string' && params.last.match(/^[0-9]+$/) && parseInt(params.last) > 0) ? parseInt(params.last) : 0
	var msg = []

	player.touch()

	if (last > player.room.messages.length)
	{
		res.writeHead(401, {'Content-Type': 'text/plain'})
		res.end('last too high')
		return
	}

	var callback, timeout = setTimeout(function()
	{
		Server.events.removeListener(cookies.sid, callback)
		res.writeHead(307, {'Content-Type': 'text/plain'})
		res.end('timeout')
	}, 60 * 1000)

	callback = function()
	{
		for (var i = last; i < player.room.messages.length; i++)
		{
			if ((typeof(player.room.messages[i].sender) !== 'undefined' && player.room.messages[i].sender == cookies.sid) || (typeof(player.room.messages[i].receiver) !== 'undefined' && player.room.messages[i].receiver !== null && player.room.messages[i].receiver != cookies.sid))
			{
				continue
			}

			msg.push(player.room.messages[i].text)
		}

		clearTimeout(timeout)

		res.write(player.room.messages.length + '\n')
		res.end(msg.join('\n'))
	}

	if (last < player.room.messages.length)
		callback()
	else
		Server.events.once(cookies.sid, callback)
}

/**
 * Send commands
 */
var send_command = function(req, res)
{
	var	cookies = {},
		url_data = url.parse(req.url, true),
		params = url_data.query,
		cmd = (typeof(url_data.query.cmd) === 'string') ? url_data.query.cmd.trim().toLowerCase() : ''

	// Read cookies
	req.headers.cookie && req.headers.cookie.split(';').forEach(function(cookie)
	{
		var parts = cookie.split('=')
		cookies[parts[0].trim()] = (parts[1] || '').trim()
	})

	// Check if there's a session
	if (typeof(cookies.sid) !== 'string' || typeof(Server.players[cookies.sid]) === 'undefined')
	{
		var name

		if (typeof(cookies.sid) === 'string' && cookies.sid.length > 0)
		{
			res.writeHead(200, [['Content-Type', 'text/plain'], ['Set-Cookie', 'sid='], ['Set-Cookie', 'in_room=0'], ['Set-Cookie', 'lih=0']])
			res.end(Util.colorize('red', 'It appears you\'ve been kicked for inactivity. Please type your name again.'))
		}
		else if (cmd == '')
		{
			res.writeHead(200, {'Content-Type': 'text/plain', 'Set-Cookie': 'in_room=0'})
			res.end('Type your name')
		}
		else if (cmd.length > 0 && cmd.length < 40)
		{
			if (Util.player_name_exists(cmd))
			{
				res.writeHead(200, {'Content-Type': 'text/plain', 'Set-Cookie': 'in_room=0'})
				res.end('There\'s already someone on the server with that name\nPlease choose another')
			}
			else
			{
				var player = new Player(cmd)
				Server.players[player.sid] = player

				res.writeHead(200, [['Content-Type', 'text/plain'], ['Set-Cookie', 'sid=' + player.sid], ['Set-Cookie', 'in_room=0']])
				res.end('Type the room name')
			}
		}
		else
		{
			res.writeHead(200, {'Content-Type': 'text/plain', 'Set-Cookie': 'in_room=0'})
			res.end('The name length must be between 0 and 40 characters\nType your name')
		}

		return
	}

	var player = Server.players[cookies.sid]
	player.touch()

	// Check if the user is in game
	if (player.room === null)
	{
		if (cmd.length > 0 && cmd.length < 40)
		{
			var enter = player.join_room(cmd)

			if (enter !== false)
			{
				res.writeHead(200, [['Content-Type', 'text/plain'], ['Set-Cookie', 'in_room=1'], ['Set-Cookie', 'lih=' + enter]])
				res.end('You are now in the game. Use the commands to play. :-)')
			}
			else
			{
				res.writeHead(200, [['Content-Type', 'text/plain'], ['Set-Cookie', 'in_room=0'], ['Set-Cookie', 'lih=0']])
				res.end('This room is full.\nType another room name')
			}
		}
		else
		{
			res.writeHead(200, [['Content-Type', 'text/plain'], ['Set-Cookie', 'in_room=0'], ['Set-Cookie', 'lih=0']])
			res.end('Type the room name')
		}

		return
	}

	if (cmd == 'exit' || cmd == 'quit')
	{
		player.quit()
		res.writeHead(200, [['Content-Type', 'text/plain'], ['Set-Cookie', 'in_room=0'], ['Set-Cookie', 'lih=0']]);
		res.end('You\'re now out of the room.\nType the name of the room you want to enter')
		return
	}

	res.writeHead(200, {'Content-Type': 'text/plain', 'Set-Cookie': 'in_room=1'})

	// Commands that the player can use even if it's dead
	if (cmd.match(/^rename .{1,39}$/))
	{
		var change = player.rename(cmd.trim().split(' ').slice(1).join(' '))

		if (change[0])
		{
			res.end('Name changed to ' + change[1])
		}
		else
		{
			res.end(change[1] == 'flood' ? Util.colorize('red', 'Don\'t spam me, bro!') : 'There is another user with that name currently playing')
		}

		return
	}

	if (cmd == 'respawn')
	{
		res.end(player.respawn() ? 'Ok, you\'re back in the game' : 'You are already alive')
		return
	}

	if (cmd == 'score')
	{
		res.end(player.room.score())
		return
	}

	// Check if the player is dead
	if (player.health <= 0)
	{
		res.end('You are dead. Type \'respawn\' to back to the game.')
		return
	}

	// Commands that the player only can use if it's alive
	if (cmd == 'ammo')
	{
		res.end('Ammo: ' + player.available_ammo + '/' + player.total_ammo)
		return
	}

	if (cmd == 'health')
	{
		res.end('Health: ' + player.health + '%')
		return
	}

	if (cmd == 'reload')
	{
		var info = player.reload_gun()

		if (typeof(info) === 'object')
		{
			res.end('You\'ve reloaded. Ammo: ' + info[0] + '/' + info[1])
		}
		else
		{
			res.end('You\'re out of ammo')
		}

		return
	}

	if (cmd == 'fire')
	{
		var info = player.fire()

		if (info.ammo)
		{
			res.end(info.ammo == 'reload' ? 'Reload your gun by typing \'reload\'' : 'You\'re out of ammo')
		}
		else
		{
			if (!info.hit.length && !info.killed.length)
			{
				res.end('You\'ve shot the wall')
			}
			else
			{
				var msg = 'You\'ve'

				if (info.hit.length)
				{
					msg += ' hit ' + info.hit.join(', ')
					if (info.killed.length) msg += ' and'
				}

				if (info.killed.length)
					msg += ' killed ' + info.killed.join(',')

				res.end(msg)
			}
		}

		return
	}

	if (cmd.match(/^turn (north|south|east|west)$/))
	{
		player.turn(cmd.split(' ')[1][0])
		res.end('')
		return
	}

	if (cmd == 'turn around')
	{	
		player.turn_around()
		res.end('')
		return
	}

	if (cmd.match(/^move (north|south|east|west)$/))
	{
		res.end(player.move(cmd.split(' ')[1][0]))
		return
	}

	if (cmd == 'look')
	{
		res.end(player.look_map())
		return
	}

	if (cmd == 'easter egg')
	{
		res.end(' ,--^----------,--------,-----,-------^--,\n | |||||||||   `--------\'     |          O\n `+---------------------------^----------|\n   `\_,-------, _________________________|\n     / XXXXXX /`|     /\n    / XXXXXX /  `\   /\n   / XXXXXX /\______(\n  / XXXXXX /\n / XXXXXX /\n(________(\n `------\'')
	}

	res.end(cmd == '' ? 'You\'re in the game! Use the commands to play.' : 'Unknown action')
}

// Transfer text-based map to array
Server.map = fs.readFileSync('map.txt').toString().trim().split('\n')
Server.respawn_places = []

for (var y = 0; y < Server.map.length; y++)
{
	Server.map[y] = Server.map[y].trim().split('')

	for (var x = 0; x < Server.map[y].length; x++)
	{
		if (Server.map[y][x] != '#' && Server.map[y][x] != ' ')
		{
			Server.respawn_places.push({'x': x, 'y': y, 'direction': Server.map[y][x]})
		}
	}
}

// HTTP Server
Server.http = http.createServer(function(req, res)
{
	var path = url.parse(req.url, true).pathname

	if (path == '/send')
	{
		send_command(req, res)
	}
	else if (path == '/receive')
	{
		receive_messages(req, res)
	}
	else
	{
		if (Server.page === null)
			Server.page = fs.readFileSync('page.html').toString().replace(/<<started_at>>/g, Server.started_at)

		res.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'})
		res.end(Server.page)
	}
})

setInterval(Util.remove_inactive_players, 60 * 1000)

Server.started_at = Util.current_timestamp()
Server.http.listen(Settings.port)

console.log('Server started at localhost:' + Settings.port + ' :-)')