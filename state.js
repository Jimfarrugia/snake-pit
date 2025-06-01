const { randomPosition } = require("./utils/snakeUtils");

let snakes = [];
let food = randomPosition();
let speedBoost = randomPosition();
let isGameStarted = false;

function resetGameState() {
  snakes = [];
  food = randomPosition();
  speedBoost = randomPosition();
  isGameStarted = false; // should be true if any snake has isAlive === true
}

module.exports = {
  get snakes() {
    return snakes;
  },
  set snakes(val) {
    snakes = val;
  },

  get food() {
    return food;
  },
  set food(val) {
    food = val;
  },

  get speedBoost() {
    return speedBoost;
  },
  set speedBoost(val) {
    speedBoost = val;
  },

  get isGameStarted() {
    return isGameStarted;
  },
  set isGameStarted(val) {
    isGameStarted = val;
  },

  resetGameState,
};
