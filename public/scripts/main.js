import "./tutorialModal.js";
import { state, socket } from "./state.js";
import { setupEventListeners } from "./events.js";
import { setupSocketHandlers } from "./socketHandlers.js";

setupEventListeners(socket, state);
setupSocketHandlers(socket, state);
