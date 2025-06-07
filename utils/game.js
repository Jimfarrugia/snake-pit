const { getSnakeTargetSegments, getSnakeTargetSize } = require("./snake");
const { isSamePosition, randomPosition } = require("./helpers");
const { destroyTestSnakes } = require("./testSnake");
const {
  initialSnakeLength,
  snakeMaxTargetSize,
  isDevEnv,
} = require("../config");

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
    console.log("Game stopped. No snakes alive.");
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
    if (wasGameStarted) console.log("Game stopped. No players connected.");
  }
}

// Return an array of all target segments on the board
// along with their next positions and snake id.
function getAllTargetSegments(state, playerSnake) {
  return state.snakes
    .filter(snake => snake.id !== playerSnake.id && snake.isAlive)
    .flatMap(snake => {
      const targetSize = getSnakeTargetSize(snake);
      const targetSegments = getSnakeTargetSegments(snake);
      // get the trailing non-target body segment
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

// Check if a snake has collided with a target segment of another snake
function isEnemySnakeCollision(enemySnake, playerSnake) {
  const playerSnakeHead = playerSnake.segments[0];
  /* number of target segments increments for each segment added to the snake
      until the number has reached snakeMaxTargetSize */
  const targetSize =
    enemySnake.segments.length < initialSnakeLength + snakeMaxTargetSize
      ? enemySnake.segments.length - (initialSnakeLength - 1)
      : snakeMaxTargetSize;
  const targetSegments = enemySnake.segments.slice(0 - targetSize);
  return targetSegments.some(segment =>
    isSamePosition(segment, playerSnakeHead)
  );
}

// Kill enemy snake and award point to player
function killSnake(enemySnake, playerSnake, io) {
  enemySnake.isAlive = false;
  enemySnake.deaths += 1;
  playerSnake.kills += 1;
  playerSnake.score += 1;
  io.to(enemySnake.id).emit("gameOver");
  console.log(
    `'${enemySnake.name}' was killed by '${playerSnake.name}' with ${enemySnake.score} points.`
  );
}

// Check if a snake has collided with food
function isFoodCollision(food, playerSnake) {
  const playerSnakeHead = playerSnake.segments[0];
  return isSamePosition(food, playerSnakeHead);
}

// Award snake a point and reset food
function eatFood(state, playerSnake) {
  playerSnake.score += 1;
  state.food = randomPosition();
}

// Check if a snake has collided with food
function isSpeedBoostCollision(speedBoost, playerSnake) {
  const playerSnakeHead = playerSnake.segments[0];
  return isSamePosition(speedBoost, playerSnakeHead);
}

// Award snake a point and reset food
function eatSpeedBoost(state, playerSnake) {
  playerSnake.score += 1;
  state.speedBoost = randomPosition();
}

module.exports = {
  stopGameIfEmpty,
  stopGameIfNoConnections,
  getAllTargetSegments,
  isEnemySnakeCollision,
  killSnake,
  isFoodCollision,
  eatFood,
  isSpeedBoostCollision,
  eatSpeedBoost,
};
