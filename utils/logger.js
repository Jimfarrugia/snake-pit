const chalk = require("chalk");

const colorFns = [
  chalk.magenta,
  chalk.cyan,
  chalk.yellow,
  chalk.blue,
  chalk.hex("#FF69B4"), // hotpink
  chalk.hex("#FFA500"), // orange
  chalk.hex("#00FF7F"), // spring green
  chalk.hex("#1E90FF"), // dodger blue
  chalk.red,
  chalk.green,
  chalk.whiteBright,
];

// This will map IDs to colors as they appear
const idColorMap = new Map();
let nextColorIndex = 0;

// Get the color associated with an id
function getColorFnForId(id) {
  if (!idColorMap.has(id)) {
    const colorFn = colorFns[nextColorIndex % colorFns.length];
    idColorMap.set(id, colorFn);
    nextColorIndex++;
  }
  return idColorMap.get(id);
}

// Log to the console using the color assigned to the id
function logEvent(message, id = "server") {
  const colorFn = id === "server" ? chalk.gray : getColorFnForId(id);
  console.log(colorFn(message));
}

module.exports = {
  logEvent,
};
