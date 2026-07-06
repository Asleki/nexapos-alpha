/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: sync-state.js
 * Layer: Sync Orchestration Engine
 * NEES: SK-007
 * ==========================================================
 *
 * Responsibility:
 * Maintain synchronization state.
 */

import { event } from "./logger.js";

const syncState = {
  running: false,
  lastStartedAt: null,
  lastCompletedAt: null,
  lastFailedAt: null,
  lastResult: null
};

export function beginSync() {

  syncState.running = true;
  syncState.lastStartedAt = new Date().toISOString();

  event("SYNC_STATE_STARTED");
}

export function completeSync(result = "success") {

  syncState.running = false;
  syncState.lastCompletedAt = new Date().toISOString();
  syncState.lastResult = result;

  event("SYNC_STATE_COMPLETED", {
    result
  });
}

export function failSync(reason = "unknown") {

  syncState.running = false;
  syncState.lastFailedAt = new Date().toISOString();
  syncState.lastResult = reason;

  event("SYNC_STATE_FAILED", {
    reason
  });
}

export function getSyncState() {
  return {
    ...syncState
  };
}