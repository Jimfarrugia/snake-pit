const { randomPosition } = require("./utils");

let snakes = [];
let food = randomPosition();
let speedBoost = randomPosition();
let immunity = null;
let lastImmunityEatenTime = null;
let isGameStarted = false;
let spawnTestSnakesInterval;

function resetGameState() {
  snakes = [];
  food = randomPosition();
  speedBoost = randomPosition();
  immunity = null;
  lastImmunityEatenTime = null;
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

  get immunity() {
    return immunity;
  },
  set immunity(val) {
    immunity = val;
  },

  get isGameStarted() {
    return isGameStarted;
  },
  set isGameStarted(val) {
    isGameStarted = val;
  },

  resetGameState,
};
