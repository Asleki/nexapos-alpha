/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: queue-recovery.js
 * Layer: Offline State Manager
 * NEES: SK-006
 * ==========================================================
 *
 * Responsibility:
 * Recover persisted events when the application starts.
 *
 * Depends On:
 * persistent-event-queue.js
 * logger.js
 *
 * Used By:
 * Application Bootstrap
 * Sync Engine
 *
 * Must Never:
 * - Synchronize events
 * - Delete events
 * - Execute business logic
 */

import { restoreQueue } from "./persistent-event-queue.js";
import { log, error } from "./logger.js";

export async function recoverEventQueue() {
  try {

    const queue = await restoreQueue();

    log(`Recovered ${queue.length} queued event(s).`);

    return queue;

  } catch (err) {

    error("Queue recovery failed.", err);

    return [];
  }
}