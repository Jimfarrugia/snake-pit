// Define HTML elements
const board = document.getElementById("game-board");
const startPrompt = document.getElementById("start-prompt");
const score = document.getElementById("score");
const highScoreText = document.getElementById("high-score");
const snakeElements = document.getElementsByClassName("snake");

// Define game variables
const gridSize = 20; // amount of rows and columns
const initialSnakeLength = 5; // amount of segments that snakes begin with
const initialSpeed = 200; // interval length in ms
let initialOrientation = randomOrientation();
let initialSnakeSegments = generateSnakeSegments();
let snake = {
  segments: initialSnakeSegments,
  direction: setInitialDirection(initialSnakeSegments[0], initialOrientation),
  speed: initialSpeed,
};
let food = randomPosition();
let highScore = 0;
let isGameStarted = false;
let gameInterval;

// randomly pick an orientation for a new snake
function randomOrientation() {
  return Math.round(Math.random()) ? "vertical" : "horizontal";
}

// generate a random position on the grid
function randomPosition() {
  const x = Math.floor(Math.random() * gridSize) + 1;
  const y = Math.floor(Math.random() * gridSize) + 1;
  return { x, y };
}

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

// Set the initial direction of movement (away from the nearest boundary)
function setInitialDirection(position, orientation) {
  // move away from the nearest boundary
  if (orientation === "horizontal") {
    return position.y >= gridSize / 2 ? "up" : "down";
  } else {
    return position.x >= gridSize / 2 ? "left" : "right";
  }
}

// Create a snake or food element
function createGameElement(tag, className) {
  const element = document.createElement(tag);
  element.className = className;
  return element;
}

// set the position of snake or food
function setElementPosition(element, position) {
  element.style.gridColumn = position.x;
  element.style.gridRow = position.y;
}

// draw food on the board
function drawFood() {
  if (isGameStarted) {
    const foodElement = createGameElement("div", "food");
    setElementPosition(foodElement, food);
    board.appendChild(foodElement);
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

// Draw game map, snake, food
function draw() {
  board.innerHTML = "";
  drawSnake();
  drawFood();
  updateScore();
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

// set the game interval
function setGameInterval() {
  gameInterval = setInterval(() => {
    move();
    checkCollision();
    draw();
    setClassNames();
  }, snake.speed);
}

// start the game
function startGame() {
  isGameStarted = true;
  startPrompt.style.display = "none";
  setGameInterval();
}

// stop the game
function stopGame() {
  clearInterval(gameInterval);
  isGameStarted = false;
  startPrompt.style.display = "block";
}

// reset the game
function resetGame() {
  updateScore();
  updateHighScore();
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
}

// update the score
function updateScore() {
  const currentScore = snake.segments.length - initialSnakeLength;
  score.textContent = currentScore.toString().padStart(3, "0");
}

// update the high score
function updateHighScore() {
  const currentScore = snake.segments.length - initialSnakeLength;
  if (currentScore > highScore) {
    highScore = currentScore;
    highScoreText.textContent = highScore.toString().padStart(3, "0");
  }
  highScoreText.style.display = "block";
}

// get the current direction of a snake segment
function getSegmentDirection(currentSegment, prevSegment) {
  if (currentSegment.x < prevSegment.x) return "right";
  else if (currentSegment.x > prevSegment.x) return "left";
  else if (currentSegment.y < prevSegment.y) return "down";
  else if (currentSegment.y > prevSegment.y) return "up";
}

// determine whether a snake body segment is a corner and if so, which type of corner
function getBodySegmentType(currentSegment, nextSegment, segmentDirection) {
  let isCorner = false;
  let cornerType = "";
  if (segmentDirection === "left" && nextSegment.y !== currentSegment.y) {
    isCorner = true;
    nextSegment.y < currentSegment.y
      ? (cornerType = "left-up")
      : (cornerType = "left-down");
  }
  if (segmentDirection === "right" && nextSegment.y !== currentSegment.y) {
    isCorner = true;
    nextSegment.y < currentSegment.y
      ? (cornerType = "right-up")
      : (cornerType = "right-down");
  }
  if (segmentDirection === "up" && nextSegment.x !== currentSegment.x) {
    isCorner = true;
    nextSegment.x < currentSegment.x
      ? (cornerType = "left-up")
      : (cornerType = "right-up");
  }
  if (segmentDirection === "down" && nextSegment.x !== currentSegment.x) {
    isCorner = true;
    nextSegment.x < currentSegment.x
      ? (cornerType = "left-down")
      : (cornerType = "right-down");
  }
  return isCorner ? cornerType : "body";
}

// Apply classNames to snake segment elements for appropriate styling
function setClassNames() {
  if (isGameStarted) {
    const { segments, direction } = snake;
    // the first/head segment's direction is the same as the current movement direction
    snakeElements[0].className = `snake head ${direction}`;
    // set classNames for the direction and body type of the remaining segments
    for (let i = 1; i < segments.length; i++) {
      const prevSegment = segments[i - 1];
      const currentSegment = segments[i];
      const segmentDirection = getSegmentDirection(currentSegment, prevSegment);
      // if the currentSegment is the tail, give it the appropriate classNames
      if (i === segments.length - 1) {
        snakeElements[i].className = `snake tail ${segmentDirection}`;
      } else {
        // check whether the current segment should be a corner, give it the appropriate classNames
        const nextSegment = segments[i + 1];
        const bodySegmentType = getBodySegmentType(
          currentSegment,
          nextSegment,
          segmentDirection
        );
        snakeElements[i].className = `snake ${
          bodySegmentType !== "body" ? "corner" : ""
        } ${bodySegmentType} ${segmentDirection}`;
      }
    }
  }
}

// moving the snake
function move() {
  const { segments, direction } = snake;
  // set the new position of the snake head
  const head = { ...segments[0] }; // shallow copy
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
  // if snake head collides with food
  if (head.x === food.x && head.y === food.y) {
    // respawn food
    food = randomPosition();
    // reset the game interval
    clearInterval(gameInterval);
    setGameInterval();
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
