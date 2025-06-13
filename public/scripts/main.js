import "./tutorialModal.js";
import {
  createGameElement,
  setElementPosition,
  getSegmentDirection,
  getBodySegmentType,
  getImmunityStatus,
  generatePlayerName,
  resetTimer,
  formatTimerText,
  getTimeRemaining,
  isValidName,
  setNameStatusIcon,
  drawScoreboard,
} from "./helpers.js";
import { state } from "./state.js";

// Connect to socket.io
const socket = io();

// Define HTML elements
const board = document.getElementById("game-board");
const nameInput = document.getElementById("name-input");
const nameStatus = document.getElementById("name-status");
const nameWarning = document.getElementById("name-warning");
const startPrompt = document.getElementById("start-prompt");
const timers = document.getElementById("timers");
const immunityTimer = document.getElementById("immunity-timer");
const speedBoostTimer = document.getElementById("speed-boost-timer");
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

// update to reflect the new game state
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

// stop the game
function stopGame() {
  state.isGameStarted = false;
  startPrompt.style.display = "block";
  tutorialOpenBtn.style.display = "block";
  resetTimer(speedBoostTimer);
  resetTimer(immunityTimer);
  timers.style.display = "none";
}

// draw game elements
function drawGame() {
  board.innerHTML = "";
  drawPlayerSnake();
  drawEnemySnakes();
  drawFood();
  drawSpeedBoost();
  drawImmunity();
}

// draw food on the board
function drawFood() {
  if (state.isGameStarted) {
    const foodElement = createGameElement("div", "food");
    setElementPosition(foodElement, state.food);
    board.appendChild(foodElement);
  }
}

// draw speed boost on the board
function drawSpeedBoost() {
  if (state.isGameStarted) {
    const speedBoostElement = createGameElement("div", "speed-boost");
    setElementPosition(speedBoostElement, state.speedBoost);
    board.appendChild(speedBoostElement);
  }
}

// draw immunity on the board
function drawImmunity() {
  if (state.isGameStarted && state.immunity) {
    const immunityElement = createGameElement("div", "immunity");
    setElementPosition(immunityElement, state.immunity);
    board.appendChild(immunityElement);
  }
}

// draw the players snake
function drawPlayerSnake() {
  if (state.isGameStarted && state.playerSnake) {
    drawSnakeSegments(state.playerSnake, true);
  }
}

// draw the enemy snakes
function drawEnemySnakes() {
  if (state.isGameStarted) {
    state.enemySnakes.forEach(enemy => {
      if (enemy.isAlive) drawSnakeSegments(enemy, false);
    });
  }
}

// draw the segments of a snake
function drawSnakeSegments(snake, isPlayer) {
  const { segments, direction, isImmune } = snake;
  segments.forEach((segment, i) => {
    const snakeElement = createGameElement("div", "snake");
    // Set CSS classes for snake segments
    const immunityStatus = getImmunityStatus(
      state.immunityDuration,
      state.immunityTimeRemaining
    );
    snakeElement.classList.add(
      ...(isPlayer ? [] : ["enemy"]),
      ...(isImmune ? ["immune", immunityStatus] : [])
    );
    if (i === 0) {
      // set the classes for the head segment
      snakeElement.classList.add("head", direction);
    } else if (i === segments.length - 1) {
      // set the classes for the tail segment
      const prevSegment = segments[i - 1];
      const segmentDirection = getSegmentDirection(segment, prevSegment);
      snakeElement.classList.add("tail", segmentDirection);
    } else {
      // determine if the current segment is a corner and/or a target segment
      const prevSegment = segments[i - 1];
      const nextSegment = segments[i + 1];
      const segmentDirection = getSegmentDirection(segment, prevSegment);
      const bodySegmentType = getBodySegmentType(
        segment,
        nextSegment,
        segmentDirection
      );
      const isCorner = bodySegmentType !== "body";
      const targetSize = getSnakeTargetSize(segments);
      const isTarget = i > segments.length - 1 - targetSize;
      // set the classes for the body segments
      snakeElement.classList.add(
        bodySegmentType,
        segmentDirection,
        ...(isCorner ? ["corner"] : []),
        ...(isTarget && !isImmune ? ["target"] : [])
      );
    }
    setElementPosition(snakeElement, segment);
    board.appendChild(snakeElement);
  });
}

// Return the number of target segments a snake should have
function getSnakeTargetSize(segments) {
  /* number of target segments increments for each segment added to the snake
      until the number has reached snakeMaxTargetSize */
  const targetSize =
    segments.length < state.initialSnakeLength + state.snakeMaxTargetSize
      ? segments.length - (state.initialSnakeLength - 1)
      : state.snakeMaxTargetSize;
  return targetSize;
}

// draw player name
function drawName() {
  if (state.isGameStarted) {
    const nameElement = document.getElementById("player-name");
    nameElement.innerHTML = `Playing as: <span>${state.playerName}</span>`;
  }
}

// draw effect timers
function drawTimers() {
  if (state.isGameStarted) {
    if (state.playerSnake.isImmune && state.immunityTimeRemaining > 0) {
      immunityTimer.style.display = "block";
      immunityTimer.textContent = formatTimerText(state.immunityTimeRemaining);
    } else {
      resetTimer(immunityTimer);
    }
    if (
      state.playerSnake.speed !== state.initialSpeed &&
      state.speedBoostTimeRemaining > 0
    ) {
      speedBoostTimer.style.display = "block";
      speedBoostTimer.textContent = formatTimerText(
        state.speedBoostTimeRemaining
      );
    } else {
      resetTimer(speedBoostTimer);
    }
  }
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
