const {
  generateSnake,
  respawnSnake,
  generateTestSnake,
} = require("../utils/snakeUtils");
const state = require("../state");
const env = process.env.NODE_ENV || "development";

function registerSocketHandlers(io) {
  io.on("connection", socket => {
    const { id } = socket;
    const snake = generateSnake(id);
    state.snakes.push(snake);

    console.log(`${id} connected.`);
    console.log(`${id}'s snake was created.`);

    socket.on("disconnect", reason => {
      console.log(`${id} disconnected due to ${reason}.`);
      state.snakes = state.snakes.filter(s => s.id !== id);
      console.log(`${id}'s snake was removed.`);
      // ! Disregard test snakes
      const remainingSnakes = state.snakes.filter(s => s.id !== "tester");
      // ! ^
      if (!remainingSnakes.length) {
        const wasGameStarted = state.isGameStarted;
        state.isGameStarted = false;
        if (wasGameStarted) console.log("Game stopped. No players connected.");
      }
    });

    socket.on("joinGame", data => {
      snake.isAlive = true;
      if (snake.deaths) {
        respawnSnake(snake);
        console.log(`${id} respawned.`);
      } else {
        console.log(`${id} joined the game.`);
      }
      state.isGameStarted = true;
      console.log("Game started.");

      // ! Only run this in development
      if (env === "development") {
        // ! remove old test snake(s)
        state.snakes = state.snakes.filter(s => s.id !== "tester");
        // ! Spawn test snake(s)
        state.snakes.push(generateTestSnake());
        state.snakes.push(generateTestSnake());
        state.snakes.push(generateTestSnake());
      }
      // ! ^
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
