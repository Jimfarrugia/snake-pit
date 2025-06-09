const {
  getSnakeTargetSegments,
  getSnakeTargetSize,
  clearSnakeEffects,
} = require("./snake");
const { isSamePosition, randomPosition } = require("./helpers");
const { destroyTestSnakes } = require("./testSnake");
const { logEvent } = require("./logger");
const { isDevEnv, gridSize, immunityRespawnCooldown } = require("../config");

// stop the game loop if no snakes remain alive
function stopGameIfEmpty(state) {
  const remainingSnakes = state.snakes.filter(snake =>
    isDevEnv ? snake.isAlive && !snake.id.includes("TestSnake") : snake.isAlive
  );
  if (!remainingSnakes.length) {
    if (isDevEnv) {
      clearInterval(state.spawnTestSnakesInterval);
      destroyTestSnakes(state);
    }
    state.isGameStarted = false;
    logEvent("Game stopped. No snakes alive.");
  }
}

// stop the game loop if no players are connected
function stopGameIfNoConnections(state) {
  // disregard test snakes
  const remainingSnakes = isDevEnv
    ? state.snakes.filter(s => !s.id.includes("TestSnake"))
    : state.snakes;
  if (!remainingSnakes.length) {
    if (isDevEnv) {
      clearInterval(state.spawnTestSnakesInterval);
      destroyTestSnakes(state);
    }
    const wasGameStarted = state.isGameStarted;
    state.isGameStarted = false;
    if (wasGameStarted) logEvent("Game stopped. No players connected.");
  }
}

// Return an array of all target segments on the board
// along with their next positions and snake id.
function getAllTargetSegments(state, playerSnake) {
  return state.snakes
    .filter(s => s.id !== playerSnake.id && s.isAlive && !s.isImmune)
    .flatMap(snake => {
      const targetSize = getSnakeTargetSize(snake);
      const targetSegments = getSnakeTargetSegments(snake);
      // get the last non-target body segment
      const [trailingBodySegment] = snake.segments.slice(
        -(targetSize + 1),
        -targetSize
      );
      return targetSegments.map((segment, i, arr) => ({
        id: snake.id,
        nextPosition: i === 0 ? trailingBodySegment : arr[i - 1],
        position: segment,
      }));
    });
}

// Kill enemy snake and award point to player
function killSnake(enemySnake, playerSnake, io) {
  clearSnakeEffects(enemySnake);
  enemySnake.isAlive = false;
  enemySnake.deaths += 1;
  playerSnake.kills += 1;
  io.to(enemySnake.id).emit("gameOver");
  logEvent(
    `'${enemySnake.name}' was killed by '${playerSnake.name}'.`,
    enemySnake.id
  );
}

// Check if a snake has collided with food
function isFoodCollision(food, playerSnake) {
  const playerSnakeHead = playerSnake.segments[0];
  return isSamePosition(food, playerSnakeHead);
}

// Award snake a point and reset food location
function eatFood(state, playerSnake) {
  playerSnake.score += 1;
  state.food = randomPosition();
}

// Check if a snake has collided with food
function isSpeedBoostCollision(speedBoost, playerSnake) {
  const playerSnakeHead = playerSnake.segments[0];
  return isSamePosition(speedBoost, playerSnakeHead);
}

// Award snake a point and reset speed boost location
function eatSpeedBoost(state, playerSnake) {
  playerSnake.score += 1;
  state.speedBoost = randomPosition();
}

// Check if a snake has collided with immunity
function isImmunityCollision(immunity, playerSnake) {
  const playerSnakeHead = playerSnake.segments[0];
  return isSamePosition(immunity, playerSnakeHead);
}

// Award snake a point and queue the immunity pickup for respawn
function eatImmunity(state, playerSnake) {
  playerSnake.score += 1;
  state.immunity = null;
  state.immunityRespawnTimeout = setTimeout(() => {
    state.immunity = randomPosition();
    logEvent("Immunity has respawned.");
  }, immunityRespawnCooldown);
}

// Check if snake head collides with the boundary
function isBoundaryCollision(snakeHead) {
  return (
    snakeHead.x < 1 ||
    snakeHead.x > gridSize ||
    snakeHead.y < 1 ||
    snakeHead.y > gridSize
  );
}

module.exports = {
  stopGameIfEmpty,
  stopGameIfNoConnections,
  getAllTargetSegments,
  killSnake,
  isFoodCollision,
  eatFood,
  isSpeedBoostCollision,
  eatSpeedBoost,
  isImmunityCollision,
  eatImmunity,
  isBoundaryCollision,
};
