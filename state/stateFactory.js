// stateFactory.js
const { randomPosition } = require("../utils");

function createGameState() {
  return {
    gameIntervalId: null,
    snakes: [],
    food: randomPosition(),
    speedBoost: randomPosition(),
    immunity: randomPosition(),
    immunityRespawnTimeout: null,
    isGameStarted: false,
    isPracticeGame: null,
    spawnNpcSnakesInterval: null,

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

      if (this.spawnNpcSnakesInterval) {
        clearInterval(this.spawnNpcSnakesInterval);
        this.spawnNpcSnakesInterval = null;
      }
    },
  };
}

module.exports = { createGameState };
