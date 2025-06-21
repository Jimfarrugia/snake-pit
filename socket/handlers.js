const {
  generateSnake,
  respawnSnake,
  setupTestSnakes,
  validateName,
  logEvent,
  setSnakeNewDirection,
} = require("../utils");
const { createGameState } = require("../state/stateFactory");
const { playerSnakes } = require("../state/globalState");
const {
  isDevEnv,
  numOfTestSnakes,
  initialSpeed,
  initialSnakeLength,
  snakeMaxTargetSize,
  speedBoostDuration,
  immunityDuration,
} = require("../config");
const {
  startGameLoop,
  handlePlayerConnect,
  handlePlayerDisconnect,
  stopGameLoop,
} = require("../gameLoopController");

function registerSocketHandlers(io, gameStates) {
  io.on("connection", socket => {
    const { id } = socket;
    // Start the game loop if they're the first player online
    const mainState = gameStates.get("main-game");
    handlePlayerConnect(io, id, mainState);

    // Send config values to client
    socket.emit("config", {
      initialSpeed,
      initialSnakeLength,
      snakeMaxTargetSize,
      speedBoostDuration,
      immunityDuration,
    });

    socket.on("disconnect", reason => {
      logEvent(`'${id}' disconnected: ${reason}`, id);
      // Remove the player's snake from the main room and their entry in connectedPLayers
      // Stop the main game loop if this is the last player to leave
      handlePlayerDisconnect(id, mainState);

      // Remove the player's practice room, it's game loop and it's state
      const practiceRoom = `practice-${id}`;
      if (gameStates.has(practiceRoom)) {
        const practiceState = gameStates.get(practiceRoom);
        stopGameLoop(practiceState);
        gameStates.delete(practiceRoom);
        logEvent(`Removed practice room for ${id}.`, id);
      }
    });

    socket.on("joinGame", ({ name, fallbackName }, callback) => {
      const { isValidName, isAvailable, finalName, reservedNames } =
        validateName(mainState, id, name.trim(), fallbackName.trim());
      callback({ isValidName, isAvailable, finalName, reservedNames });

      // Add player to main room
      socket.join("main-game");

      // Create a snake in the main game
      let snake = playerSnakes.get(id);
      if (!snake) {
        snake = generateSnake(socket.id);
        playerSnakes.set(id, snake);
        logEvent(`'${id}' snake was created.`, id);
      }

      snake.name = finalName;
      mainState.snakes.push(snake);
      mainState.isGameStarted = true;

      if (snake.deaths) {
        respawnSnake(snake);
        logEvent(`'${snake.name}' respawned.`, snake.id);
      } else {
        snake.isAlive = true;
        logEvent(`'${snake.name}' joined the game.`, snake.id);
      }

      // Create test snakes in development environment
      if (isDevEnv) {
        setupTestSnakes(mainState, numOfTestSnakes, 10000);
      }
    });

    socket.on("changeDirection", newDirection => {
      const snake = playerSnakes.get(id);
      if (!snake || !snake.isAlive) return;
      setSnakeNewDirection(snake, newDirection);
    });

    socket.on(
      "checkNameAvailability",
      ({ name, getReservedNames }, callback) => {
        const isAvailable = !mainState.snakes.some(s => s.name === name);
        if (getReservedNames) {
          const reservedNames = mainState.snakes.map(s => s.name);
          callback({ isAvailable, reservedNames });
        } else {
          callback({ isAvailable });
        }
      }
    );
  });
}

module.exports = registerSocketHandlers;
