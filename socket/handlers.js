const {
  generateSnake,
  respawnSnake,
  addTestSnakes,
  destroyTestSnakes,
  respawnTestSnakes,
  validateName,
  logEvent,
  setSnakeNewDirection,
} = require("../utils");
const state = require("../state");
const {
  isDevEnv,
  initialSpeed,
  initialSnakeLength,
  snakeMaxTargetSize,
  speedBoostDuration,
  immunityDuration,
} = require("../config");
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

    socket.emit("config", {
      initialSpeed,
      initialSnakeLength,
      snakeMaxTargetSize,
      speedBoostDuration,
      immunityDuration,
    });

    socket.on("disconnect", reason => {
      logEvent(`'${id}' disconnected due to ${reason}.`, id);
      state.snakes = state.snakes.filter(s => s.id !== id);
      logEvent(`'${id}' snake was removed.`, id);
      handlePlayerDisconnect(id);
    });

    socket.on("joinGame", ({ name, fallbackName }, callback) => {
      const { isValidName, isAvailable, finalName, reservedNames } =
        validateName(state, id, name.trim(), fallbackName.trim());
      callback({ isValidName, isAvailable, finalName, reservedNames });

      snake.name = finalName;
      snake.isAlive = true;
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
      setSnakeNewDirection(snake, newDirection);
    });

    socket.on(
      "checkNameAvailability",
      ({ name, getReservedNames }, callback) => {
        const isAvailable = !state.snakes.some(s => s.name === name);
        if (getReservedNames) {
          const reservedNames = state.snakes.map(s => s.name);
          callback({ isAvailable, reservedNames });
        } else {
          callback({ isAvailable });
        }
      }
    );
  });
}

module.exports = registerSocketHandlers;
