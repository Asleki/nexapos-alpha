/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: state-store.js
 * Layer: Application State Layer
 * NEES: M-002
 * ==========================================================
 *
 * Responsibility:
 * Maintain the current immutable application state.
 *
 * This file is the single source of truth for the
 * running application's state.
 *
 * Depends On:
 * - app-state.js
 *
 * Used By:
 * - state-engine.js
 * - state-subscriber.js
 * - Future UI Components
 *
 * Must Never:
 * - Execute business logic
 * - Notify subscribers
 * - Synchronize data
 * - Validate business operations
 */

import { createInitialAppState } from "./app-state.js";

let currentState = createInitialAppState();

/**
 * Return the current application state.
 */
export function getAppState() {
  return currentState;
}

/**
 * Replace the current application state.
 */
export function setAppState(nextState) {

  currentState = Object.freeze({
    ...nextState
  });

  return currentState;

}

/**
 * Reset the application state.
 */
export function resetAppState() {

  currentState = createInitialAppState();

  return currentState;

}