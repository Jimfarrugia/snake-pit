const { createGameState } = require("./stateFactory");

const connectedPlayers = new Set();

const playerSnakes = new Map(); // "socket.id": { Snake }

const gameStates = new Map();
gameStates.set("main-game", createGameState());

module.exports = { connectedPlayers, playerSnakes, gameStates };
