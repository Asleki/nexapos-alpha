/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * Persistent Event Queue
 * ==========================================================
 *
 * Bridges the in-memory event queue with persistent storage.
 *
 * Responsibility:
 * - Save newly created events.
 * - Restore queued events after application restart.
 * - Prepare events for future synchronization.
 *
 * This layer never communicates directly with a server.
 */

import { enqueue, getQueue, clear } from "./event-queue.js";
import { saveEvent, loadEvents } from "./storage.js";
import { event, error } from "./logger.js";

/**
 * Add an event to both memory and persistent storage.
 */
export async function enqueuePersistent(newEvent) {
  enqueue(newEvent);

  await saveEvent(newEvent);

  event("PERSISTENT_EVENT_ENQUEUED", {
    eventId: newEvent.eventId,
  });
}

/**
 * Restore all locally stored events.
 */
export async function restoreQueue() {
  try {
    const storedEvents = await loadEvents();

    clear();

    for (const item of storedEvents) {
      enqueue(item);
    }

    event("QUEUE_RESTORED", {
      restoredEvents: storedEvents.length,
    });

    return getQueue();

  } catch (err) {

    error("Unable to restore persistent queue.", err);

    return [];
  }
}