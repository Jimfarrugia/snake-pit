const { isSamePosition } = require("./helpers");
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
    if (isDevEnv) destroyTestSnakes(state);
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
    const wasGameStarted = state.isGameStarted;
    state.isGameStarted = false;
    if (wasGameStarted) console.log("Game stopped. No players connected.");
  }
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
  const isKill = targetSegments.some(segment => {
    // make sure enemy snake is still alive during collision
    // (prevents bug: extra kills added)
    // TODO: ^ check if this is still an issue
    return isSamePosition(segment, playerSnakeHead) && enemySnake.isAlive;
  });
  return isKill;
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

module.exports = {
  stopGameIfEmpty,
  stopGameIfNoConnections,
  isEnemySnakeCollision,
  killSnake,
};
