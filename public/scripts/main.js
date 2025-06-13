import "./tutorialModal.js";
import {
  generatePlayerName,
  getTimeRemaining,
  isValidName,
  setNameStatusIcon,
} from "./helpers.js";
import { state } from "./state.js";
import {
  drawGame,
  stopGame,
  drawName,
  drawTimers,
  drawScoreboard,
} from "./draw.js";

// Connect to socket.io
const socket = io();

// Define HTML elements
const nameInput = document.getElementById("name-input");
const nameStatus = document.getElementById("name-status");
const nameWarning = document.getElementById("name-warning");
const startPrompt = document.getElementById("start-prompt");
const timers = document.getElementById("timers");
const speedBoostDurationSpan = document.getElementById("speed-boost-duration");
const immunityDurationSpan = document.getElementById("immunity-duration");
const tutorialOpenBtn = document.getElementById("tutorial-open-btn");

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

// start the game
function startGame() {
  state.playerName = nameInput.value;
  socket.emit(
    "joinGame",
    { name: state.playerName, fallbackName: state.defaultPlayerName },
    ({ isValidName, isAvailable, finalName, reservedNames }) => {
      if (state.playerName === state.defaultPlayerName && !isAvailable) {
        state.defaultPlayerName = generatePlayerName(reservedNames);
        nameInput.value = state.defaultPlayerName;
      }
      if (!isValidName || !isAvailable) {
        nameWarning.style.display = "block";
        nameWarning.textContent = `The name you chose was ${
          !isAvailable ? "taken" : "invalid"
        }.  You will be known as `;
        const nameWarningSpan = document.createElement("strong");
        nameWarningSpan.textContent = finalName;
        nameWarning.appendChild(nameWarningSpan);
        nameWarning.append(` until you change it.`);
      } else {
        nameWarning.style.display = "none";
      }
      state.playerName = finalName;
      drawName();
    }
  );
  state.isGameStarted = true;
  startPrompt.style.display = "none";
  tutorialOpenBtn.style.display = "none";
  timers.style.display = "flex";
}

// keypress event handler
function handleKeyPress(event) {
  // Don't do anything if an input element has focus
  const activeElement = document.activeElement;
  if (activeElement.tagName === "INPUT") return;

  const { key } = event;
  const isArrowKey = [
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
  ].includes(key);
  const isSpacebar = key === " ";

  // Prevent scrolling during game
  if ((isArrowKey || isSpacebar) && state.isGameStarted) {
    event.preventDefault();
  }

  // Handle start game
  if (!state.isGameStarted && isSpacebar) {
    event.preventDefault();
    startGame();
    return;
  }

  // Handle change direction
  if (isArrowKey) {
    const direction = key.replace("Arrow", "").toLowerCase();
    socket.emit("changeDirection", direction);
  }
}

// Start button click listener
document
  .getElementById("start-btn")
  .addEventListener("click", () => startGame());

// Listen for keypress
document.addEventListener("keydown", handleKeyPress);

// Generate a default name for the player when the page loads
window.addEventListener("DOMContentLoaded", () => {
  socket.emit(
    "checkNameAvailability",
    { name: state.defaultPlayerName, getReservedNames: true },
    ({ isAvailable, reservedNames }) => {
      if (!isAvailable) {
        state.defaultPlayerName = generatePlayerName(reservedNames);
      }
      nameInput.value = state.defaultPlayerName;
      // Size the input element around the generated text
      const mirror = document.createElement("span");
      mirror.style.visibility = "hidden";
      mirror.style.whiteSpace = "pre";
      mirror.style.font = getComputedStyle(nameInput).font;
      mirror.textContent = nameInput.value;
      document.body.appendChild(mirror);
      nameInput.style.width = `${mirror.offsetWidth + 3}px`;
      mirror.remove();
    }
  );
});

// Validate the name input field as the user types
nameInput.addEventListener("input", () => {
  clearTimeout(state.nameInputDebounceTimer);
  state.nameInputDebounceTimer = setTimeout(() => {
    const name = nameInput.value;
    const isValid = isValidName(name);
    if (!isValid) {
      setNameStatusIcon(isValid, true, nameStatus);
      nameInput.setCustomValidity(
        "Only letters, numbers, spaces, underscores and dashes are allowed."
      );
      nameInput.reportValidity();
      return;
    }
    socket.emit(
      "checkNameAvailability",
      { name, getReservedNames: false },
      ({ isAvailable }) => {
        setNameStatusIcon(true, isAvailable, nameStatus);
        if (!isAvailable) {
          nameInput.setCustomValidity("This name is already taken.");
        } else {
          nameInput.setCustomValidity("");
        }
        nameInput.reportValidity();
      }
    );
  }, 200);
});
window.addEventListener("beforeunload", () =>
  clearTimeout(state.nameInputDebounceTimer)
);

// Pressing enter from the name input starts the game
nameInput.addEventListener("keydown", event => {
  if (event.key === "Enter") startGame();
});
