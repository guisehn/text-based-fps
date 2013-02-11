Text-based FPS
==============
Text-based FPS node.js experiment made by [Guilherme Sehn](http://www.guisehn.com/). This is a free-time project, so it may have some bugs. =P

[Original game](http://eigen.pri.ee/shooter/) and map made by [Eigen Lenk](http://eigen.pri.ee/).

Structure
---------
- `fps.js`: the server-side javascript file which contains the game logic
- `page.html`: contains all the client-side code
- `map.txt`: the game map

How to run
----------
Clone/download text-based-fps from [github](https://github.com/ghsehn/text-based-fps), then run `node fps.js` to start the server.

You will need to have [node.js](http://nodejs.org/) installed. You can optionally use [nodejitsu/forever](https://github.com/nodejitsu/forever) CLI tool to maintain the server online even when you close the SSH session. 

There's a running example [here](http://69.55.60.188:1337/).