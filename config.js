const env = process.env.NODE_ENV || "development";

module.exports = {
  gridSize: 25, // amount of rows and columns in the grid
  initialSnakeLength: 5, // amount of segments that snakes begin with
  initialSpeed: 200, // initial snake movement interval duration in ms
  immunityDuration: 15000, // duration of immunity effect in ms
  immunityRespawnCooldown: 20000, // time before immunity respawns in ms
  speedBoostDuration: 5000, // duration of speed boost effect in ms
  speedBoostMultiplier: 0.75, // lower value = higher speed
  snakeMaxTargetSize: 3, // max amount of trailing snake segments that are vulnerable to attack
  tickRate: 25, // ms between game ticks
  nameRegex: /^[a-zA-Z0-9_\- ]+$/, // valid name pattern: not empty & only letters, numbers, spaces, underscores, dashes
  numOfTestSnakes: 3, // Number of test snakes to spawn in dev environment
  isDevEnv: env === "development",
  env,
};
