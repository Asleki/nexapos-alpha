/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * Offline State Manager
 * ==========================================================
 *
 * Tracks browser connectivity state.
 *
 * Responsibility:
 * - Detect online/offline changes.
 * - Expose current connectivity status.
 * - Notify other modules when connection changes.
 *
 * This file does NOT synchronize data.
 * Sync belongs to the Sync Engine.
 */

import { event } from "./logger.js";

let currentOnlineState = navigator.onLine;

const listeners = new Set();

export function isOnline() {
  return currentOnlineState;
}

export function isOffline() {
  return !currentOnlineState;
}

export function subscribeToConnectivity(listener) {
  listeners.add(listener);

  return function unsubscribe() {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  for (const listener of listeners) {
    listener({
      isOnline: currentOnlineState,
      isOffline: !currentOnlineState,
    });
  }
}

function updateOnlineState(nextState) {
  if (currentOnlineState === nextState) {
    return;
  }

  currentOnlineState = nextState;

  event("CONNECTIVITY_STATE_CHANGED", {
    isOnline: currentOnlineState,
    isOffline: !currentOnlineState,
  });

  notifyListeners();
}

export function startOfflineStateManager() {
  window.addEventListener("online", () => {
    updateOnlineState(true);
  });

  window.addEventListener("offline", () => {
    updateOnlineState(false);
  });

  event("OFFLINE_STATE_MANAGER_STARTED", {
    isOnline: currentOnlineState,
    isOffline: !currentOnlineState,
  });

  notifyListeners();
}