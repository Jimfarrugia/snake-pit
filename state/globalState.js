const { createGameState } = require("./stateFactory");
const { mainRoom } = require("../config");

const connectedPlayers = new Set();

const playerSnakes = new Map(); // "socket.id": { Snake }

const gameStates = new Map();
gameStates.set(mainRoom, createGameState());

module.exports = { connectedPlayers, playerSnakes, gameStates };
