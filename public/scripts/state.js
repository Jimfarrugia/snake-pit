import { generatePlayerName } from "./utils/helpers.js";

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
  isGameOver: null,
  playerSnake: null,
  enemySnakes: [],
  practiceMode: {
    isEnabled: null,
    numOfOpponents: 0,
  },
};

// Connect to socket.io
export const socket = io();
