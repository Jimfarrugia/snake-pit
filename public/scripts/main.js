import "./tutorialModal.js";
import { getTimeRemaining } from "./helpers.js";
import { state, socket } from "./state.js";
import { drawGame, stopGame, drawTimers, drawScoreboard } from "./draw.js";
import { setupEventListeners } from "./events.js";

setupEventListeners();

const startPrompt = document.getElementById("start-prompt");
const speedBoostDurationSpan = document.getElementById("speed-boost-duration");
const immunityDurationSpan = document.getElementById("immunity-duration");

// Get config values from server
socket.on("config", config => {
  state.initialSpeed = config.initialSpeed;
  state.initialSnakeLength = config.initialSnakeLength;
  state.snakeMaxTargetSize = config.snakeMaxTargetSize;
  state.speedBoostDuration = config.speedBoostDuration;
  state.immunityDuration = config.immunityDuration;
  // update page content
  speedBoostDurationSpan.textContent = `${Math.round(
    state.speedBoostDuration / 1000
  )}`;
  immunityDurationSpan.textContent = `${Math.round(
    state.immunityDuration / 1000
  )}`;
});

// update to reflect the new game state from server
socket.on("gameState", newState => {
  state.playerSnake = newState.snakes.find(s => s.id === socket.id);
  state.enemySnakes = newState.snakes.filter(s => s.id !== socket.id);
  state.food = newState.food;
  state.immunity = newState.immunity;
  state.speedBoost = newState.speedBoost;
  const { immunityTimeStart, speedBoostTimeStart } = state.playerSnake;
  state.immunityTimeRemaining = getTimeRemaining(
    state.immunityDuration,
    immunityTimeStart
  );
  state.speedBoostTimeRemaining = getTimeRemaining(
    state.speedBoostDuration,
    speedBoostTimeStart
  );
  drawGame();
  drawTimers();
  drawScoreboard(newState.snakes);
});

// disconnect gracefully
socket.on("disconnect", () => {
  state.isGameStarted = false;
  startPrompt.style.display = "block";
  alert("Disconnected from server.");
});

// stop the game on gameOver
socket.on("gameOver", () => {
  stopGame();
});
