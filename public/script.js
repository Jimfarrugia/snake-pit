import {
  getSegmentDirection,
  getBodySegmentType,
  createGameElement,
  setElementPosition,
  generatePlayerName,
  isValidName,
} from "./helpers.js";

// Connect to socket.io
const socket = io();

// Game variables
const defaultPlayerName = generatePlayerName();
let initialSnakeLength;
let snakeMaxTargetSize;
let playerName;
let food;
let speedBoost;
let isGameStarted = false;
let playerSnake = null;
let enemySnakes = [];

// Define HTML elements
const board = document.getElementById("game-board");
const nameInput = document.getElementById("name-input");
const startPrompt = document.getElementById("start-prompt");
const tutorialCloseBtn = document.getElementById("tutorial-close-btn");
const tutorialOpenBtn = document.getElementById("tutorial-open-btn");
const tutorialDialog = document.getElementById("tutorial-dialog");
const scoreboard = document.getElementById("scoreboard");

// update to reflect the new game state
socket.on("gameState", state => {
  playerSnake = state.snakes.find(s => s.id === socket.id);
  enemySnakes = state.snakes.filter(s => s.id !== socket.id);
  food = state.food;
  speedBoost = state.speedBoost;
  initialSnakeLength = state.initialSnakeLength;
  snakeMaxTargetSize = state.snakeMaxTargetSize;
  drawGame();
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
  playerName = isValidName(nameInput.value)
    ? nameInput.value
    : defaultPlayerName;
  socket.emit("joinGame", { name: playerName.trim() });
  isGameStarted = true;
  drawName();
  startPrompt.style.display = "none";
}

// stop the game
function stopGame() {
  isGameStarted = false;
  startPrompt.style.display = "block";
}

// draw game elements
function drawGame() {
  board.innerHTML = "";
  drawPlayerSnake();
  drawEnemySnakes();
  drawFood();
  drawSpeedBoost();
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
  const { segments, direction } = snake;

  segments.forEach((segment, i) => {
    const snakeElement = createGameElement("div", "snake");
    // Set CSS classes for snake segments
    if (i === 0) {
      // set the classes for the head segment
      snakeElement.className = `snake head ${direction} ${
        isPlayer ? "" : "enemy"
      }`.trim();
    } else if (i === segments.length - 1) {
      // set the classes for the tail segment
      const prevSegment = segments[i - 1];
      const segmentDirection = getSegmentDirection(segment, prevSegment);
      snakeElement.className = `snake tail ${segmentDirection} ${
        isPlayer ? "" : "enemy"
      }`.trim();
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
      const classNames = `${bodySegmentType} ${segmentDirection} ${
        isCorner ? "corner" : ""
      } ${isTarget ? "target" : ""} ${isPlayer ? "" : "enemy"}`.trim();
      snakeElement.className = `snake ${classNames}`;
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
    const li = document.createElement("li");
    const nameSpan = document.createElement("span");
    nameSpan.className = "scoreboard-name";
    nameSpan.innerHTML = `<span>${index + 1}.</span> ${player.name}`;
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
});

// Validate the name input field as the user types
nameInput.addEventListener("input", event => {
  if (!isValidName(nameInput.value)) {
    nameInput.setCustomValidity(
      "Only letters, spaces and numbers are allowed."
    );
    nameInput.reportValidity();
  } else {
    nameInput.setCustomValidity("");
  }
});
