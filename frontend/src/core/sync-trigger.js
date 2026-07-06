/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: sync-trigger.js
 * Layer: Offline State Manager
 * NEES: SK-006
 * ==========================================================
 *
 * Responsibility:
 * Determine when synchronization should be requested.
 *
 * Depends On:
 * offline-state.js
 * logger.js
 *
 * Used By:
 * Sync Engine
 * Application Bootstrap
 *
 * Must Never:
 * - Synchronize data
 * - Modify queued events
 * - Execute business logic
 */

import { subscribeToConnectivity } from "./offline-state.js";
import { event } from "./logger.js";

const listeners = new Set();

/**
 * Register a synchronization listener.
 */
export function onSyncRequested(listener) {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

function requestSync(reason) {
  event("SYNC_REQUESTED", { reason });

  for (const listener of listeners) {
    listener(reason);
  }
}

/**
 * Starts monitoring connectivity for sync opportunities.
 */
export function startSyncTrigger() {
  subscribeToConnectivity((state) => {
    if (state.isOnline) {
      requestSync("connectivity_restored");
    }
  });

  event("SYNC_TRIGGER_STARTED");
}