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
    speed: initialSpeed,
    lastMoveTime: Date.now(),
    speedBoostTimeout: null,
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

// Reset some of a snake's values making it ready to rejoin the game
function respawnSnake(snake) {
  const initialOrientation = randomOrientation();
  const initialSnakeSegments = generateSnakeSegments(initialOrientation);
  snake.segments = initialSnakeSegments;
  snake.direction = setInitialDirection(
    initialSnakeSegments[0],
    initialOrientation
  );
  snake.speed = initialSpeed;
  snake.score = 0;
  snake.kills = 0;
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
  console.log(
    `'${snake.name}' gained speed boost. Currently ${snake.speed}ms.`
  );
  snake.speedBoostTimeout = setTimeout(() => {
    console.log(`'${snake.name}' speed reset to ${initialSpeed}ms.`);
    snake.speed = initialSpeed;
    snake.speedBoostTimeout = null;
  }, speedBoostDuration);
}

// Apply the immunity effect to a snake
function applyImmunity(snake) {
  if (snake.immunityTimeout) {
    clearTimeout(snake.immunityTimeout);
  }
  snake.isImmune = true;
  snake.immunityTimeStart = Date.now();
  console.log(
    `${snake.name} gained immunity for ${immunityDuration / 1000} seconds.`
  );
  snake.immunityTimeout = setTimeout(() => {
    console.log(`${snake.name}'s immunity wore off.`);
    snake.isImmune = false;
    snake.immunityTimeout = null;
  }, immunityDuration);
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
  randomOrientation,
  generateSnake,
  respawnSnake,
  generateSnakeSegments,
  setInitialDirection,
  getSnakeTargetSize,
  getSnakeTargetSegments,
  applySpeedBoost,
  applyImmunity,
  teleportSnakeHead,
};
