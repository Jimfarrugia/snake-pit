const {
  generateSnake,
  respawnSnake,
  generateTestSnake,
  destroyTestSnakes,
  stopGameIfNoConnections,
} = require("../utils/snakeUtils");
const state = require("../state");
const { isDevEnv } = require("../config");

function registerSocketHandlers(io) {
  io.on("connection", socket => {
    const { id } = socket;
    const snake = generateSnake(id);
    state.snakes.push(snake);

    console.log(`'${id}' connected.`);
    console.log(`'${id}' snake was created.`);

    socket.on("disconnect", reason => {
      console.log(`'${id}' disconnected due to ${reason}.`);
      state.snakes = state.snakes.filter(s => s.id !== id);
      console.log(`'${id}' snake was removed.`);
      stopGameIfNoConnections(state);
    });

    socket.on("joinGame", data => {
      snake.isAlive = true;
      snake.name = data.name;
      if (snake.deaths) {
        respawnSnake(snake);
        console.log(`'${snake.name}' respawned.`);
      } else {
        console.log(`'${snake.name}' joined the game.`);
      }
      state.isGameStarted = true;
      console.log("Game started.");
      // Create test snakes in development environment
      if (isDevEnv) {
        destroyTestSnakes(state);
        state.snakes.push(generateTestSnake());
        state.snakes.push(generateTestSnake());
        state.snakes.push(generateTestSnake());
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
