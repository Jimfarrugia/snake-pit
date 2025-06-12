import { adjectives, breeds } from "./dictionary.js";

// Capitalize the first character of a string
function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Get the time (in ms) remaining until duration has elapsed since startTime
export function getTimeRemaining(duration, startTime) {
  return duration - (Date.now() - startTime);
}

// Format time in ms as seconds with 1 decimal place
export function formatTimerText(milliseconds) {
  return (milliseconds / 1000).toFixed(1);
}

// Reset an effect timer element
export function resetTimer(timerElement) {
  timerElement.textContent = "";
  timerElement.style.display = "none";
}

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

// check if two snake segments are orthogonally adjacent (left/right/up/down)
export function isAdjacentSegments(a, b) {
  const xDistance = Math.abs(a.x - b.x);
  const yDistance = Math.abs(a.y - b.y);
  return xDistance + yDistance === 1;
}

// get the current direction of a snake segment
export function getSegmentDirection(currentSegment, prevSegment) {
  if (isAdjacentSegments(currentSegment, prevSegment)) {
    if (currentSegment.x < prevSegment.x) return "right";
    else if (currentSegment.x > prevSegment.x) return "left";
    else if (currentSegment.y < prevSegment.y) return "down";
    else if (currentSegment.y > prevSegment.y) return "up";
  }
  /* Not all segments will be adjacent to thier neighbours when an immune snake moves through
     the boundary to the other side of the grid. */
  if (currentSegment.y === prevSegment.y) {
    if (currentSegment.x === 1) return "left";
    else return "right";
  }
  if (currentSegment.x === prevSegment.x) {
    if (currentSegment.y === 1) return "up";
    else return "down";
  }
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
    if (nextSegment.y < currentSegment.y) {
      isAdjacentSegments(nextSegment, currentSegment)
        ? (cornerType = "left-up")
        : (cornerType = "left-down");
    } else {
      isAdjacentSegments(nextSegment, currentSegment)
        ? (cornerType = "left-down")
        : (cornerType = "left-up");
    }
  }
  if (segmentDirection === "right" && nextSegment.y !== currentSegment.y) {
    isCorner = true;
    if (nextSegment.y < currentSegment.y) {
      isAdjacentSegments(nextSegment, currentSegment)
        ? (cornerType = "right-up")
        : (cornerType = "right-down");
    } else {
      isAdjacentSegments(nextSegment, currentSegment)
        ? (cornerType = "right-down")
        : (cornerType = "right-up");
    }
  }
  if (segmentDirection === "up" && nextSegment.x !== currentSegment.x) {
    isCorner = true;
    if (nextSegment.x < currentSegment.x) {
      isAdjacentSegments(nextSegment, currentSegment)
        ? (cornerType = "left-up")
        : (cornerType = "right-up");
    } else {
      isAdjacentSegments(nextSegment, currentSegment)
        ? (cornerType = "right-up")
        : (cornerType = "left-up");
    }
  }
  if (segmentDirection === "down" && nextSegment.x !== currentSegment.x) {
    isCorner = true;
    if (nextSegment.x < currentSegment.x) {
      isAdjacentSegments(nextSegment, currentSegment)
        ? (cornerType = "left-down")
        : (cornerType = "right-down");
    } else {
      isAdjacentSegments(nextSegment, currentSegment)
        ? (cornerType = "right-down")
        : (cornerType = "left-down");
    }
  }
  return isCorner ? cornerType : "body";
}

// Return a class name for immunity status based on how much time is remaining for the effect
export function getImmunityStatus(immunityDuration, immunityTimeRemaining) {
  return immunityTimeRemaining < immunityDuration * 0.125
    ? "critical"
    : immunityTimeRemaining < immunityDuration / 4
    ? "quarter"
    : immunityTimeRemaining < immunityDuration / 2
    ? "half"
    : "full";
}

// Validate a player name.  Must not be empty and can only contain:
// letters, numbers, spaces, underscores, dashes
export const isValidName = name => /^[a-zA-Z0-9_\- ]+$/.test(name);

// Generate an alliterative default name for the player using words from dictionary.js
export function generatePlayerName(reservedNames = []) {
  const maxAttempts = 50;
  for (let i = 0; i < maxAttempts; i++) {
    const breed = breeds[Math.floor(Math.random() * breeds.length)];
    const matchingAdjectives = adjectives.filter(adj => adj[0] === breed[0]);
    const adjective =
      matchingAdjectives[Math.floor(Math.random() * matchingAdjectives.length)];
    const name = `${capitalize(adjective)} ${capitalize(breed)}`;
    if (isValidName(name) && !reservedNames.includes(name)) return name;
  }
  // fallback if all attempts fail
  return `Player${Math.floor(Math.random() * 100000)}`;
}

// Update the name status icon based on validity and availability
export function setNameStatusIcon(isValid, isAvailable, element) {
  if (!isValid) {
    element.textContent = "❌";
    element.style.color = "red";
  } else if (!isAvailable) {
    element.textContent = "❌";
    element.style.color = "orange";
  } else {
    element.textContent = "✅";
    element.style.color = "green";
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
