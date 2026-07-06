/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: sync-engine.js
 * Layer: Sync Orchestration Engine
 * NEES: SK-007
 * ==========================================================
 *
 * Responsibility:
 * Coordinate synchronization of queued events.
 *
 * Depends On:
 * persistent-event-queue.js
 * sync-trigger.js
 * sync-dispatcher.js
 * sync-state.js
 * sync-receipts.js
 * sync-metrics.js
 * sync-retry.js
 * logger.js
 *
 * Must Never:
 * - Know business modules
 * - Execute business logic
 * - Modify event payloads
 */

import { onSyncRequested } from "./sync-trigger.js";
import { restoreQueue } from "./persistent-event-queue.js";
import { dispatchBatchForSync } from "./sync-dispatcher.js";
import { beginSync, completeSync, failSync } from "./sync-state.js";
import { recordSyncReceipt } from "./sync-receipts.js";
import {
  recordSyncAttempt,
  recordSuccessfulSync,
  recordFailedSync
} from "./sync-metrics.js";
import {
  scheduleRetry,
  resetRetryPolicy
} from "./sync-retry.js";

import { log, event, error } from "./logger.js";

let syncRunning = false;

export async function synchronize() {

  if (syncRunning) {
    return;
  }

  syncRunning = true;

  beginSync();

  recordSyncAttempt();

  event("SYNC_STARTED");

  try {

    const queue = await restoreQueue();

    if (queue.length === 0) {

      completeSync("empty");

      resetRetryPolicy();

      syncRunning = false;

      return;
    }

    const receipts =
      await dispatchBatchForSync(queue);

    receipts.forEach(recordSyncReceipt);

    recordSuccessfulSync(receipts.length);

    completeSync("success");

    resetRetryPolicy();

    log(`Synchronization complete (${receipts.length} receipt(s)).`);

  } catch (err) {

    error("Synchronization failed.", err);

    failSync(err.message);

    recordFailedSync();

    scheduleRetry(() => {
      synchronize();
    });

  } finally {

    syncRunning = false;

  }

}

export function startSyncEngine() {

  onSyncRequested(() => {
    synchronize();
  });

  log("Sync Engine started.");

}