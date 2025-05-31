const {
  gridSize,
  initialSnakeLength,
  initialSpeed,
  speedBoostDuration,
  speedBoostMultiplier,
} = require("../config");

function generateSnake(id) {
  const initialOrientation = randomOrientation();
  const initialSnakeSegments = generateSnakeSegments(initialOrientation);
  return {
    id,
    segments: initialSnakeSegments,
    direction: setInitialDirection(initialSnakeSegments[0], initialOrientation),
    nextDirection: null, // queued input
    speed: initialSpeed,
    lastMoveTime: Date.now(),
    speedBoostTimeout: null,
    score: 0,
    highScore: 0,
    deaths: 0,
    isAlive: false,
  };
}

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
  snake.isAlive = true;
}

function randomPosition() {
  const x = Math.floor(Math.random() * gridSize) + 1;
  const y = Math.floor(Math.random() * gridSize) + 1;
  return { x, y };
}

function randomOrientation() {
  return Math.random() < 0.5 ? "horizontal" : "vertical";
}

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

function setInitialDirection(position, orientation) {
  if (orientation === "horizontal") {
    return position.y >= gridSize / 2 ? "up" : "down";
  } else {
    return position.x >= gridSize / 2 ? "left" : "right";
  }
}

function applySpeedBoost(snake) {
  if (typeof speedBoostMultiplier !== "number" || isNaN(speedBoostMultiplier)) {
    throw new Error("Invalid speedBoostMultiplier value");
  }
  console.log(
    `Applying speed boost: current=${snake.speed}, multiplier=${speedBoostMultiplier}`
  );
  if (snake.speedBoostTimeout) {
    clearTimeout(snake.speedBoostTimeout);
  }
  snake.speed = snake.speed * speedBoostMultiplier;
  snake.speedBoostTimeout = setTimeout(() => {
    console.log(
      `Resetting speed for ${snake.id} to initialSpeed (${initialSpeed})`
    );
    snake.speed = initialSpeed;
    snake.speedBoostTimeout = null;
  }, speedBoostDuration);
}

module.exports = {
  generateSnake,
  respawnSnake,
  randomPosition,
  randomOrientation,
  generateSnakeSegments,
  setInitialDirection,
  applySpeedBoost,
};
