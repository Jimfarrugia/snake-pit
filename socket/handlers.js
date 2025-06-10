const {
  generateSnake,
  respawnSnake,
  addTestSnakes,
  destroyTestSnakes,
  respawnTestSnakes,
  logEvent,
} = require("../utils");
const state = require("../state");
const { isDevEnv } = require("../config");
const {
  handlePlayerConnect,
  handlePlayerDisconnect,
} = require("../gameLoopController");

function registerSocketHandlers(io) {
  io.on("connection", socket => {
    const { id } = socket;
    handlePlayerConnect(io, id);
    const snake = generateSnake(id);
    state.snakes.push(snake);
    logEvent(`'${id}' snake was created.`, id);

    socket.on("disconnect", reason => {
      logEvent(`'${id}' disconnected due to ${reason}.`, id);
      state.snakes = state.snakes.filter(s => s.id !== id);
      logEvent(`'${id}' snake was removed.`, id);
      handlePlayerDisconnect(id);
    });

    socket.on("joinGame", data => {
      snake.isAlive = true;
      snake.name = data.name;
      if (snake.deaths) {
        respawnSnake(snake);
        logEvent(`'${snake.name}' respawned.`, snake.id);
      } else {
        logEvent(`'${snake.name}' joined the game.`, snake.id);
      }
      state.isGameStarted = true;

      // Create test snakes in development environment
      if (isDevEnv) {
        const numOfTestSnakes = 3;
        destroyTestSnakes(state);
        addTestSnakes(numOfTestSnakes, state);
        // Ressurrect test snakes every 10 seconds.
        state.spawnTestSnakesInterval = setInterval(() => {
          const testSnakes = state.snakes.filter(
            snake => snake.id.includes("TestSnake") && snake.isAlive
          );
          if (testSnakes.length < numOfTestSnakes) {
            respawnTestSnakes(state);
          }
        }, 10000);
      }
    });

    socket.on("changeDirection", newDirection => {
      if (!snake || !snake.isAlive) return;

      const isOpposite =
        (snake.direction === "up" && newDirection === "down") ||
        (snake.direction === "down" && newDirection === "up") ||
        (snake.direction === "left" && newDirection === "right") ||
        (snake.direction === "right" && newDirection === "left");

      if (!isOpposite) {
        snake.nextDirection = newDirection;
      }
    });
  });
}

module.exports = registerSocketHandlers;
