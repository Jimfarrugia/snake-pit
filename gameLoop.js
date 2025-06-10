const state = require("./state");
const {
  logEvent,
  isSamePosition,
  mapAllTargetSegments,
  killSnake,
  eatFood,
  eatSpeedBoost,
  applySpeedBoost,
  eatImmunity,
  applyImmunity,
  teleportSnakeHead,
  isBoundaryCollision,
  setTestSnakeDirection,
  stopGameIfEmpty,
  isSelfCollision,
} = require("./utils");
const {
  snakeMaxTargetSize,
  initialSnakeLength,
  isDevEnv,
  immunityDuration,
  speedBoostDuration,
  initialSpeed,
} = require("./config");

// Move a single snake
function moveSnake(snake, now, io) {
  if (!snake.isAlive) return;
  if (now - snake.lastMoveTime < snake.speed) return; // not time to move yet
  snake.lastMoveTime = now;
  snake.isGrowing = false;

  const { food, speedBoost, immunity } = state;
  const segments = snake.segments;
  const prevHead = segments[0];
  const newHead = { ...segments[0] };

  // Update direction for all snakes (test or not)
  if (snake.nextDirection) {
    snake.direction = snake.nextDirection;
    snake.nextDirection = null;
  }

  // Move head according to direction
  switch (snake.direction) {
    case "up":
      newHead.y--;
      break;
    case "right":
      newHead.x++;
      break;
    case "down":
      newHead.y++;
      break;
    case "left":
      newHead.x--;
      break;
  }
  segments.unshift(newHead);

  // Handle boundary collision
  if (isBoundaryCollision(newHead)) {
    if (snake.isImmune) {
      teleportSnakeHead(snake);
    } else {
      killSnake(io, snake);
      logEvent(
        `'${snake.name}' died by hitting the wall with ${snake.score} points.`,
        snake.id
      );
      return;
    }
  }

  // Handle self collision
  if (!snake.isImmune && isSelfCollision(snake.segments, newHead)) {
    killSnake(io, snake);
    logEvent(
      `'${snake.name}' died by biting itself with ${snake.score} points.`,
      snake.id
    );
    return;
  }

  // Handle enemy snake collision
  if (state.snakes.length > 1) {
    const allTargetSegmentsMap = mapAllTargetSegments(state, snake.id);
    const enemySnakesMap = Object.fromEntries(state.snakes.map(s => [s.id, s]));
    for (const [id, segments] of Object.entries(allTargetSegmentsMap)) {
      const enemySnake = enemySnakesMap[id];
      if (!enemySnake || !enemySnake.isAlive) continue;
      const isCollision = segments.some(
        ({ position, nextPosition }) =>
          // head and target swap positions (pass through each other)
          (isSamePosition(newHead, position) &&
            isSamePosition(prevHead, nextPosition)) ||
          // head and target meet on the same position
          isSamePosition(newHead, nextPosition) ||
          isSamePosition(prevHead, position)
      );
      if (isCollision) {
        killSnake(io, enemySnake, snake);
        logEvent(
          `'${enemySnake.name}' was killed by '${snake.name}'.`,
          enemySnake.id
        );
      }
    }
  }

  // Handle food collision
  if (isSamePosition(food, newHead)) {
    eatFood(state, snake);
  }

  // Handle speed boost collision
  if (isSamePosition(speedBoost, newHead)) {
    eatSpeedBoost(state, snake);
    applySpeedBoost(snake);
  }

  // Handle immunity collision
  if (immunity && isSamePosition(immunity, newHead)) {
    eatImmunity(state, snake);
    applyImmunity(snake);
  }

  // Remove the tail segment if no points were gained
  if (!snake.isGrowing) segments.pop();
}

// The game loop
function gameLoop(io) {
  if (!state.isGameStarted) return;
  const now = Date.now();
  const { food, speedBoost, immunity, snakes } = state;

  // Move snakes
  snakes.forEach(snake => {
    if (isDevEnv && snake.id.includes("TestSnake")) {
      setTestSnakeDirection(snake);
    }
    moveSnake(snake, now, io);
  });

  // emit the gamestate to all connections
  io.emit("gameState", {
    // strip timeout values from the snake object during emit
    // becuase they're non-serializable and cause socket.io to crash
    // (we could alternatively, handle timeouts outside of the game state)
    snakes: snakes.map(({ speedBoostTimeout, immunityTimeout, ...s }) => s),
    food,
    speedBoost,
    speedBoostDuration,
    immunity,
    immunityDuration,
    snakeMaxTargetSize,
    initialSnakeLength,
    initialSpeed,
  });

  // stop the game if no players are in-game
  stopGameIfEmpty(state);
}

module.exports = gameLoop;
