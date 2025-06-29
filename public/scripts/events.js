import {
  generatePlayerName,
  isValidName,
  setNameStatusIcon,
} from "./utils/helpers.js";
import { drawName, drawNameInputMirror, drawNameWarning } from "./ui/draw.js";

const nameStatus = document.getElementById("name-status");
const nameInput = document.getElementById("name-input");
const tutorialOpenBtn = document.getElementById("tutorial-open-btn");
const numOfOpponentsSelect = document.getElementById("num-of-opponents-select");
const startPrompt = document.getElementById("start-prompt");
const practicePrompt = document.getElementById("practice-prompt");

// start the game
function startGame(socket, state) {
  state.playerName = nameInput.value;
  socket.emit(
    "joinGame",
    { name: state.playerName, fallbackName: state.defaultPlayerName },
    ({ isValidName, isAvailable, finalName, reservedNames }) => {
      if (state.playerName === state.defaultPlayerName && !isAvailable) {
        state.defaultPlayerName = generatePlayerName(reservedNames);
        nameInput.value = state.defaultPlayerName;
      }
      drawNameWarning(isValidName, isAvailable, finalName);
      state.playerName = finalName;
      drawName();
    }
  );
  state.isGameStarted = true;
  startPrompt.style.display = "none";
  tutorialOpenBtn.style.display = "none";
  timers.style.display = "flex";
}

// start a practice game
function startPractice(socket, state) {
  socket.emit("startPractice", {
    numOfOpponents: state.practiceMode.numOfOpponents,
  });
  state.isGameStarted = true;
  practicePrompt.style.display = "none";
  document.getElementById("player-name").textContent = "Practice Mode";
  tutorialOpenBtn.style.display = "none";
  timers.style.display = "flex";
}

// Setup event listeners
export function setupEventListeners(socket, state) {
  // Generate a default name for the player when the page loads
  window.addEventListener("DOMContentLoaded", () => {
    socket.emit(
      "checkNameAvailability",
      { name: state.defaultPlayerName, getReservedNames: true },
      ({ isAvailable, reservedNames }) => {
        if (!isAvailable) {
          state.defaultPlayerName = generatePlayerName(reservedNames);
        }
        nameInput.value = state.defaultPlayerName;
        drawNameInputMirror(nameInput);
      }
    );
  });

  // Start button click listener
  const joinGameBtn = startPrompt.getElementsByClassName("start-btn")[0];
  joinGameBtn.addEventListener("click", () => startGame(socket, state));

  // Practice mode enable button click listener
  document.getElementById("practice-mode-btn").addEventListener("click", () => {
    startPrompt.style.display = "none";
    practicePrompt.style.display = "block";
    state.practiceMode.isEnabled = true;
    state.practiceMode.numOfOpponents = parseInt(numOfOpponentsSelect.value);
  });

  // Practice mode back button click listener
  const practiceModeBackBtn =
    practicePrompt.getElementsByClassName("back-btn")[0];
  practiceModeBackBtn.addEventListener("click", () => {
    practicePrompt.style.display = "none";
    startPrompt.style.display = "block";
    state.practiceMode.isEnabled = false;
    socket.emit("endPractice");
  });

  // opponents select input change listener
  numOfOpponentsSelect.addEventListener("change", () => {
    state.practiceMode.numOfOpponents = parseInt(numOfOpponentsSelect.value);
  });

  // Practice mode start button click listener
  const practiceModeStartBtn =
    practicePrompt.getElementsByClassName("start-btn")[0];
  practiceModeStartBtn.addEventListener("click", () =>
    startPractice(socket, state)
  );

  // General keypress listener
  document.addEventListener("keydown", event => {
    // Don't do anything if an input element has focus
    const activeElement = document.activeElement;
    if (activeElement.tagName === "INPUT") return;
    const { key } = event;
    const isArrowKey = [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
    ].includes(key);
    const isSpacebar = key === " ";
    // Prevent scrolling during game
    if ((isArrowKey || isSpacebar) && state.isGameStarted) {
      event.preventDefault();
    }
    // Handle start game
    if (!state.isGameStarted && !state.isGameOver && isSpacebar) {
      event.preventDefault();
      state.practiceMode.isEnabled
        ? startPractice(socket, state)
        : startGame(socket, state);
      return;
    }
    // Handle change direction
    if (isArrowKey) {
      const direction = key.replace("Arrow", "").toLowerCase();
      socket.emit("changeDirection", direction);
    }
  });

  // Swipe detection
  let touchStartX = 0;
  let touchStartY = 0;
  let previousDirection = "";
  let directionSentThisGesture = false;
  document.addEventListener(
    "touchstart",
    e => {
      if (!state.isGameStarted) return;
      e.preventDefault();
      const touch = e.changedTouches[0];
      touchStartX = touch.screenX;
      touchStartY = touch.screenY;
      directionSentThisGesture = false;
    },
    { passive: false }
  );
  document.addEventListener(
    "touchmove",
    e => {
      if (!state.isGameStarted || directionSentThisGesture) return;
      e.preventDefault();
      const touch = e.changedTouches[0];
      const deltaX = touch.screenX - touchStartX;
      const deltaY = touch.screenY - touchStartY;
      const direction = getSwipeDirection(deltaX, deltaY);
      if (direction && direction !== previousDirection) {
        socket.emit("changeDirection", direction);
        previousDirection = direction;
        directionSentThisGesture = true;
      }
    },
    { passive: false }
  );
  document.addEventListener(
    "touchend",
    e => (directionSentThisGesture = false),
    { passive: false }
  );

  // Validate the name input field as the user types
  nameInput.addEventListener("input", () => {
    clearTimeout(state.nameInputDebounceTimer);
    state.nameInputDebounceTimer = setTimeout(() => {
      const name = nameInput.value;
      const isValid = isValidName(name);
      if (!isValid) {
        setNameStatusIcon(isValid, true, nameStatus);
        nameInput.setCustomValidity(
          "Only letters, numbers, spaces, underscores and dashes are allowed."
        );
        nameInput.reportValidity();
        return;
      }
      socket.emit(
        "checkNameAvailability",
        { name, getReservedNames: false },
        ({ isAvailable }) => {
          setNameStatusIcon(true, isAvailable, nameStatus);
          if (!isAvailable) {
            nameInput.setCustomValidity("This name is already taken.");
          } else {
            nameInput.setCustomValidity("");
          }
          nameInput.reportValidity();
        }
      );
    }, 200);
  });
  window.addEventListener("beforeunload", () =>
    clearTimeout(state.nameInputDebounceTimer)
  );

  // Pressing enter from the name input starts the game
  nameInput.addEventListener("keydown", event => {
    if (event.key === "Enter") startGame(socket, state);
  });
}

function getSwipeDirection(deltaX, deltaY) {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  if (absX > absY && absX > 30) {
    return deltaX > 0 ? "right" : "left";
  } else if (absY > absX && absY > 30) {
    return deltaY > 0 ? "down" : "up";
  }
  return "";
}
