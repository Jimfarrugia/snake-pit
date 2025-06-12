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

// Connect to socket.io
const socket = io();

// Game variables
let nameInputDebounceTimer;
let defaultPlayerName = generatePlayerName();
let initialSnakeLength;
let snakeMaxTargetSize;
let playerName;
let food;
let initialSpeed;
let speedBoost;
let speedBoostTimeRemaining = 0;
let speedBoostDuration;
let immunity;
let immunityTimeRemaining = 0;
let immunityDuration;
let isGameStarted = false;
let playerSnake = null;
let enemySnakes = [];

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
  initialSpeed = config.initialSpeed;
  initialSnakeLength = config.initialSnakeLength;
  snakeMaxTargetSize = config.snakeMaxTargetSize;
  speedBoostDuration = config.speedBoostDuration;
  immunityDuration = config.immunityDuration;
  // update page content
  speedBoostDurationSpan.textContent = `${Math.round(
    speedBoostDuration / 1000
  )}`;
  immunityDurationSpan.textContent = `${Math.round(immunityDuration / 1000)}`;
});

// update to reflect the new game state
socket.on("gameState", state => {
  playerSnake = state.snakes.find(s => s.id === socket.id);
  enemySnakes = state.snakes.filter(s => s.id !== socket.id);
  food = state.food;
  immunity = state.immunity;
  speedBoost = state.speedBoost;
  const { immunityTimeStart, speedBoostTimeStart } = playerSnake;
  immunityTimeRemaining = getTimeRemaining(immunityDuration, immunityTimeStart);
  speedBoostTimeRemaining = getTimeRemaining(
    speedBoostDuration,
    speedBoostTimeStart
  );
  drawGame();
  drawTimers();
  drawScoreboard(state.snakes);
});

// disconnect gracefully
socket.on("disconnect", () => {
  isGameStarted = false;
  startPrompt.style.display = "block";
  alert("Disconnected from server.");
});

// stop the game on gameOver
socket.on("gameOver", () => {
  stopGame();
});

// start the game
function startGame() {
  playerName = nameInput.value;
  socket.emit(
    "joinGame",
    { name: playerName, fallbackName: defaultPlayerName },
    ({ isValidName, isAvailable, finalName, reservedNames }) => {
      if (playerName === defaultPlayerName && !isAvailable) {
        defaultPlayerName = generatePlayerName(reservedNames);
        nameInput.value = defaultPlayerName;
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
      playerName = finalName;
      drawName();
    }
  );
  isGameStarted = true;
  startPrompt.style.display = "none";
  tutorialOpenBtn.style.display = "none";
  timers.style.display = "flex";
}

// stop the game
function stopGame() {
  isGameStarted = false;
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
  if (isGameStarted) {
    const foodElement = createGameElement("div", "food");
    setElementPosition(foodElement, food);
    board.appendChild(foodElement);
  }
}

// draw speed boost on the board
function drawSpeedBoost() {
  if (isGameStarted) {
    const speedBoostElement = createGameElement("div", "speed-boost");
    setElementPosition(speedBoostElement, speedBoost);
    board.appendChild(speedBoostElement);
  }
}

// draw immunity on the board
function drawImmunity() {
  if (isGameStarted && immunity) {
    const immunityElement = createGameElement("div", "immunity");
    setElementPosition(immunityElement, immunity);
    board.appendChild(immunityElement);
  }
}

// draw the players snake
function drawPlayerSnake() {
  if (isGameStarted && playerSnake) {
    drawSnakeSegments(playerSnake, true);
  }
}

// draw the enemy snakes
function drawEnemySnakes() {
  if (isGameStarted) {
    enemySnakes.forEach(enemy => {
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
      immunityDuration,
      immunityTimeRemaining
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
    segments.length < initialSnakeLength + snakeMaxTargetSize
      ? segments.length - (initialSnakeLength - 1)
      : snakeMaxTargetSize;
  return targetSize;
}

// draw player name
function drawName() {
  if (isGameStarted) {
    const nameElement = document.getElementById("player-name");
    nameElement.innerHTML = `Playing as: <span>${playerName}</span>`;
  }
}

// draw effect timers
function drawTimers() {
  if (isGameStarted) {
    if (playerSnake.isImmune && immunityTimeRemaining > 0) {
      immunityTimer.style.display = "block";
      immunityTimer.textContent = formatTimerText(immunityTimeRemaining);
    } else {
      resetTimer(immunityTimer);
    }
    if (playerSnake.speed !== initialSpeed && speedBoostTimeRemaining > 0) {
      speedBoostTimer.style.display = "block";
      speedBoostTimer.textContent = formatTimerText(speedBoostTimeRemaining);
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
  if ((isArrowKey || isSpacebar) && isGameStarted) {
    event.preventDefault();
  }

  // Handle start game
  if (!isGameStarted && isSpacebar) {
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
    { name: defaultPlayerName, getReservedNames: true },
    ({ isAvailable, reservedNames }) => {
      if (!isAvailable) {
        defaultPlayerName = generatePlayerName(reservedNames);
      }
      nameInput.value = defaultPlayerName;
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
  clearTimeout(nameInputDebounceTimer);
  nameInputDebounceTimer = setTimeout(() => {
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
  clearTimeout(nameInputDebounceTimer)
);

// Pressing enter from the name input starts the game
nameInput.addEventListener("keydown", event => {
  if (event.key === "Enter") startGame();
});
