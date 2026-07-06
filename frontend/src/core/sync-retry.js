/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: sync-retry.js
 * Layer: Sync Orchestration Engine
 * NEES: SK-007
 * ==========================================================
 *
 * Responsibility:
 * Manage synchronization retry policy.
 */

import { event } from "./logger.js";

const DEFAULT_RETRY_DELAY_MS = 5000;
const MAX_RETRY_ATTEMPTS = 5;

let retryAttempts = 0;

export function resetRetryPolicy() {
  retryAttempts = 0;

  event("SYNC_RETRY_RESET");
}

export function getRetryState() {
  return {
    retryAttempts,
    maxRetryAttempts: MAX_RETRY_ATTEMPTS,
    nextRetryDelayMs: DEFAULT_RETRY_DELAY_MS
  };
}

export function scheduleRetry(callback) {

  if (retryAttempts >= MAX_RETRY_ATTEMPTS) {

    event("SYNC_RETRY_LIMIT_REACHED", {
      retryAttempts
    });

    return false;
  }

  retryAttempts++;

  event("SYNC_RETRY_SCHEDULED", {
    retryAttempts,
    delayMs: DEFAULT_RETRY_DELAY_MS
  });

  setTimeout(() => {
    callback();
  }, DEFAULT_RETRY_DELAY_MS);

  return true;
}