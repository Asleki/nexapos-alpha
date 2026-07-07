/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: state-engine.js
 * Layer: Application State Layer
 * NEES: M-002
 * ==========================================================
 *
 * Responsibility:
 * Coordinate all application state updates.
 *
 * The State Engine is the only component
 * responsible for replacing application state
 * and notifying subscribers.
 *
 * Depends On:
 * - state-store.js
 * - state-subscriber.js
 * - state-events.js
 *
 * Used By:
 * - Read Model Engine
 * - Future UI Runtime
 *
 * Must Never:
 * - Execute business logic
 * - Validate events
 * - Synchronize data
 * - Modify read models directly
 */

import {
  getAppState,
  setAppState
} from "./state-store.js";

import {
  notifySubscribers
} from "./state-subscriber.js";

import { StateEvent } from "./state-events.js";

export function initializeStateEngine() {

  notifySubscribers(getAppState());

  return {
    event: StateEvent.STATE_INITIALIZED,
    state: getAppState(),
  };

}

export function updateApplicationState(updater) {

  const currentState = getAppState();

  const nextState = updater(currentState);

  const updatedState = setAppState(nextState);

  notifySubscribers(updatedState);

  return {
    event: StateEvent.STATE_UPDATED,
    state: updatedState,
  };

}

export function resetApplicationState() {

  const updatedState = setAppState({});

  notifySubscribers(updatedState);

  return {
    event: StateEvent.STATE_RESET,
    state: updatedState,
  };

}