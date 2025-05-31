import {
  gridSize,
  initialSnakeLength,
  initialSpeed,
  speedBoostDuration,
  speedBoostMultiplier,
  snakeTargetSize,
} from "./config.js";
import {
  randomOrientation,
  randomPosition,
  getSegmentDirection,
  getBodySegmentType,
  createGameElement,
  setElementPosition,
  setInitialDirection,
} from "./helpers.js";

// Define game variables
let initialOrientation = randomOrientation(); // orientation of the snake when it spawns ("horizontal" or "vertical")
let initialSnakeSegments = generateSnakeSegments();
let snake = {
  segments: initialSnakeSegments,
  direction: setInitialDirection(initialSnakeSegments[0], initialOrientation),
  speed: initialSpeed,
  moveInterval: null,
  speedBoostTimeout: null,
  score: 0,
  highScore: 0,
};
let food = randomPosition();
let speedBoost = randomPosition();
let isGameStarted = false;

// Define HTML elements
const board = document.getElementById("game-board");
const startPrompt = document.getElementById("start-prompt");
const snakeElements = document.getElementsByClassName("snake");
const tutorialCloseBtn = document.getElementById("tutorial-close-btn");
const tutorialOpenBtn = document.getElementById("tutorial-open-btn");
const tutorialDialog = document.getElementById("tutorial-dialog");

// assign the snake a random position on the board
function generateSnakeSegments() {
  const head = randomPosition();
  let segments = [head];
  const isVertical = initialOrientation === "vertical";
  const linearAxis = isVertical ? "y" : "x"; // the axis along which the snake extends
  const perpendicularAxis = isVertical ? "x" : "y"; // orthogonal to the linear axis
  const headLinear = head[linearAxis];
  /* the segments trail in either the positive or negative direction of the linear access
      depending on which side of the board the head is placed on. */
  const trailingDirection = headLinear >= gridSize / 2 ? -1 : 1;
  for (let i = 1; i < initialSnakeLength; i++) {
    const segment = {
      [linearAxis]: head[linearAxis] + i * trailingDirection,
      [perpendicularAxis]: head[perpendicularAxis],
    };
    segments.push(segment);
  }
  return segments;
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

// draw the snake on the board
function drawSnake() {
  if (isGameStarted) {
    snake.segments.forEach(segment => {
      const snakeElement = createGameElement("div", "snake");
      setElementPosition(snakeElement, segment);
      board.appendChild(snakeElement);
    });
  }
}

// draw game elements
function draw() {
  board.innerHTML = "";
  drawSnake();
  drawFood();
  drawSpeedBoost();
}

// check if the snake head collides with itself or the boundary
function checkCollision() {
  const { segments } = snake;
  const head = segments[0];
  // reset game if snake head collides with the game boundary
  if (head.x < 1 || head.x > gridSize || head.y < 1 || head.y > gridSize) {
    resetGame();
  }
  // reset game if snake head collides with one of it's body segments
  for (let i = 1; i < segments.length; i++) {
    if (segments[i].x === head.x && segments[i].y === head.y) {
      resetGame();
    }
  }
}

// set a snake's movement interval
function setSnakeMoveInterval() {
  snake.moveInterval = setInterval(() => {
    moveSnake();
    checkCollision();
    draw();
    setSnakeClassNames();
  }, snake.speed);
}

// start the game
function startGame() {
  isGameStarted = true;
  startPrompt.style.display = "none";
  setSnakeMoveInterval();
}

// stop the game
function stopGame() {
  clearInterval(snake.moveInterval);
  isGameStarted = false;
  startPrompt.style.display = "block";
}

// reset the game
function resetGame() {
  stopGame();
  food = randomPosition();
  initialOrientation = randomOrientation();
  initialSnakeSegments = generateSnakeSegments();
  snake.segments = initialSnakeSegments;
  snake.direction = setInitialDirection(
    initialSnakeSegments[0],
    initialOrientation
  );
  snake.speed = initialSpeed;
  snake.score = 0;
}

// increase a snake's score/high-score
function increaseScore() {
  const currentScore = snake.segments.length - initialSnakeLength;
  snake.score = currentScore;
  if (snake.score > snake.highScore) {
    snake.highScore = snake.score;
  }
}

// Apply CSS classes to snake segment elements for appropriate styling
function setSnakeClassNames() {
  if (isGameStarted) {
    const { segments, direction } = snake;
    // set the classes for the head segment
    snakeElements[0].className = `snake head ${direction}`;
    // determine which classes are needed for the remaining segments
    for (let i = 1; i < segments.length; i++) {
      const prevSegment = segments[i - 1];
      const currentSegment = segments[i];
      const segmentDirection = getSegmentDirection(currentSegment, prevSegment);
      if (i === segments.length - 1) {
        // set the classes for the tail segment
        snakeElements[i].className = `snake tail ${segmentDirection}`;
      } else {
        // determine if the current segment is a corner and/or a target segment
        const nextSegment = segments[i + 1];
        const bodySegmentType = getBodySegmentType(
          currentSegment,
          nextSegment,
          segmentDirection
        );
        const isCorner = bodySegmentType !== "body";
        // set the classes for the body segments
        const isTarget = i > segments.length - 1 - snakeTargetSize;
        const classNames = `${isCorner ? "corner" : ""} ${bodySegmentType} ${
          isTarget ? "target" : ""
        } ${segmentDirection}`;
        snakeElements[i].className = `snake ${classNames}`;
      }
    }
  }
}

// apply the speed boost effect to the snake
function setSnakeSpeedBoost() {
  // clear existing speed boost timeout (if any)
  if (snake.speedBoostTimeout) clearTimeout(snake.speedBoostTimeout);
  // respawn speed boost on the board
  speedBoost = randomPosition();
  // increase snake speed (lower value = faster)
  snake.speed = snake.speed * speedBoostMultiplier;
  // reset the game interval (to apply the speed change)
  clearInterval(snake.moveInterval);
  setSnakeMoveInterval();
  // set the speed boost timeout
  snake.speedBoostTimeout = setTimeout(() => {
    // reset snake speed
    snake.speed = initialSpeed;
    // reset the game interval (to apply to speed change)
    clearInterval(snake.moveInterval);
    setSnakeMoveInterval();
  }, speedBoostDuration);
}

// move a snake
function moveSnake() {
  const { segments, direction } = snake;
  const head = { ...segments[0] }; // shallow copy
  const isFoodCollision = head.x === food.x && head.y === food.y;
  const isSpeedBoostCollision =
    head.x === speedBoost.x && head.y === speedBoost.y;
  // set the new position of the snake head
  switch (direction) {
    case "up":
      head.y--;
      break;
    case "right":
      head.x++;
      break;
    case "down":
      head.y++;
      break;
    case "left":
      head.x--;
      break;
  }
  // add a new (head) segment to the snake
  segments.unshift(head);
  if (isFoodCollision) {
    increaseScore();
    // respawn food on the board
    food = randomPosition();
  } else if (isSpeedBoostCollision) {
    increaseScore();
    // apply the speed boost effect to the snake
    setSnakeSpeedBoost();
  } else {
    // remove the tail segment of the snake
    segments.pop();
  }
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
        if (snake.direction !== "down") snake.direction = "up";
        break;
      case "ArrowDown":
        if (snake.direction !== "up") snake.direction = "down";
        break;
      case "ArrowLeft":
        if (snake.direction !== "right") snake.direction = "left";
        break;
      case "ArrowRight":
        if (snake.direction !== "left") snake.direction = "right";
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
