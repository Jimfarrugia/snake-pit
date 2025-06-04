const state = require("./state");
const {
  isEnemySnakeCollision,
  killSnake,
  isFoodCollision,
  eatFood,
  isSpeedBoostCollision,
  eatSpeedBoost,
  applySpeedBoost,
  setTestSnakeDirection,
  isSamePosition,
  stopGameIfEmpty,
} = require("./utils");
const {
  gridSize,
  snakeMaxTargetSize,
  initialSnakeLength,
  isDevEnv,
} = require("./config");

// Move a single snake
function moveSnake(playerSnake, now, io) {
  if (!playerSnake.isAlive) return;
  if (now - playerSnake.lastMoveTime < playerSnake.speed) return; // not time to move yet
  playerSnake.lastMoveTime = now;

  const segments = playerSnake.segments;
  const head = { ...segments[0] };
  let isGrowing = false;

  // Handle enemy snake collision
  if (state.snakes.length > 1) {
    state.snakes.forEach(snake => {
      if (snake.id === playerSnake.id) return; // skip self
      if (isEnemySnakeCollision(snake, playerSnake)) {
        killSnake(snake, playerSnake, io);
        isGrowing = true;
      }
    });
  }

  // Update direction for all snakes (test or not)
  if (playerSnake.nextDirection) {
    playerSnake.direction = playerSnake.nextDirection;
    playerSnake.nextDirection = null;
  }

  // Move head according to direction
  switch (playerSnake.direction) {
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

  // Handle food collision
  if (isFoodCollision(state.food, playerSnake)) {
    eatFood(state, playerSnake);
    isGrowing = true;
  }

  // Handle speed boost collision
  if (isSpeedBoostCollision(state.speedBoost, playerSnake)) {
    eatSpeedBoost(state, playerSnake);
    applySpeedBoost(playerSnake);
    isGrowing = true;
  }

  // Remove the tail segment if no points were gained
  if (!isGrowing) segments.pop();

  // Check boundary collision
  if (head.x < 1 || head.x > gridSize || head.y < 1 || head.y > gridSize) {
    playerSnake.isAlive = false;
    playerSnake.deaths += 1;
    io.to(playerSnake.id).emit("gameOver");
    console.log(
      `'${playerSnake.name}' died by hitting the wall with ${playerSnake.score} points.`
    );
    return;
  }

  // Check self collision
  for (let i = 1; i < segments.length; i++) {
    if (isSamePosition(segments[i], head)) {
      playerSnake.isAlive = false;
      playerSnake.deaths += 1;
      io.to(playerSnake.id).emit("gameOver");
      console.log(
        `'${playerSnake.name}' died by biting itself with ${playerSnake.score} points.`
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
    if (isDevEnv && snake.id.includes("TestSnake")) {
      setTestSnakeDirection(snake);
    }
    moveSnake(snake, now, io);
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
  // stop the game if no players are in-game
  stopGameIfEmpty(state);
}

module.exports = gameLoop;
