import {
  generatePlayerName,
  isValidName,
  setNameStatusIcon,
} from "./utils/helpers.js";
import { drawName, drawNameInputMirror, drawNameWarning } from "./ui/draw.js";

const nameStatus = document.getElementById("name-status");
const nameInput = document.getElementById("name-input");
const tutorialOpenBtn = document.getElementById("tutorial-open-btn");

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
  document.getElementById("start-prompt").style.display = "none";
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
  document
    .getElementById("start-btn")
    .addEventListener("click", () => startGame(socket, state));

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
    if (!state.isGameStarted && isSpacebar) {
      event.preventDefault();
      startGame(socket, state);
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
  function handleSwipe(startX, startY, endX, endY) {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    let direction = "";
    if (absX > absY && absX > 30) {
      direction = deltaX > 0 ? "right" : "left";
    } else if (absY > 30) {
      direction = deltaY > 0 ? "down" : "up";
    }
    if (direction) {
      socket.emit("changeDirection", direction);
    }
  }
  function onTouchStart(e) {
    if (!state.isGameStarted) return;
    e.preventDefault();
    const touch = e.changedTouches[0];
    touchStartX = touch.screenX;
    touchStartY = touch.screenY;
  }
  function onTouchEnd(e) {
    if (!state.isGameStarted) return;
    e.preventDefault();
    const touch = e.changedTouches[0];
    handleSwipe(touchStartX, touchStartY, touch.screenX, touch.screenY);
  }
  document.addEventListener("touchstart", onTouchStart, { passive: false });
  document.addEventListener("touchend", onTouchEnd, { passive: false });

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
