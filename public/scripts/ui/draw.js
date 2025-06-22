import {
  createGameElement,
  setElementPosition,
  getSegmentDirection,
  getBodySegmentType,
  getSnakeTargetSize,
  getImmunityStatus,
  resetTimer,
  formatTimerText,
} from "../utils/helpers.js";
import { state } from "../state.js";

const board = document.getElementById("game-board");
const immunityTimer = document.getElementById("immunity-timer");
const speedBoostTimer = document.getElementById("speed-boost-timer");

// draw game elements
export function drawGame() {
  board.innerHTML = "";
  drawPlayerSnake();
  drawEnemySnakes();
  drawFood();
  drawSpeedBoost();
  drawImmunity();
}

// stop the game
export function stopGame() {
  state.isGameStarted = false;
  if (state.practiceMode.isEnabled) {
    document.getElementById("player-name").textContent = "";
    document.getElementById("start-prompt").style.display = "none";
    document.getElementById("practice-prompt").style.display = "block";
  } else {
    document.getElementById("start-prompt").style.display = "block";
  }
  document.getElementById("tutorial-open-btn").style.display = "block";
  resetTimer(speedBoostTimer);
  resetTimer(immunityTimer);
  timers.style.display = "none";
}

// draw food on the board
function drawFood() {
  if (state.isGameStarted) {
    const foodElement = createGameElement("div", "food");
    setElementPosition(foodElement, state.food);
    board.appendChild(foodElement);
  }
}

// draw speed boost on the board
function drawSpeedBoost() {
  if (state.isGameStarted) {
    const speedBoostElement = createGameElement("div", "speed-boost");
    setElementPosition(speedBoostElement, state.speedBoost);
    board.appendChild(speedBoostElement);
  }
}

// draw immunity on the board
function drawImmunity() {
  if (state.isGameStarted && state.immunity) {
    const immunityElement = createGameElement("div", "immunity");
    setElementPosition(immunityElement, state.immunity);
    board.appendChild(immunityElement);
  }
}

// draw the players snake
function drawPlayerSnake() {
  if (state.isGameStarted && state.playerSnake) {
    drawSnakeSegments(state.playerSnake, true);
  }
}

// draw the enemy snakes
function drawEnemySnakes() {
  if (state.isGameStarted) {
    state.enemySnakes.forEach(enemy => {
      if (enemy.isAlive) drawSnakeSegments(enemy, false);
    });
  }
}

// draw the segments of a snake
function drawSnakeSegments(snake, isPlayer) {
  const { segments, direction, isImmune } = snake;
  segments.forEach((segment, i) => {
    const snakeElement = createGameElement("div", "snake");
    // Set CSS classes for snake segments
    const immunityStatus = getImmunityStatus(
      state.immunityDuration,
      state.immunityTimeRemaining
    );
    snakeElement.classList.add(
      ...(isPlayer ? [] : ["enemy"]),
      ...(isImmune ? ["immune", immunityStatus] : [])
    );
    if (i === 0) {
      // set the classes for the head segment
      snakeElement.classList.add("head", direction);
    } else if (i === segments.length - 1) {
      // set the classes for the tail segment
      const prevSegment = segments[i - 1];
      const segmentDirection = getSegmentDirection(segment, prevSegment);
      snakeElement.classList.add("tail", segmentDirection);
    } else {
      // determine if the current segment is a corner and/or a target segment
      const prevSegment = segments[i - 1];
      const nextSegment = segments[i + 1];
      const segmentDirection = getSegmentDirection(segment, prevSegment);
      const bodySegmentType = getBodySegmentType(
        segment,
        nextSegment,
        segmentDirection
      );
      const isCorner = bodySegmentType !== "body";
      const targetSize = getSnakeTargetSize(
        state.initialSnakeLength,
        segments.length,
        state.snakeMaxTargetSize
      );
      const isTarget = i > segments.length - 1 - targetSize;
      // set the classes for the body segments
      snakeElement.classList.add(
        bodySegmentType,
        segmentDirection,
        ...(isCorner ? ["corner"] : []),
        ...(isTarget && !isImmune ? ["target"] : [])
      );
    }
    setElementPosition(snakeElement, segment);
    board.appendChild(snakeElement);
  });
}

// draw player name
export function drawName() {
  if (state.isGameStarted) {
    const nameElement = document.getElementById("player-name");
    nameElement.innerHTML = `Playing as: <span>${state.playerName}</span>`;
  }
}

// Size the input element around the generated text
export function drawNameInputMirror(nameInputElement) {
  const mirror = document.createElement("span");
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = "pre";
  mirror.style.font = getComputedStyle(nameInputElement).font;
  mirror.textContent = nameInputElement.value;
  document.body.appendChild(mirror);
  nameInputElement.style.width = `${mirror.offsetWidth + 3}px`;
  mirror.remove();
}

// draw effect timers
export function drawTimers() {
  if (state.isGameStarted) {
    if (state.playerSnake.isImmune && state.immunityTimeRemaining > 0) {
      immunityTimer.style.display = "block";
      immunityTimer.textContent = formatTimerText(state.immunityTimeRemaining);
    } else {
      resetTimer(immunityTimer);
    }
    if (
      state.playerSnake.speed !== state.initialSpeed &&
      state.speedBoostTimeRemaining > 0
    ) {
      speedBoostTimer.style.display = "block";
      speedBoostTimer.textContent = formatTimerText(
        state.speedBoostTimeRemaining
      );
    } else {
      resetTimer(speedBoostTimer);
    }
  }
}

export function drawNameWarning(isValidName, isAvailable, fallbackName) {
  const nameWarning = document.getElementById("name-warning");
  if (!isValidName || !isAvailable) {
    nameWarning.style.display = "block";
    nameWarning.textContent = `The name you chose was ${
      !isAvailable ? "taken" : "invalid"
    }.  You will be known as `;
    const nameSpan = document.createElement("strong");
    nameSpan.textContent = fallbackName;
    nameWarning.appendChild(nameSpan);
    nameWarning.append(` until you change it.`);
  } else {
    nameWarning.style.display = "none";
  }
}

// draw the scoreboard
export function drawScoreboard(players) {
  document.getElementById("scoreboard").innerHTML = "";
  // Sort players by the higher of score or kills, then by the lower value as tiebreaker
  players.sort((a, b) => {
    const maxA = Math.max(a.score, a.kills);
    const maxB = Math.max(b.score, b.kills);
    if (maxA !== maxB) return maxB - maxA;
    const minA = Math.min(a.score, a.kills);
    const minB = Math.min(b.score, b.kills);
    return minB - minA;
  });
  // Generate scoreboard elements
  players.forEach((player, index) => {
    if (!player.name) return;
    // Rank and name
    const nameSpan = document.createElement("span");
    nameSpan.className = "scoreboard-name";
    const rankSpan = document.createElement("span");
    rankSpan.textContent = `${index + 1}. `;
    nameSpan.appendChild(rankSpan);
    nameSpan.append(player.name);
    // Stats
    const scoresDiv = document.createElement("div");
    scoresDiv.className = "scores";
    const scoreSpan = document.createElement("span");
    scoreSpan.title = "Score";
    scoreSpan.className = "scoreboard-score";
    scoreSpan.textContent = player.score;
    const killsSpan = document.createElement("span");
    killsSpan.title = "Kills";
    killsSpan.className = "scoreboard-kills";
    killsSpan.textContent = player.kills;
    const deathsSpan = document.createElement("span");
    deathsSpan.title = "Deaths";
    deathsSpan.className = "scoreboard-deaths";
    deathsSpan.textContent = player.deaths;
    // Build the li element & add it to the DOM
    const li = document.createElement("li");
    scoresDiv.appendChild(scoreSpan);
    scoresDiv.appendChild(killsSpan);
    scoresDiv.appendChild(deathsSpan);
    li.appendChild(nameSpan);
    li.appendChild(scoresDiv);
    scoreboard.appendChild(li);
  });
}
