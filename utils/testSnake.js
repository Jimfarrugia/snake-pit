const { generateSnake, respawnSnake } = require("./snake");
const { gridSize } = require("../config");
const { logEvent } = require("./logger");

// Generate a test snake
function generateTestSnake() {
  const id = `TestSnake${Math.round(Math.random().toFixed(6) * 1000000)}`;
  const testSnake = generateSnake(id);
  testSnake.name = id;
  testSnake.isAlive = true;
  testSnake.lastMoveTime = Date.now();
  testSnake.isClockwise = Math.round(Math.random());
  return testSnake;
}

// Move a test snake without letting it run into the boundary or itself
function setTestSnakeDirection(snake) {
  if (!snake.isAlive) return;
  const clockwise = {
    up: ["up", "right", "down", "left"],
    right: ["right", "down", "left", "up"],
    down: ["down", "left", "up", "right"],
    left: ["left", "up", "right", "down"],
  };
  const counterClockwise = {
    up: ["up", "left", "down", "right"],
    left: ["left", "down", "right", "up"],
    down: ["down", "right", "up", "left"],
    right: ["right", "up", "left", "down"],
  };

  const directions = snake.isClockwise
    ? clockwise[snake.direction]
    : counterClockwise[snake.direction];

  for (let newDirection of directions) {
    const head = { ...snake.segments[0] };
    switch (newDirection) {
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

    const boundaryBuffer = snake.isClockwise ? 2 : 3;
    const min = boundaryBuffer;
    const max = gridSize - boundaryBuffer;

    const isOutOfBounds =
      head.x <= min || head.x > max || head.y <= min || head.y > max;

    const isSelfCollision = snake.segments.some(
      seg => seg.x === head.x && seg.y === head.y
    );

    if (!isOutOfBounds && !isSelfCollision) {
      snake.nextDirection = newDirection;
      return;
    }
  }

  // If no move is safe, kill the snake
  snake.isAlive = false;
  logEvent(`${snake.id} is stuck and has died.`);
}

// Setup test snakes at the start of the game
function setupTestSnakes(state, numOfTestSnakes, respawnInterval) {
  destroyTestSnakes(state);
  addTestSnakes(numOfTestSnakes, state);
  // Revive test snakes every 10 seconds.
  state.spawnTestSnakesInterval = setInterval(() => {
    const testSnakes = state.snakes.filter(
      snake => snake.id.includes("TestSnake") && snake.isAlive
    );
    if (testSnakes.length < numOfTestSnakes) {
      respawnTestSnakes(state);
    }
  }, respawnInterval);
}

// Remove all test snakes
function destroyTestSnakes(state) {
  state.snakes = state.snakes.filter(s => !s.id.includes("TestSnake"));
  logEvent("All test snakes were removed.");
}

// Add test snakes to the game (n: number of test snakes to add)
function addTestSnakes(n, state) {
  for (let i = 0; i < n; i++) {
    state.snakes.push(generateTestSnake());
  }
  logEvent(`Added ${n} test snakes.`);
}

// Revive test snakes
function respawnTestSnakes(state) {
  state.snakes.forEach(snake => {
    if (snake.id.includes("TestSnake") && !snake.isAlive) {
      respawnSnake(snake);
      logEvent(`${snake.id} respawned.`, snake.id);
    }
  });
}

module.exports = {
  generateTestSnake,
  setTestSnakeDirection,
  setupTestSnakes,
  addTestSnakes,
  destroyTestSnakes,
  respawnTestSnakes,
};
