/**
 * Text-based FPS node.js experiment
 * Developed by Guilherme Henrique Sehn
 * Original game by Eigen Lenk
 */

var	port = 1337,
	http = require('http'),
	url = require('url'),
	fs = require('fs'),
	util = require('util'),
	events = new (require('events').EventEmitter),
	page = null,
	started_at = null

/**
 * Transfer text-based map to array
 */
var map = fs.readFileSync('map.txt').toString().trim().split('\n')
var respawn_places = []

for (var y = 0; y < map.length; y++)
{
	map[y] = map[y].trim().split('')

	for (var x = 0; x < map[y].length; x++)
	{
		if (map[y][x] != '#' && map[y][x] != ' ')
		{
			respawn_places.push({'x': x, 'y': y, 'direction': map[y][x]})
		}
	}
}

/**
 * User sessions
 */
var Sessions = {
	list: [],
	remove_inactive_timer: null,

	create: function(name)
	{
		if (this.name_exists(name)) return false

		if (this.remove_inactive_timer === null)
		{
			this.remove_inactive_timer = setInterval(function() { Sessions.remove_inactive() }, 60 * 1000)
		}

		var id = this.generate_id()
		this.list[id] = {'name': name, 'updated': this.curr_timestamp(), 'room': null}
		return id
	},

	change_name: function(sid, new_name)
	{
		if (this.name_exists(new_name)) return false

		var old_name = this.list[sid].name
		this.list[sid].name = new_name

		if (this.list[sid].room !== null)
		{
			var room = Rooms.data[this.list[sid].room]
			var data = {'text': Messages.rename(old_name, new_name), 'sender': sid}

			room.messages.push(data)
			room.messages_length++

			for (var _sid in room.players)
			{
				if (room.players.hasOwnProperty(_sid) && _sid != sid)
					events.emit(_sid, data)
			}
		}

		return new_name
	},

	name_exists: function(name)
	{
		var exists = false

		for (var i in this.list)
		{
			if (this.list[i].name == name)
			{
				exists = true
				break
			}
		}

		return exists
	},

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

		return id + this.curr_timestamp()
	},

	exists: function(id)
	{
		if (typeof(this.list[id]) === 'object')
		{
			this.touch(id)
			return true
		}

		return false
	},

	touch: function(id)
	{
		this.list[id].updated = this.curr_timestamp()
	},

	curr_timestamp: function()
	{
		return Math.floor(new Date().getTime() / 1000)
	},

	destroy: function(sid)
	{
		if (Sessions.list[sid].room !== null)
			Rooms.kick_player(sid)

		delete this.list[sid]
	},

	remove_inactive: function()
	{
		var	remove = [],
			count = 0

		for (var key in this.list)
		{
			if (this.list.hasOwnProperty(key) && this.list[key].updated + 60 * 5 < this.curr_timestamp())
			{
				remove.push(key)
				++count
			}
		}

		for (var i = 0; i < count; i++)
		{
			this.destroy(remove[i])
		}

		return count
	}
}

/**
 * Rooms
 * Most game logic is inside here
 */
var Rooms = {
	data: {},
	symbols: {N: '▲', S: '▼', E: '►', W: '◄', IH: '+', IA: '¶'},
	gun_max_available_ammo: 8,
	gun_max_ammo: 24,

	enter: function(sid, name)
	{
		if (typeof(this.data[name]) !== 'object')
		{
			this.data[name] = {
				'players': {},
				'coords': [],
				'messages': [],
				'messages_length': 0,
			}

			var y_len = map.length
			var x_len = map[0].length

			for (var y = 0; y < y_len; y++)
			{
				this.data[name].coords[y] = []

				for (var x = 0; x < x_len; x++)
					this.data[name].coords[y][x] = null
			}
		}
		else if (this.data[name].players.length >= 5)
		{
			return false
		}

		var respawn_place = this.find_respawn_position(name)

		this.data[name].players[sid] = {
			'kills': 0,
			'killed': 0,
			'health': 100,
			'available_ammo': this.gun_max_available_ammo,
			'total_ammo': this.gun_max_ammo,
			'x': respawn_place.x,
			'y': respawn_place.y,
			'direction': respawn_place.direction
		}

		this.data[name].coords[respawn_place.y][respawn_place.x] = sid
		Sessions.list[sid].room = name

		return this.data[name].messages_length
	},

	fire: function(sid)
	{
		var	sess = Sessions.list[sid],
			room = this.data[sess.room]
			player = room.players[sid],
			hit = this.visible(sid, true),
			result = {killed: [], hit: []},
			ammo_power = 30

		if (player.available_ammo <= 0)
		{
			result.ammo = (player.total_ammo <= 0) ? 'out' : 'reload' 
			return result
		}

		player.available_ammo--

		for (var i = 0, j = hit.length; i < j; i++, ammo_power--)
		{
			room.players[hit[i].sid].health -= ammo_power

			var killed = false
			var msg_data = {
				receiver: hit[i].sid,
				text: null
			}

			if (room.players[hit[i].sid].health <= 0)
			{
				killed = true

				room.players[hit[i].sid].killed++
				room.players[hit[i].sid].x = null
				room.players[hit[i].sid].y = null

				room.players[sid].kills++

				room.coords[hit[i].y][hit[i].x] = ['h', 'a'][Math.floor(Math.random() * 2)]

				result.killed.push(Sessions.list[hit[i].sid].name)
			}
			else
			{
				result.hit.push(Sessions.list[hit[i].sid].name)
			}

			msg_data.text = Messages.hit(Sessions.list[sid].name, killed)

			room.messages.push(msg_data)
			room.messages_length++

			events.emit(hit[i].sid, msg_data)
		}

		return result
	},

	reload_gun: function(sid)
	{
		var player = this.get_player_data(sid)

		if (player.available_ammo <= 0 && player.total_ammo <= 0)
			return false

		if (player.available_ammo >= this.gun_max_available_ammo)
			return [player.available_ammo, player.total_ammo]

		var diff = this.gun_max_available_ammo - player.available_ammo

		if (diff > player.total_ammo)
			diff = player.total_ammo

		player.available_ammo += diff
		player.total_ammo -= diff

		return [player.available_ammo, player.total_ammo]
	},

	turn: function(sid, direction)
	{
		direction = direction.toUpperCase()

		if (['N', 'S', 'E', 'W'].indexOf(direction) != -1)
		{
			this.data[Sessions.list[sid].room].players[sid].direction = direction
			return true
		}

		return false
	},

	move: function(sid, direction)
	{
		var	sess = Sessions.list[sid],
			room = this.data[sess.room]
			player = room.players[sid],
			success = true,
			x = player.x, y = player.y,
			old_x = player.x, old_y = player.y

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
			if (map[y][x] != '#' && !this.has_item(sess.room, x, y, true))
			{
				var msg = ''

				if (room.coords[y][x] == 'h')
				{
					player.health += 10
					if (player.health > 100) player.health = 100
					msg = 'You\'ve picked a health pack'
				}
				else if (room.coords[y][x] == 'a')
				{
					player.total_ammo += this.gun_max_ammo
					msg = 'You\'ve found ammo'
				}

				room.coords[old_y][old_x] = null
				room.coords[y][x] = sid

				player.x = x
				player.y = y

				return msg
			}
			else
			{
				return 'You can\'t go in that direction'
			}
		}

		return ''
	},

	respawn: function(sid)
	{
		if (this.data[Sessions.list[sid].room].players[sid].health > 0)
			return false

		var room = Sessions.list[sid].room
		var respawn_place = this.find_respawn_position(room)

		this.data[room].players[sid].health = 100
		this.data[room].players[sid].available_ammo = this.gun_max_available_ammo
		this.data[room].players[sid].total_ammo = this.gun_max_ammo
		this.data[room].players[sid].x = respawn_place.x
		this.data[room].players[sid].y = respawn_place.y
		this.data[room].players[sid].direction = respawn_place.direction

		this.data[room].coords[respawn_place.y][respawn_place.x] = sid

		return true
	},

	score: function(sid)
	{
		var	room = this.data[Sessions.list[sid].room],
			players = room.players,
			players_array = [],
			players_count = 0,
			larger_name_length = 0,
			text = ''

		for (var psid in players)
		{
			var data = Sessions.list[psid],
				length = data.name.length

			if (length > larger_name_length)
				larger_name_length = length

			players_array.push({'name': data.name, 'data': this.get_player_data(psid)})
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
	},

	look_map: function(sid)
	{
		var	y_len = map.length,
			x_len = map[0].length,
			txt = '',
			visible = this.visible(sid),
			room = this.data[Sessions.list[sid].room],
			player = room.players[sid]

		visible.push({'x': player.x, 'y': player.y, 'direction': player.direction, 'me': true})

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
							txt += '<span class="item">' + this.symbols['I' + visible[i].item.toUpperCase()]
						}
						else
						{
							txt += visible[i].me ? '<span class="me">' : '<span class="enemy">'
							txt += this.symbols[visible[i].direction]
						}

						txt += '</span>'

						found = true
						break
					}
				}

				if (!found)
					txt += (map[y][x] == '#') ? '#' : ' '

				txt += ' '
			}

			txt += '\n'
		}

		return txt
	},

	visible: function(sid, only_enemies)
	{
		var	y_len = map.length,
			x_len = map[0].length,
			found = [],
			room = Rooms.data[Sessions.list[sid].room],
			player = room.players[sid],
			item = null,
			only_enemies = !!only_enemies

		if (player.direction == 'N')
		{
			for (var y = player.y - 1; y > 0 && map[y][player.x] != '#'; --y)
				if (item = this.find_item(Sessions.list[sid].room, player.x, y, only_enemies)) found.push(item)
		}
		else if (player.direction == 'S')
		{
			for (var y = player.y + 1; y < y_len && map[y][player.x] != '#'; ++y)
				if (item = this.find_item(Sessions.list[sid].room, player.x, y, only_enemies)) found.push(item)
		}
		else if (player.direction == 'E')
		{
			for (var x = player.x + 1; x < x_len && map[player.y][x] != '#'; ++x)
				if (item = this.find_item(Sessions.list[sid].room, x, player.y, only_enemies)) found.push(item)
		}
		else if (player.direction == 'W')
		{
			for (var x = player.x - 1; x > 0 && map[player.y][x] != '#'; --x)
			{
				if (item = this.find_item(Sessions.list[sid].room, x, player.y, only_enemies)) found.push(item)
			}
		}

		return found
	},

	/**
	 * Get player data
	 */
	get_player_data: function(sid)
	{
		return Rooms.data[Sessions.list[sid].room].players[sid]
	},

	/**
	 * Check if there is any enemy in a coordinate
	 */
	has_item: function(room, x, y, only_enemies)
	{
		var cond = typeof(this.data[room].coords[y][x]) !== 'undefined' && this.data[room].coords[y][x] != null

		if (only_enemies)
		{
			return cond && ['h', 'a'].indexOf(this.data[room].coords[y][x]) == -1
		}

		return cond
	},

	/**
	 * Return enemy data if it's in the referred coordinate
	 */
	find_item: function(room, x, y, only_enemies)
	{
		only_enemies = !!only_enemies

		if (this.has_item(room, x, y, only_enemies))
		{
			if (['h', 'a'].indexOf(this.data[room].coords[y][x]) == -1)
			{
				return {
					'sid': this.data[room].coords[y][x],
					'x': x,
					'y': y,
					'direction': this.data[room].players[this.data[room].coords[y][x]].direction,
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
					'item': this.data[room].coords[y][x]
				}
			}
		}

		return null
	},

	/**
	 * Finds a respawn position for the player
	 */
	find_respawn_position: function(room)
	{
		var	count = respawn_places.length,
			index = Math.floor(Math.random() * count)

		for (var i = index; i < count; i++)
		{
			var place = respawn_places[i]

			if (this.is_safe_place(room, place.x, place.y))
				return place
		}

		for (var i = 0; i < index; i++)
		{
			var place = respawn_places[i]

			if (this.is_safe_place(room, place.x, place.y))
				return place
		}

		return place
	},

	/**
	 * Check if a coordinate is safe by checking if there is any user on the adjacent lines
	 */
	is_safe_place: function(room, x, y)
	{
		var	y_len = map.length,
			x_len = map[0].length

		// North
		for (var _y = y; _y > 0; _y--)
		{
			if (map[_y][x] == '#') break
			if (this.has_item(room, x, _y, true)) return false
		}

		// South
		for (var _y = y + 1; _y < y_len; _y++)
		{
			if (map[_y][x] == '#') break
			if (this.has_item(room, x, _y, true)) return false
		}

		// East
		for (var _x = x + 1; _x < x_len; _x++)
		{
			if (map[y][_x] == '#') break
			if (this.has_item(room, _x, y, true)) return false
		}

		// West
		for (var _x = x - 1; _x > 0; _x--)
		{
			if (map[y][_x] == '#') break
			if (this.has_item(room, _x, y, true)) return false
		}

		return true
	},

	/**
	 * Kick a player out of the room.
	 * If it is the only player in that room, the room is destroyed.
	 */
	kick_player: function(sid)
	{
		var	player = Sessions.list[sid],
			room = Rooms.data[Sessions.list[sid].room],
			count = 0

		for (var key in room.players)
		{
			if (room.players.hasOwnProperty(key)) ++count
		}

		if (count > 1)
		{
			if (room.players[sid].x !== null && room.players[sid].y !== null)
				room.coords[room.players[sid].y][room.players[sid].x] = null

			delete room.players[sid]
		}
		else
		{
			delete room
		}
	}
}

/**
 * Message generator
 */
var Messages = {
	hit: function(who, killed)
	{
		var msg

		if (killed)
			msg = who + ' killed you! Type \'respawn\' to back to the game'
		else
			msg = 'uh oh! ' + who + ' shot you!'

		return this.colorize('red', msg)
	},

	rename: function(old_name, new_name)
	{
		return this.colorize('lime', old_name + ' changed his name to ' + new_name)
	},

	colorize: function(color, text)
	{
		return '<span style="color:' + color + '">' + text + '</span>'
	}
};

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

	if (typeof(cookies.sid) !== 'string' || !Sessions.exists(cookies.sid) || Sessions.list[cookies.sid].room === null)
	{
		res.writeHead(401)
		res.end()
		return
	}

	var last = (typeof(params.last) === 'string' && params.last.match(/^[0-9]+$/) && parseInt(params.last) > 0) ? parseInt(params.last) : 0
	var room = Rooms.data[Sessions.list[cookies.sid].room]
	var msg = []

	if (last > room.messages_length)
	{
		res.writeHead(401, {'Content-Type': 'text/plain'})
		res.end('last too high')
		return
	}

	var callback, timeout = setTimeout(function()
	{
		events.removeListener(cookies.sid, callback)
		res.writeHead(307, {'Content-Type': 'text/plain'})
		res.end('timeout')
	}, 60 * 1000)

	callback = function()
	{
		for (var i = last; i < room.messages_length; i++)
		{
			if ((typeof(room.messages[i].sender) !== 'undefined' && room.messages[i].sender == cookies.sid) || (typeof(room.messages[i].receiver) !== 'undefined' && room.messages[i].receiver !== null && room.messages[i].receiver != cookies.sid))
			{
				continue
			}

			msg.push(room.messages[i].text)
		}

		clearTimeout(timeout)

		res.write(room.messages_length + '\n')
		res.end(msg.join('\n'))
	}

	if (last < room.messages_length)
		callback()
	else
		events.once(cookies.sid, callback)
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
	if (typeof(cookies.sid) !== 'string' || !Sessions.exists(cookies.sid))
	{
		var name

		if (cmd == '')
		{
			res.writeHead(200, {'Content-Type': 'text/plain', 'Set-Cookie': 'in_room=0'})
			res.end('Type your name')
		}
		else if (cmd.length > 0 && cmd.length < 40)
		{
			var sess = Sessions.create(cmd)

			if (sess === false)
			{
				res.writeHead(200, {'Content-Type': 'text/plain', 'Set-Cookie': 'in_room=0'})
				res.end('There\'s already someone on the server with that name\nPlease choose another')
			}
			else
			{
				res.writeHead(200, [['Content-Type', 'text/plain'], ['Set-Cookie', 'sid=' + sess], ['Set-Cookie', 'in_room=0']])
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

	var sess = Sessions.list[cookies.sid]
	var room = sess.room

	// Check if the user is in game
	if (room === null)
	{
		if (cmd.length > 0 && cmd.length < 40)
		{
			var enter = Rooms.enter(cookies.sid, cmd)

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
		Rooms.kick_player(cookies.sid)
		Sessions.list[cookies.sid].room = null

		res.writeHead(200, [['Content-Type', 'text/plain'], ['Set-Cookie', 'in_room=0'], ['Set-Cookie', 'lih=0']]);
		res.end('You\'re now out of the room.\nType the name of the room you want to enter')
		return
	}

	res.writeHead(200, {'Content-Type': 'text/plain', 'Set-Cookie': 'in_room=1'})

	// Commands that the player can use even if it's dead
	if (cmd.match(/^rename .{1,39}$/))
	{
		var change = Sessions.change_name(cookies.sid, cmd.trim().split(' ').slice(1).join(' '))
		res.end(change !== false ? 'Name changed to ' + change : 'There is another user with that name currently playing')
		return
	}

	if (cmd == 'respawn')
	{
		res.end(Rooms.respawn(cookies.sid) ? 'Ok, you\'re back in the game' : 'You are already alive')
		return
	}

	if (cmd == 'score')
	{
		res.end(Rooms.score(cookies.sid))
		return
	}

	// Check if the player is dead
	if (Rooms.data[room].players[cookies.sid].health <= 0)
	{
		res.end('You are dead. Type \'respawn\' to back to the game.')
		return
	}

	// Commands that the player only can use if it's alive
	if (cmd == 'ammo')
	{
		var player = Rooms.get_player_data(cookies.sid)
		res.end('Ammo: ' + player.available_ammo + '/' + player.total_ammo)
		return
	}

	if (cmd == 'health')
	{
		res.end('Health: ' + Rooms.get_player_data(cookies.sid).health + '%')
		return
	}

	if (cmd == 'reload')
	{
		var info = Rooms.reload_gun(cookies.sid)

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
		var info = Rooms.fire(cookies.sid)

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
		Rooms.turn(cookies.sid, cmd.split(' ')[1][0])
		res.end('')
		return
	}

	if (cmd == 'turn around')
	{
		var turn = {N: 'S', S: 'N', E: 'W', W: 'E'}
		var dir = turn[Rooms.data[Sessions.list[cookies.sid].room].players[cookies.sid].direction]		

		Rooms.turn(cookies.sid, dir)
		res.end('')

		return
	}

	if (cmd.match(/^move (north|south|east|west)$/))
	{
		res.end(Rooms.move(cookies.sid, cmd.split(' ')[1][0]))
		return
	}

	if (cmd == 'look')
	{
		res.end(Rooms.look_map(cookies.sid))
		return
	}

	if (cmd == 'easter egg')
	{
		res.end(' ,--^----------,--------,-----,-------^--,\n | |||||||||   `--------\'     |          O\n `+---------------------------^----------|\n   `\_,-------, _________________________|\n     / XXXXXX /`|     /\n    / XXXXXX /  `\   /\n   / XXXXXX /\______(\n  / XXXXXX /\n / XXXXXX /\n(________(\n `------\'')
	}

	res.end(cmd == '' ? 'You\'re in the game! Use the commands to play.' : 'Unknown action')
}

/**
 * HTTP server
 */
var server = http.createServer(function(req, res)
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
		if (page === null)
			page = fs.readFileSync('page.html').toString().replace(/<<started_at>>/g, started_at)

		res.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'})
		res.end(page)
	}
})

started_at = Sessions.curr_timestamp()
server.listen(port)
console.log('Server started at localhost:' + port + ' :-)')