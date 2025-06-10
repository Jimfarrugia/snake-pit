const { randomPosition } = require("./utils");

const state = {
  gameIntervalId: null,
  connectedPlayers: new Set(),
  snakes: [],
  food: randomPosition(),
  speedBoost: randomPosition(),
  immunity: randomPosition(),
  immunityRespawnTimeout: null,
  isGameStarted: false,
  spawnTestSnakesInterval: null,

  resetGameState() {
    this.snakes = [];
    this.food = randomPosition();
    this.speedBoost = randomPosition();
    this.immunity = randomPosition();
    this.isGameStarted = false;
    if (this.immunityRespawnTimeout) {
      clearTimeout(this.immunityRespawnTimeout);
      this.immunityRespawnTimeout = null;
    }
    if (this.spawnTestSnakesInterval) {
      clearInterval(this.spawnTestSnakesInterval);
      this.spawnTestSnakesInterval = null;
    }
  },
};

module.exports = state;
