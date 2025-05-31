import {
  gridSize,
  initialSnakeLength,
  initialSpeed,
  speedBoostDuration,
  speedBoostMultiplier,
  snakeTargetSize,
} from "./config.js";

// Create a game element in the DOM
export function createGameElement(tag, className) {
  const element = document.createElement(tag);
  element.className = className;
  return element;
}

// set the grid position of an element
export function setElementPosition(element, position) {
  element.style.gridColumn = position.x;
  element.style.gridRow = position.y;
}

// generate a random position on the grid
export function randomPosition() {
  const x = Math.floor(Math.random() * gridSize) + 1;
  const y = Math.floor(Math.random() * gridSize) + 1;
  return { x, y };
}

// randomly pick an orientation for a new snake
export function randomOrientation() {
  return Math.round(Math.random()) ? "vertical" : "horizontal";
}

// Set the initial direction of movement (away from the nearest boundary)
export function setInitialDirection(position, orientation) {
  // move away from the nearest boundary
  if (orientation === "horizontal") {
    return position.y >= gridSize / 2 ? "up" : "down";
  } else {
    return position.x >= gridSize / 2 ? "left" : "right";
  }
}

// get the current direction of a snake segment
export function getSegmentDirection(currentSegment, prevSegment) {
  if (currentSegment.x < prevSegment.x) return "right";
  else if (currentSegment.x > prevSegment.x) return "left";
  else if (currentSegment.y < prevSegment.y) return "down";
  else if (currentSegment.y > prevSegment.y) return "up";
}

// determine whether a snake body segment is a corner and if so, which type of corner
export function getBodySegmentType(
  currentSegment,
  nextSegment,
  segmentDirection
) {
  let isCorner = false;
  let cornerType = "";
  if (segmentDirection === "left" && nextSegment.y !== currentSegment.y) {
    isCorner = true;
    nextSegment.y < currentSegment.y
      ? (cornerType = "left-up")
      : (cornerType = "left-down");
  }
  if (segmentDirection === "right" && nextSegment.y !== currentSegment.y) {
    isCorner = true;
    nextSegment.y < currentSegment.y
      ? (cornerType = "right-up")
      : (cornerType = "right-down");
  }
  if (segmentDirection === "up" && nextSegment.x !== currentSegment.x) {
    isCorner = true;
    nextSegment.x < currentSegment.x
      ? (cornerType = "left-up")
      : (cornerType = "right-up");
  }
  if (segmentDirection === "down" && nextSegment.x !== currentSegment.x) {
    isCorner = true;
    nextSegment.x < currentSegment.x
      ? (cornerType = "left-down")
      : (cornerType = "right-down");
  }
  return isCorner ? cornerType : "body";
}
