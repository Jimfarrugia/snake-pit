const helpers = require("./helpers");
const game = require("./game");
const snake = require("./snake");
const testSnake = require("./testSnake");

module.exports = {
  ...helpers,
  ...game,
  ...snake,
  ...testSnake,
};
