const state = require("./state");
const {
  killSnake,
  isFoodCollision,
  eatFood,
  isSpeedBoostCollision,
  eatSpeedBoost,
  applySpeedBoost,
  isBoundaryCollision,
  setTestSnakeDirection,
  isSamePosition,
  stopGameIfEmpty,
  getAllTargetSegments,
  isImmunityCollision,
  eatImmunity,
  applyImmunity,
  teleportSnakeHead,
  logEvent,
  clearSnakeEffects,
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
function moveSnake(playerSnake, now, io) {
  if (!playerSnake.isAlive) return;
  if (now - playerSnake.lastMoveTime < playerSnake.speed) return; // not time to move yet
  playerSnake.lastMoveTime = now;

  const segments = playerSnake.segments;
  const prevHead = segments[0];
  const newHead = { ...segments[0] };
  let isGrowing = false;

  // Update direction for all snakes (test or not)
  if (playerSnake.nextDirection) {
    playerSnake.direction = playerSnake.nextDirection;
    playerSnake.nextDirection = null;
  }

  // Move head according to direction
  switch (playerSnake.direction) {
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

  // Handle enemy snake collision
  if (state.snakes.length > 1) {
    const targetSegments = getAllTargetSegments(state, playerSnake);
    targetSegments.forEach(targetSegment => {
      if (targetSegment.id === playerSnake.id) return; // skip self
      // consider cases where head and target segment swap spaces (pass through each other)
      // (eg. 5,5 -> 6,5 and 6,5 -> 5,5)
      // or where they both move to the same space at once
      // (eg. 4,5 -> 5,5 and 6,5 -> 5,5)
      if (
        (isSamePosition(newHead, targetSegment.position) &&
          isSamePosition(prevHead, targetSegment.nextPosition)) ||
        isSamePosition(newHead, targetSegment.nextPosition) ||
        isSamePosition(prevHead, targetSegment.position)
      ) {
        const enemySnake = state.snakes.find(s => s.id === targetSegment.id);
        killSnake(enemySnake, playerSnake, io);
        isGrowing = true;
      }
    });
  }

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

  // Handle immunity collision
  if (state.immunity && isImmunityCollision(state.immunity, playerSnake)) {
    eatImmunity(state, playerSnake);
    applyImmunity(playerSnake);
    isGrowing = true;
  }

  // Remove the tail segment if no points were gained
  if (!isGrowing) segments.pop();

  // Check boundary collision
  if (isBoundaryCollision(newHead)) {
    if (playerSnake.isImmune) {
      teleportSnakeHead(playerSnake);
    } else {
      clearSnakeEffects(playerSnake);
      playerSnake.isAlive = false;
      playerSnake.deaths += 1;
      io.to(playerSnake.id).emit("gameOver");
      logEvent(
        `'${playerSnake.name}' died by hitting the wall with ${playerSnake.score} points.`,
        playerSnake.id
      );
      return;
    }
  }

  // Check self collision
  if (!playerSnake.isImmune) {
    for (let i = 1; i < segments.length; i++) {
      if (isSamePosition(segments[i], newHead)) {
        clearSnakeEffects(playerSnake);
        playerSnake.isAlive = false;
        playerSnake.deaths += 1;
        io.to(playerSnake.id).emit("gameOver");
        logEvent(
          `'${playerSnake.name}' died by biting itself with ${playerSnake.score} points.`,
          playerSnake.id
        );
        break;
      }
    }
  }
}

// The game loop
function gameLoop(io) {
  if (!state.isGameStarted) return;
  const now = Date.now();

  // Move snakes
  state.snakes.forEach(snake => {
    if (isDevEnv && snake.id.includes("TestSnake")) {
      setTestSnakeDirection(snake);
    }
    moveSnake(snake, now, io);
  });

  // emit the gamestate to all connections
  io.emit("gameState", {
    // strip speedBoostTimeout and immunityTimeout from the snake object during emit
    // becuase they're non-serializable and cause socket.io to crash
    // (we could alternatively, handle timeouts outside of the game state)
    snakes: state.snakes.map(
      ({ speedBoostTimeout, immunityTimeout, ...s }) => s
    ),
    food: state.food,
    speedBoost: state.speedBoost,
    speedBoostDuration,
    immunity: state.immunity,
    immunityDuration,
    snakeMaxTargetSize,
    initialSnakeLength,
    initialSpeed,
  });

  // stop the game if no players are in-game
  stopGameIfEmpty(state);
}

module.exports = gameLoop;
