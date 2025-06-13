import { getTimeRemaining } from "./utils/helpers.js";
import { drawGame, stopGame, drawTimers, drawScoreboard } from "./ui/draw.js";

export function setupSocketHandlers(socket, state) {
  // Get config values from server
  socket.on("config", config => {
    state.initialSpeed = config.initialSpeed;
    state.initialSnakeLength = config.initialSnakeLength;
    state.snakeMaxTargetSize = config.snakeMaxTargetSize;
    state.speedBoostDuration = config.speedBoostDuration;
    state.immunityDuration = config.immunityDuration;
    // update page content
    document.getElementById("speed-boost-duration").textContent = `${Math.round(
      state.speedBoostDuration / 1000
    )}`;
    document.getElementById("immunity-duration").textContent = `${Math.round(
      state.immunityDuration / 1000
    )}`;
  });

  // update local state when server state changes
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
    document.getElementById("start-prompt");
    state.isGameStarted = false;
    document.getElementById("start-prompt").style.display = "block";
    alert("Disconnected from server.");
  });

  // stop the game on gameOver
  socket.on("gameOver", () => {
    stopGame();
  });
}
