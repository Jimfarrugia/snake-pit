import {
  getSegmentDirection,
  getBodySegmentType,
  createGameElement,
  setElementPosition,
  generatePlayerName,
  isValidName,
  getTimeRemaining,
  formatTimerText,
  resetTimer,
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
let speedBoostTimeRemaining;
let immunity;
let immunityTimeRemaining = 0;
let immunityDuration;
let isGameStarted = false;
let playerSnake = null;
let enemySnakes = [];

// Define HTML elements
const board = document.getElementById("game-board");
const nameInput = document.getElementById("name-input");
const nameWarning = document.getElementById("name-warning");
const startPrompt = document.getElementById("start-prompt");
const timers = document.getElementById("timers");
const immunityTimer = document.getElementById("immunity-timer");
const speedBoostTimer = document.getElementById("speed-boost-timer");
const tutorialCloseBtn = document.getElementById("tutorial-close-btn");
const tutorialOpenBtn = document.getElementById("tutorial-open-btn");
const tutorialDialog = document.getElementById("tutorial-dialog");
const scoreboard = document.getElementById("scoreboard");

// update to reflect the new game state
socket.on("gameState", state => {
  playerSnake = state.snakes.find(s => s.id === socket.id);
  enemySnakes = state.snakes.filter(s => s.id !== socket.id);
  food = state.food;
  initialSpeed = state.initialSpeed;
  speedBoost = state.speedBoost;
  speedBoostTimeRemaining =
    playerSnake.speed !== state.initialSpeed
      ? getTimeRemaining(
          state.speedBoostDuration,
          playerSnake.speedBoostTimeStart
        )
      : 0;
  initialSnakeLength = state.initialSnakeLength;
  snakeMaxTargetSize = state.snakeMaxTargetSize;
  immunity = state.immunity;
  immunityDuration = state.immunityDuration;
  immunityTimeRemaining = playerSnake.isImmune
    ? getTimeRemaining(state.immunityDuration, playerSnake.immunityTimeStart)
    : 0;
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
    { name: playerName.trim(), fallbackName: defaultPlayerName },
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
    snakeElement.classList.add(
      ...(isPlayer ? [] : ["enemy"]),
      ...(isImmune ? ["immune", getImmunityStatus()] : [])
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

// Return a class name for immunity status based on how much time is remaining for the effect
function getImmunityStatus() {
  return immunityTimeRemaining < immunityDuration * 0.125
    ? "critical"
    : immunityTimeRemaining < immunityDuration / 4
    ? "quarter"
    : immunityTimeRemaining < immunityDuration / 2
    ? "half"
    : "full";
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

// draw the scoreboard
function drawScoreboard(players) {
  scoreboard.innerHTML = "";
  // Sort players by the higher of score or kills, then by the lower value as tiebreaker
  players.sort((a, b) => {
    const maxA = Math.max(a.score, a.kills);
    const maxB = Math.max(b.score, b.kills);
    if (maxA !== maxB) return maxB - maxA;
    const minA = Math.min(a.score, a.kills);
    const minB = Math.min(b.score, b.kills);
    return minB - minA;
  });
  // Generate scoreboard elements
  players.forEach((player, index) => {
    if (!player.name) return;
    // Rank and name
    const nameSpan = document.createElement("span");
    nameSpan.className = "scoreboard-name";
    const rankSpan = document.createElement("span");
    rankSpan.textContent = `${index + 1}. `;
    nameSpan.appendChild(rankSpan);
    nameSpan.append(player.name);
    // Stats
    const scoresDiv = document.createElement("div");
    scoresDiv.className = "scores";
    const scoreSpan = document.createElement("span");
    scoreSpan.title = "Score";
    scoreSpan.className = "scoreboard-score";
    scoreSpan.textContent = player.score;
    const killsSpan = document.createElement("span");
    killsSpan.title = "Kills";
    killsSpan.className = "scoreboard-kills";
    killsSpan.textContent = player.kills;
    const deathsSpan = document.createElement("span");
    deathsSpan.title = "Deaths";
    deathsSpan.className = "scoreboard-deaths";
    deathsSpan.textContent = player.deaths;
    // Build the li element & add it to the DOM
    const li = document.createElement("li");
    scoresDiv.appendChild(scoreSpan);
    scoresDiv.appendChild(killsSpan);
    scoresDiv.appendChild(deathsSpan);
    li.appendChild(nameSpan);
    li.appendChild(scoresDiv);
    scoreboard.appendChild(li);
  });
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

// Open/close the tutorial dialog
tutorialOpenBtn.addEventListener("click", () => {
  tutorialDialog.showModal();
});

tutorialCloseBtn.addEventListener("click", () => {
  tutorialDialog.close();
});

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
    if (!isValidName(name)) {
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
