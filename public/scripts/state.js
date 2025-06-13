import { generatePlayerName } from "./helpers.js";

export const state = {
  nameInputDebounceTimer: null,
  defaultPlayerName: generatePlayerName(),
  initialSnakeLength: null,
  snakeMaxTargetSize: null,
  playerName: null,
  food: null,
  speedBoost: null,
  immunity: null,
  initialSpeed: null,
  speedBoostTimeRemaining: 0,
  speedBoostDuration: null,
  immunityTimeRemaining: 0,
  immunityDuration: null,
  isGameStarted: false,
  playerSnake: null,
  enemySnakes: [],
};

export const socket = io();
