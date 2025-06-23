const helpers = require("./helpers");
const logger = require("./logger");
const game = require("./game");
const snake = require("./snake");
const npcSnake = require("./npcSnake");
const validation = require("./validation");

module.exports = {
  ...helpers,
  ...logger,
  ...game,
  ...snake,
  ...npcSnake,
  ...validation,
};
