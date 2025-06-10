const state = require("./state");
const gameLoop = require("./gameLoop");
const config = require("./config");
const { logEvent } = require("./utils");

// Set the interval for the game loop in state
function startGameLoop(io) {
  if (!state.gameIntervalId) {
    state.gameIntervalId = setInterval(() => {
      gameLoop(io);
    }, config.tickRate);
    logEvent("Game loop started.");
  }
}

// Clear the interval for the game loop in state
function stopGameLoop() {
  if (state.gameIntervalId) {
    clearInterval(state.gameIntervalId);
    state.gameIntervalId = null;
    logEvent("Game loop stopped.");
  }
}

// Add newly connected player to the set of players in state
// if they're the first player connected, start running the game loop
function handlePlayerConnect(io, socketId) {
  state.connectedPlayers.add(socketId);
  const playersSize = state.connectedPlayers.size;
  logEvent(
    `Player connected: ${socketId} (${playersSize} player${
      playersSize === 1 ? "" : "s"
    } total)`
  );

  if (state.connectedPlayers.size === 1) {
    startGameLoop(io);
  }
}

// Remove a player from the set of players in state
// if they're the last player to leave, stop the game loop and reset state
function handlePlayerDisconnect(socketId) {
  state.connectedPlayers.delete(socketId);
  const playersSize = state.connectedPlayers.size;
  logEvent(
    `Player disconnected: ${socketId} (${playersSize} player${
      playersSize === 1 ? "" : "s"
    } total)`
  );

  if (state.connectedPlayers.size === 0) {
    stopGameLoop();
    state.resetGameState();
  }
}

module.exports = {
  handlePlayerConnect,
  handlePlayerDisconnect,
};
