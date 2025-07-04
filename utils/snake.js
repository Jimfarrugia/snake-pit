const {
  gridSize,
  initialSpeed,
  initialSnakeLength,
  snakeMaxTargetSize,
  speedBoostDuration,
  speedBoostMultiplier,
  immunityDuration,
} = require("../config");
const { randomPosition } = require("./helpers");
const { logEvent } = require("./logger");

// Create a snake in the set for a new player or get an existing one.
// Return the snake.
function getOrCreatePlayerSnake(playerSnakes, id) {
  if (!playerSnakes.has(id)) {
    const snake = generateSnake(id);
    playerSnakes.set(id, snake);
    logEvent(`'${id}' snake was created.`, id);
  }
  return playerSnakes.get(id);
}

// Create a player's snake in the practice room's state or get it if it already exists.
// Return the snake.
function getOrCreatePracticeSnake(id, practiceState) {
  let snake = practiceState.snakes.find(s => s.id === id);
  if (!snake) {
    snake = generateSnake(id);
    snake.name = "Practice Snake";
    practiceState.snakes.push(snake);
    logEvent(`Practice snake created for ${id}.`, id);
  }
  return snake;
}

// Return a player's practice snake if it's active,
// otherwise return their main-game snake.
function getActiveSnake(playerSnakes, id, gameStates) {
  const practiceRoom = `practice-${id}`;
  if (gameStates.has(practiceRoom)) {
    const practiceState = gameStates.get(practiceRoom);
    const snake = practiceState.snakes.find(s => s.id === id);
    if (snake) return snake;
  }
  return playerSnakes.get(id); // multiplayer snake
}

// Generate a random orientation for a snake
function randomOrientation() {
  return Math.random() < 0.5 ? "horizontal" : "vertical";
}

// Generate a snake object for a new player
function generateSnake(id) {
  const initialOrientation = randomOrientation();
  const initialSnakeSegments = generateSnakeSegments(initialOrientation);
  return {
    id,
    name: null,
    segments: initialSnakeSegments,
    direction: setInitialDirection(initialSnakeSegments[0], initialOrientation),
    nextDirection: null, // queued input
    lastMoveTime: Date.now(),
    isGrowing: false,
    speed: initialSpeed,
    speedBoostTimeout: null,
    speedBoostTimeStart: null,
    isImmune: false,
    immunityTimeout: null,
    immunityTimeStart: null,
    score: 0,
    highScore: 0,
    kills: 0,
    deaths: 0,
    isAlive: false,
  };
}

// Generate a snake's segments
function generateSnakeSegments(orientation) {
  const head = randomPosition();
  const segments = [head];
  const isVertical = orientation === "vertical";
  const linearAxis = isVertical ? "y" : "x";
  const perpendicularAxis = isVertical ? "x" : "y";
  const headLinear = head[linearAxis];
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

// Decide a snake's initial direction based on it's position and orientation
function setInitialDirection(position, orientation) {
  if (orientation === "horizontal") {
    return position.y >= gridSize / 2 ? "up" : "down";
  } else {
    return position.x >= gridSize / 2 ? "left" : "right";
  }
}

function setSnakeNewDirection(snake, newDirection) {
  const isOpposite =
    (snake.direction === "up" && newDirection === "down") ||
    (snake.direction === "down" && newDirection === "up") ||
    (snake.direction === "left" && newDirection === "right") ||
    (snake.direction === "right" && newDirection === "left");
  snake.nextDirection = !isOpposite ? newDirection : snake.direction;
}

// Reset some of a snake's values making it ready to rejoin the game
function respawnSnake(snake) {
  const initialOrientation = randomOrientation();
  const initialSnakeSegments = generateSnakeSegments(initialOrientation);
  snake.segments = initialSnakeSegments;
  snake.direction = setInitialDirection(
    initialSnakeSegments[0],
    initialOrientation
  );
  // snake.score = 0;
  // snake.kills = 0;
  snake.isAlive = true;
}

// Return the amount of target segments a snake has based on its length
function getSnakeTargetSize(snake) {
  // The target size increases by 1 for each segment gained up to snakeMaxTargetSize
  return snake.segments.length < initialSnakeLength + snakeMaxTargetSize
    ? snake.segments.length - (initialSnakeLength - 1)
    : snakeMaxTargetSize;
}

// Return an array of a snake's target segments
function getSnakeTargetSegments(snake) {
  const targetSize = getSnakeTargetSize(snake);
  return snake.segments.slice(-targetSize);
}

// Apply the speed boost effect to a snake
function applySpeedBoost(snake) {
  if (typeof speedBoostMultiplier !== "number" || isNaN(speedBoostMultiplier)) {
    throw new Error("Invalid speedBoostMultiplier value.");
  }
  if (snake.speedBoostTimeout) {
    clearTimeout(snake.speedBoostTimeout);
  }
  snake.speed = snake.speed * speedBoostMultiplier;
  snake.speedBoostTimeStart = Date.now();
  logEvent(
    `'${snake.name}' gained speed boost. Currently ${snake.speed}ms.`,
    snake.id
  );
  snake.speedBoostTimeout = setTimeout(() => {
    logEvent(`'${snake.name}' speed reset to ${initialSpeed}ms.`, snake.id);
    snake.speed = initialSpeed;
    snake.speedBoostTimeout = null;
    snake.speedBoostTimeStart = null;
  }, speedBoostDuration);
}

// Apply the immunity effect to a snake
function applyImmunity(snake) {
  if (snake.immunityTimeout) {
    clearTimeout(snake.immunityTimeout);
  }
  snake.isImmune = true;
  snake.immunityTimeStart = Date.now();
  logEvent(
    `'${snake.name}' gained immunity for ${immunityDuration / 1000} seconds.`,
    snake.id
  );
  snake.immunityTimeout = setTimeout(() => {
    logEvent(`'${snake.name}'s immunity wore off.`, snake.id);
    snake.isImmune = false;
    snake.immunityTimeout = null;
    snake.immunityTimeStart = null;
  }, immunityDuration);
}

// Clear a snake's speed boost and immunity effects
function clearSnakeEffects(snake) {
  if (snake.speedBoostTimeout) {
    clearTimeout(snake.speedBoostTimeout);
  }
  if (snake.immunityTimeout) {
    clearTimeout(snake.immunityTimeout);
  }
  snake.speed = initialSpeed;
  snake.speedBoostTimeout = null;
  snake.speedBoostTimeStart = null;
  snake.isImmune = false;
  snake.immunityTimeout = null;
  snake.immunityTimeStart = null;
}

function teleportSnakeHead(snake) {
  switch (snake.direction) {
    case "up":
      snake.segments[0].y = gridSize;
      break;
    case "right":
      snake.segments[0].x = 1;
      break;
    case "down":
      snake.segments[0].y = 1;
      break;
    case "left":
      snake.segments[0].x = gridSize;
      break;
  }
}

module.exports = {
  getOrCreatePlayerSnake,
  getOrCreatePracticeSnake,
  getActiveSnake,
  randomOrientation,
  generateSnake,
  respawnSnake,
  generateSnakeSegments,
  setInitialDirection,
  setSnakeNewDirection,
  getSnakeTargetSize,
  getSnakeTargetSegments,
  applySpeedBoost,
  applyImmunity,
  clearSnakeEffects,
  teleportSnakeHead,
};
