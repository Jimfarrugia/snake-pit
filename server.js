const express = require("express");
const { Server } = require("socket.io");
const path = require("path");

const config = require("./config");
const registerSocketHandlers = require("./socket/handlers");

const app = express();
app.use(express.static(path.join(__dirname, "public")));

const server = app.listen(3000);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000" },
});

// Socket logic
registerSocketHandlers(io);
