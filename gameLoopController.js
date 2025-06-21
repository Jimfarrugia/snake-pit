const { connectedPlayers } = require("./state/globalState");
const gameLoop = require("./gameLoop");
const { tickRate } = require("./config");
const { logEvent } = require("./utils");

// Set the interval for the game loop in state
function startGameLoop(io, room, state) {
  if (!state.gameIntervalId) {
    state.gameIntervalId = setInterval(() => {
      gameLoop(io, room, state);
    }, tickRate);
    logEvent(`Game loop started for room: ${room}`);
  }
}

// Clear the interval for the game loop in state
function stopGameLoop(room, state) {
  if (state?.gameIntervalId) {
    clearInterval(state.gameIntervalId);
    state.gameIntervalId = null;
    logEvent(`Game loop stopped for room: ${room}`);
  }
}

// Add newly connected player to the set of players in state
// if they're the first player connected, start running the game loop
function handlePlayerConnect(io, socketId, mainState) {
  connectedPlayers.add(socketId);
  logEvent(`Player connected: ${socketId} (${connectedPlayers.size} total)`);
  if (connectedPlayers.size === 1) {
    startGameLoop(io, "main-game", mainState);
  }
}

// Remove a player from the set of players in state
// if they're the last player to leave, stop the game loop and reset state
function handlePlayerDisconnect(socketId, mainState) {
  logEvent(
    `Player disconnected: ${socketId} (${connectedPlayers.size} remaining)`
  );
  connectedPlayers.delete(socketId);
  if (connectedPlayers.size === 0) {
    stopGameLoop("main-game", mainState);
    mainState.resetGameState();
  }
}

module.exports = {
  startGameLoop,
  stopGameLoop,
  handlePlayerConnect,
  handlePlayerDisconnect,
};
