const { generateSnake, respawnSnake } = require("./snake");
const { gridSize } = require("../config");
const { logEvent } = require("./logger");

// Generate a NPC snake
// Name should be consistant with the snake's purpose (ie. "TestSnake" or "Practice Opponent")
function generateNpcSnake(name) {
  const id = `${name}${Math.round(Math.random().toFixed(6) * 1000000)}`;
  const snake = generateSnake(id);
  snake.name = id;
  snake.isAlive = true;
  snake.lastMoveTime = Date.now();
  snake.isClockwise = Math.round(Math.random());
  snake.isNpc = true;
  return snake;
}

// Move a NPC snake without letting it run into the boundary or itself
function setNpcSnakeDirection(snake) {
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

// Setup NPC snakes at the start of the game
function setupNpcSnakes(n, name, respawnInterval, state) {
  destroyNpcSnakes(state);
  addNpcSnakes(n, name, state);
  // Revive NPC snakes every tick
  state.spawnNpcSnakesInterval = setInterval(() => {
    const snakes = state.snakes.filter(snake => snake.isNpc && snake.isAlive);
    if (snakes.length < n) {
      respawnNpcSnakes(state);
    }
  }, respawnInterval);
}

// Remove all NPC snakes
function destroyNpcSnakes(state) {
  state.snakes = state.snakes.filter(s => !s.isNpc);
  logEvent("All NPC snakes were removed.");
}

// Add NPC snakes to the game (n: number of snakes to add)
function addNpcSnakes(n, name, state) {
  for (let i = 0; i < n; i++) {
    state.snakes.push(generateNpcSnake(name));
  }
  logEvent(`Added ${n} (${name}) NPC snakes.`);
}

// Revive test snakes
function respawnNpcSnakes(state) {
  state.snakes.forEach(snake => {
    if (snake.isNpc && !snake.isAlive) {
      respawnSnake(snake);
      logEvent(`${snake.id} respawned.`, snake.id);
    }
  });
}

module.exports = {
  generateNpcSnake,
  setNpcSnakeDirection,
  setupNpcSnakes,
  addNpcSnakes,
  destroyNpcSnakes,
  respawnNpcSnakes,
};
