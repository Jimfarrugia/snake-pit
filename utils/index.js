const helpers = require("./helpers");
const logger = require("./logger");
const game = require("./game");
const snake = require("./snake");
const testSnake = require("./testSnake");

module.exports = {
  ...helpers,
  ...logger,
  ...game,
  ...snake,
  ...testSnake,
};
