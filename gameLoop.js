const state = require("./state");
const {
  randomPosition,
  applySpeedBoost,
  moveTestSnake,
  isSamePosition,
  destroyTestSnakes,
} = require("./utils/snakeUtils");
const {
  gridSize,
  snakeMaxTargetSize,
  initialSnakeLength,
} = require("./config");

// Move a single snake
function moveSnake(snake, now, io) {
  if (!snake.isAlive) return;
  if (now - snake.lastMoveTime < snake.speed) return; // not time to move yet
  snake.lastMoveTime = now;

  const segments = snake.segments;
  const head = { ...segments[0] };

  // Check enemy snake collision
  if (state.snakes.length > 1) {
    for (const s of state.snakes) {
      if (s.id === snake.id) continue; // Skip self
      /* number of target segments increments for each segment added to the snake
      until the number has reached snakeMaxTargetSize */
      const targetSize =
        s.segments.length < initialSnakeLength + snakeMaxTargetSize
          ? s.segments.length - (initialSnakeLength - 1)
          : snakeMaxTargetSize;
      const targetSegments = s.segments.slice(0 - targetSize);
      const match = targetSegments.some(segment => {
        // make sure enemy snake is still alive during collision
        // (prevents bug: extra kills added)
        return isSamePosition(segment, head) && s.isAlive;
      });
      if (match) {
        s.isAlive = false;
        s.deaths += 1;
        snake.kills += 1;
        snake.score += 1;
        io.to(s.id).emit("gameOver");
        console.log(
          `'${s.name}' was killed by '${snake.name}' with ${s.score} points.`
        );
      }
    }
    // ! Only test snakes will trigger this
    stopGameIfEmpty(state);
    // ! ^
  }

  // Set new direction
  if (snake.nextDirection) {
    snake.direction = snake.nextDirection;
    snake.nextDirection = null;
  }

  // Move head according to direction
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
  const isFoodCollision = isSamePosition(food, head);
  const isSpeedBoostCollision = isSamePosition(speedBoost, head);
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
      `'${snake.name}' died by hitting the wall with ${snake.score} points.`
    );
    stopGameIfEmpty(state);
    return;
  }

  // Check self collision
  for (let i = 1; i < segments.length; i++) {
    if (isSamePosition(segments[i], head)) {
      snake.isAlive = false;
      snake.deaths += 1;
      io.to(snake.id).emit("gameOver");
      console.log(
        `'${snake.name}' died by biting itself with ${snake.score} points.`
      );
      stopGameIfEmpty(state);
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

  // emit the gamestate to all connections
  io.emit("gameState", {
    // strip speedBoostTimeout from the snake object during emit
    // becuase it's non-serializable and causes socket.io to crash
    // (alternatively, handle timeouts outside of the game state)
    snakes: state.snakes.map(({ speedBoostTimeout, ...s }) => s),
    food: state.food,
    speedBoost: state.speedBoost,
    snakeMaxTargetSize,
    initialSnakeLength,
  });
}

// stop the game loop if no snakes remain alive
function stopGameIfEmpty(state) {
  const remainingSnakes = state.snakes.filter(
    s => s.isAlive && s.id !== "tester"
  );
  if (!remainingSnakes.length) {
    // ! remove test snakes
    destroyTestSnakes(state);
    // ! ^
    state.isGameStarted = false;
    console.log("Game stopped. No snakes alive.");
  }
}

module.exports = gameLoop;
