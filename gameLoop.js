const state = require("./state");
const {
  randomPosition,
  applySpeedBoost,
  moveTestSnake,
} = require("./utils/snakeUtils");
const { gridSize } = require("./config");

// Move a single snake
function moveSnake(snake, now, io) {
  if (!snake.isAlive) return;
  if (now - snake.lastMoveTime < snake.speed) return; // not time to move yet
  snake.lastMoveTime = now;

  // Set new direction
  if (snake.nextDirection) {
    snake.direction = snake.nextDirection;
    snake.nextDirection = null;
  }

  // Move head according to direction
  const segments = snake.segments;
  const head = { ...segments[0] };
  switch (snake.direction) {
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
  segments.unshift(head);

  // Check food/bonus-effect collisions
  const food = state.food;
  const speedBoost = state.speedBoost;
  const isFoodCollision = head.x === food.x && head.y === food.y;
  const isSpeedBoostCollision =
    head.x === speedBoost.x && head.y === speedBoost.y;
  if (isFoodCollision) {
    snake.score += 1;
    state.food = randomPosition();
  } else if (isSpeedBoostCollision) {
    snake.score += 1;
    state.speedBoost = randomPosition();
    applySpeedBoost(snake);
  } else {
    segments.pop();
  }

  // Check boundary collision
  if (head.x < 1 || head.x > gridSize || head.y < 1 || head.y > gridSize) {
    snake.isAlive = false;
    snake.deaths += 1;
    io.to(snake.id).emit("gameOver");
    console.log(
      `${snake.id} died by hitting the wall with ${snake.score} points.`
    );
    return;
  }

  // Check self collision
  for (let i = 1; i < segments.length; i++) {
    if (segments[i].x === head.x && segments[i].y === head.y) {
      snake.isAlive = false;
      snake.deaths += 1;
      io.to(snake.id).emit("gameOver");
      console.log(
        `${snake.id} died by biting itself with ${snake.score} points.`
      );
      break;
    }
  }
}

// The game loop
function gameLoop(io) {
  if (!state.isGameStarted) return;

  const now = Date.now();

  state.snakes.forEach(snake => {
    // if (snake.isAlive) {
    // ! Move the test snake
    if (snake.id === "tester") {
      moveTestSnake(snake);
    }
    // ! ^
    moveSnake(snake, now, io);
    // }
  });

  io.emit("gameState", {
    // strip speedBoostTimeout from the snake object during emit
    // becuase it's non-serializable and causes socket.io to crash
    // (alternatively, handle timeouts outside of the game state)
    snakes: state.snakes.map(({ speedBoostTimeout, ...s }) => s),
    food: state.food,
    speedBoost: state.speedBoost,
  });
}

module.exports = gameLoop;
