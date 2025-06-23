const {
  getOrCreatePlayerSnake,
  getOrCreatePracticeSnake,
  getActiveSnake,
  respawnSnake,
  setupNpcSnakes,
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
  mainRoom,
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
    const mainState = gameStates.get(mainRoom);
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
      cleanupPracticeRoom(id, gameStates);
    });

    socket.on("joinGame", ({ name, fallbackName }, callback) => {
      const { isValidName, isAvailable, finalName, reservedNames } =
        validateName(mainState, id, name.trim(), fallbackName.trim());
      callback({ isValidName, isAvailable, finalName, reservedNames });
      // Add player to main room
      socket.join(mainRoom);
      // Get or create the player's snake
      const snake = getOrCreatePlayerSnake(playerSnakes, id);
      snake.name = finalName;
      // Add snake to the main game's state
      if (!mainState.snakes.some(s => s.id === snake.id)) {
        mainState.snakes.push(snake);
      }
      mainState.isGameStarted = true;
      // Spawn or respawn the player's snake
      if (snake.deaths) {
        respawnSnake(snake);
        logEvent(`'${snake.name}' respawned.`, snake.id);
      } else {
        snake.isAlive = true;
        logEvent(`'${snake.name}' joined the game.`, snake.id);
      }
      // Create test snakes in development environment
      if (isDevEnv) {
        setupNpcSnakes(numOfTestSnakes, "TestSnake", 10000, mainState);
      }
    });

    // Setup a practice room & start a practice game
    socket.on("startPractice", ({ numOfOpponents }) => {
      const practiceRoom = `practice-${id}`;
      socket.leave(mainRoom);
      socket.join(practiceRoom);
      // Setup practice room state
      let practiceState;
      if (!gameStates.has(practiceRoom)) {
        practiceState = createGameState();
        practiceState.isPracticeGame = true;
        gameStates.set(practiceRoom, practiceState);
      } else {
        practiceState = gameStates.get(practiceRoom);
      }
      // Generate a new practice snake if one doesn't exist
      const snake = getOrCreatePracticeSnake(id, practiceState);
      // Spawn or respawn the snake into the game
      if (snake.deaths) {
        respawnSnake(snake);
        logEvent(`'${snake.name}' respawned in practice room.`, snake.id);
      } else {
        snake.isAlive = true;
        logEvent(`'${snake.name}' started practicing.`, snake.id);
      }
      // Start the game loop
      practiceState.isGameStarted = true;
      startGameLoop(io, practiceRoom, practiceState);
      // Add NPC opponents
      if (numOfOpponents > 0) {
        setupNpcSnakes(numOfOpponents, "PracticeSnake", 10000, practiceState);
      }
      logEvent(`Started practice game for ${id}`, id);
    });

    // Cleanup practice room
    socket.on("endPractice", () => {
      const practiceRoom = `practice-${id}`;
      socket.leave(practiceRoom);
      socket.join(mainRoom);
      cleanupPracticeRoom(id, gameStates);
    });

    socket.on("changeDirection", newDirection => {
      const snake = getActiveSnake(playerSnakes, id, gameStates);
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

// Remove the player's practice room, it's game loop and it's state
function cleanupPracticeRoom(id, gameStates) {
  const practiceRoom = `practice-${id}`;
  if (gameStates.has(practiceRoom)) {
    const practiceState = gameStates.get(practiceRoom);
    stopGameLoop(practiceRoom, practiceState);
    gameStates.delete(practiceRoom);
    logEvent(`Removed practice room for ${id}.`, id);
  }
}

module.exports = registerSocketHandlers;
