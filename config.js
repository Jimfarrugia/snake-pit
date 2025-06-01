module.exports = {
  gridSize: 25, // amount of rows and columns in the grid
  initialSnakeLength: 5, // amount of segments that snakes begin with
  initialSpeed: 200, // initial snake movement interval duration in ms
  speedBoostDuration: 5000, // duration of speed boost effect in ms
  speedBoostMultiplier: 0.75, // lower value = higher speed
  snakeTargetSize: 3, // amount of trailing snake segments that are vulnerable to attack
  tickRate: 25, // ms between game ticks
};
