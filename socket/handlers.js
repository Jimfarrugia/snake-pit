const { generateSnake } = require("../utils/snakeUtils");
const state = require("../state");

function registerSocketHandlers(io) {
  io.on("connection", socket => {
    const { id } = socket;
    const snake = generateSnake(id);
    state.snakes.push(snake);

    console.log(`${id} connected...`);
    console.log(`${id}'s snake was added to the snakes array.`);

    socket.on("disconnect", reason => {
      console.log(`${id} disconnected due to ${reason}`);
      state.snakes = state.snakes.filter(s => s.id !== id);
      console.log(`${id}'s snake was removed from the snakes array.`);
    });

    socket.on("joinGame", data => {
      console.log(`${id} joined the game...`);
      snake.isAlive = true;
      // emit snake data to client
      socket.emit("newSnake", snake);
      // set moveInterval
    });

    socket.on("leaveGame", data => {
      console.log(`${id} left the game...`);
      snake.isAlive = false;
    });
  });
}

module.exports = registerSocketHandlers;
