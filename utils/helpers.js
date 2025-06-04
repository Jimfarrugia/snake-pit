const { gridSize } = require("../config");

// Generate a random grid position
function randomPosition() {
  const x = Math.floor(Math.random() * gridSize) + 1;
  const y = Math.floor(Math.random() * gridSize) + 1;
  return { x, y };
}

// Check if two grid positions are the same
function isSamePosition(a, b) {
  return a.x === b.x && a.y === b.y;
}

module.exports = {
  randomPosition,
  isSamePosition,
};
