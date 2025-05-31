import {
  getSegmentDirection,
  getBodySegmentType,
  createGameElement,
  setElementPosition,
} from "./helpers.js";

// Connect to socket.io
const socket = io();

// Game variables
const snakeTargetSize = 3;
let food;
let speedBoost;
let isGameStarted = false;
let playerSnake = null;
let enemySnakes = [];

// Define HTML elements
const board = document.getElementById("game-board");
const startPrompt = document.getElementById("start-prompt");
const snakeElements = document.getElementsByClassName("snake");
const tutorialCloseBtn = document.getElementById("tutorial-close-btn");
const tutorialOpenBtn = document.getElementById("tutorial-open-btn");
const tutorialDialog = document.getElementById("tutorial-dialog");

// update to reflect the new game state
socket.on("gameState", data => {
  playerSnake = data.snakes.find(s => s.id === socket.id);
  enemySnakes = data.snakes.filter(s => s.id !== socket.id);
  food = data.food;
  speedBoost = data.speedBoost;
  draw();
  setSnakeClassNames();
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
    enemySnakes.forEach(enemy => drawSnakeSegments(enemy, false));
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
      const isTarget = i > segments.length - 1 - snakeTargetSize;
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

// draw game elements
function draw() {
  board.innerHTML = "";
  drawPlayerSnake();
  drawEnemySnakes();
  drawFood();
  drawSpeedBoost();
}

// start the game
function startGame() {
  socket.emit("joinGame");
  isGameStarted = true;
  startPrompt.style.display = "none";
}

// stop the game
function stopGame() {
  isGameStarted = false;
  startPrompt.style.display = "block";
}

// keypress event handler
function handleKeyPress(event) {
  if (
    (!isGameStarted && event.code === "Space") ||
    (!isGameStarted && event.key === " ")
  ) {
    startGame();
  } else {
    switch (event.key) {
      case "ArrowUp":
        socket.emit("changeDirection", "up");
        break;
      case "ArrowDown":
        socket.emit("changeDirection", "down");
        break;
      case "ArrowLeft":
        socket.emit("changeDirection", "left");
        break;
      case "ArrowRight":
        socket.emit("changeDirection", "right");
        break;
    }
  }
}

// Listen for keypress
document.addEventListener("keydown", handleKeyPress);

// Open/close the tutorial dialog
tutorialOpenBtn.addEventListener("click", () => {
  tutorialDialog.showModal();
});

tutorialCloseBtn.addEventListener("click", () => {
  tutorialDialog.close();
});
