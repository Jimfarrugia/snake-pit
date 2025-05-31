const { generateSnake } = require("../utils/snakeUtils");
const state = require("../state");

function registerSocketHandlers(io) {
  io.on("connection", socket => {
    console.log(`${socket.id} connected...`);

    const snake = generateSnake(socket.id);
    state.snakes.push(snake);
    console.log(state.snakes);

    socket.on("disconnect", () => {
      console.log(`${socket.id} disconnected...`);
      state.snakes = state.snakes.filter(s => s.id !== socket.id);
    });
  });
}

module.exports = registerSocketHandlers;
