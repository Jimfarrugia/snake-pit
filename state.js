const { randomPosition } = require("./utils");

const state = {
  snakes: [],
  food: randomPosition(),
  speedBoost: randomPosition(),
  immunity: randomPosition(),
  immunityRespawnTimeout: null,
  isGameStarted: false,
  spawnTestSnakesInterval: null,

  resetGameState() {
    if (this.immunityRespawnTimeout) {
      clearTimeout(this.immunityRespawnTimeout);
      this.immunityRespawnTimeout = null;
    }
    this.snakes = [];
    this.food = randomPosition();
    this.speedBoost = randomPosition();
    this.immunity = randomPosition();
    this.isGameStarted = false;
  },
};

module.exports = state;
