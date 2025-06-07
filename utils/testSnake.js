const { generateSnake, respawnSnake } = require("./snake");
const { gridSize } = require("../config");

// Generate a test snake
function generateTestSnake(idNumber) {
  const id = `TestSnake${idNumber}`;
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
  console.warn(`${snake.id} is stuck and has died.`);
}

// Remove all test snakes
function destroyTestSnakes(state) {
  state.snakes = state.snakes.filter(s => !s.id.includes("TestSnake"));
}

// Add test snakes to the game (n: number of test snakes to add)
function addTestSnakes(n, state) {
  for (let i = 0; i < n; i++) {
    state.snakes.push(generateTestSnake(i + 1));
  }

// Revive test snakes
function respawnTestSnakes(state) {
  state.snakes.forEach(snake => {
    if (snake.id.includes("TestSnake")) {
      respawnSnake(snake);
    }
  });
}

module.exports = {
  generateTestSnake,
  setTestSnakeDirection,
  destroyTestSnakes,
  addTestSnakes,
  respawnTestSnakes,
};
