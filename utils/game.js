const { destroyTestSnakes } = require("./testSnake");
const { isDevEnv } = require("../config");

// stop the game loop if no snakes remain alive
function stopGameIfEmpty(state) {
  const remainingSnakes = state.snakes.filter(snake =>
    isDevEnv ? snake.isAlive && snake.id !== "tester" : snake.isAlive
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
    ? state.snakes.filter(s => s.id !== "tester")
    : state.snakes;
  if (!remainingSnakes.length) {
    const wasGameStarted = state.isGameStarted;
    state.isGameStarted = false;
    if (wasGameStarted) console.log("Game stopped. No players connected.");
  }
}

module.exports = {
  stopGameIfEmpty,
  stopGameIfNoConnections,
};
