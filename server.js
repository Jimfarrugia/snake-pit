const express = require("express");
const { Server } = require("socket.io");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const config = require("./config");
const registerSocketHandlers = require("./socket/handlers");
const gameLoop = require("./gameLoop");
const state = require("./state");

const app = express();
app.use(express.static(path.join(__dirname, "public")));

const port = process.env.PORT || 3000;
const server = app.listen(port);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN,
    methods: ["GET", "POST"],
  },
});

// Socket logic
registerSocketHandlers(io);

// Game loop interval
setInterval(() => {
  if (state.isGameStarted) {
    gameLoop(io);
  }
}, config.tickRate);
