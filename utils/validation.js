const { nameRegex } = require("../config");

// Validate a player's name input.
// Return an object to send as the response to the emit callback.
function validateName(state, id, name, fallbackName) {
  const isValidName = nameRegex.test(name);
  const isAvailable = !state.snakes.some(s => s.name === name && s.id !== id);
  const finalName = isValidName && isAvailable ? name : fallbackName;
  const reservedNames = isAvailable ? [] : state.snakes.map(s => s.name);
  return { isValidName, isAvailable, finalName, reservedNames };
}

module.exports = {
  validateName,
};
