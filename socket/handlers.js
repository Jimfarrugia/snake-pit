const {
  generateSnake,
  respawnSnake,
  addTestSnakes,
  destroyTestSnakes,
  respawnTestSnakes,
  logEvent,
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
      // name must not be empty and can only contain:
      // letters, numbers, spaces, underscores, dashes
      const isValidName = /^[a-zA-Z0-9_\- ]+$/.test(name);
      const isAvailable = !state.snakes.some(
        s => s.name === name && s.id !== id
      );
      const finalName = isValidName && isAvailable ? name : fallbackName;
      const reservedNames = isAvailable ? [] : state.snakes.map(s => s.name);
      snake.name = finalName.trim();
      callback({ isValidName, isAvailable, finalName, reservedNames });

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
      const isOpposite =
        (snake.direction === "up" && newDirection === "down") ||
        (snake.direction === "down" && newDirection === "up") ||
        (snake.direction === "left" && newDirection === "right") ||
        (snake.direction === "right" && newDirection === "left");
      if (!isOpposite) {
        snake.nextDirection = newDirection;
      }
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
