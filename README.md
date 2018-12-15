# Text-based FPS

Text-based FPS node.js experiment made by [Guilherme Sehn](http://www.guisehn.com/) using socket.io. 

[Original game](http://eigen.pri.ee/shooter/) and map made by [Eigen Lenk](http://eigen.pri.ee/).

You can find the old version made in 2013 here on the [`old` branch](https://github.com/guisehn/text-based-fps/tree/old).

## How to install

- `yarn install`
- `node index.js`

There's an instance of the game [running here](https://text-based-fps.herokuapp.com/).

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/guisehn/text-based-fps)

## Editing the map

The game map is generated from the plain text file `map.txt` where:

- `#` represent the walls
- `N`, `S`, `W`, `E` represent the respawn positions where the letters mean the player initial direction (north, south, west or east)

The engine automatically ignores empty lines at the start and end of the map, and also empty spaces after the last wall of the line. You can add a `.` character to circumvent that if you really mean to have those empty spaces.

## Running tests
`yarn test`
