const {
  getSnakeTargetSegments,
  getSnakeTargetSize,
  clearSnakeEffects,
} = require("./snake");
const { isSamePosition, randomPosition } = require("./helpers");
const { destroyTestSnakes } = require("./testSnake");
const { logEvent } = require("./logger");
const { isDevEnv, gridSize, immunityRespawnCooldown } = require("../config");

// stop the game if no snakes remain alive (test snakes don't count)
function stopGameIfEmpty(state) {
  const remainingSnakes = state.snakes.filter(snake =>
    isDevEnv ? snake.isAlive && !snake.id.includes("TestSnake") : snake.isAlive
  );
  if (!remainingSnakes.length) {
    if (isDevEnv) {
      state.snakes.forEach(snake => {
        if (snake.id.includes("TestSnake")) clearSnakeEffects(snake);
      });
      clearInterval(state.spawnTestSnakesInterval);
      destroyTestSnakes(state);
    }
    state.isGameStarted = false;
    logEvent("Game stopped. No snakes alive.");
  }
}

// Return a map of { [snakeId]: [targetSegments] },
// each targetSegment having a position and a nextPosition
function mapAllTargetSegments(state, playerSnakeId) {
  const result = {};
  state.snakes.forEach(snake => {
    if (snake.id === playerSnakeId || !snake.isAlive || snake.isImmune) return;
    const targetSize = getSnakeTargetSize(snake);
    const targetSegments = getSnakeTargetSegments(snake);
    const [trailingBodySegment] = snake.segments.slice(
      -(targetSize + 1),
      -targetSize
    );
    result[snake.id] = targetSegments.map((segment, i, arr) => ({
      position: segment,
      nextPosition: i === 0 ? trailingBodySegment : arr[i - 1],
    }));
  });
  return result;
}

// Kill a snake and award point to the killer if there is one
function killSnake(io, victimSnake, killerSnake = null) {
  clearSnakeEffects(victimSnake);
  victimSnake.isAlive = false;
  victimSnake.deaths += 1;
  io.to(victimSnake.id).emit("gameOver");
  if (killerSnake) {
    killerSnake.kills += 1;
    killerSnake.isGrowing = true;
  }
}

// Check if a snake has collided with food
function isFoodCollision(food, snake) {
  const snakeHead = snake.segments[0];
  return isSamePosition(food, snakeHead);
}

// Award snake a point and reset food location
function eatFood(state, snake) {
  snake.score += 1;
  snake.isGrowing = true;
  state.food = randomPosition();
}

// Check if a snake has collided with food
function isSpeedBoostCollision(speedBoost, snake) {
  const snakeHead = snake.segments[0];
  return isSamePosition(speedBoost, snakeHead);
}

// Award snake a point and reset speed boost location
function eatSpeedBoost(state, snake) {
  snake.score += 1;
  snake.isGrowing = true;
  state.speedBoost = randomPosition();
}

// Check if a snake has collided with immunity
function isImmunityCollision(immunity, snake) {
  const snakeHead = snake.segments[0];
  return isSamePosition(immunity, snakeHead);
}

// Award snake a point and queue the immunity pickup for respawn
function eatImmunity(state, snake) {
  snake.score += 1;
  snake.isGrowing = true;
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

// Check if a snake collides with itself
function isSelfCollision(snakeSegments, snakeHead) {
  for (let i = 1; i < snakeSegments.length; i++) {
    if (isSamePosition(snakeSegments[i], snakeHead)) {
      return true;
    }
  }
  return false;
}

module.exports = {
  stopGameIfEmpty,
  mapAllTargetSegments,
  killSnake,
  isFoodCollision,
  eatFood,
  isSpeedBoostCollision,
  eatSpeedBoost,
  isImmunityCollision,
  eatImmunity,
  isBoundaryCollision,
  isSelfCollision,
};
