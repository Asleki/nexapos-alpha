/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * Event Queue Foundation
 * ==========================================================
 *
 * Temporary in-memory event queue.
 *
 * Future versions will persist events into IndexedDB
 * before synchronization.
 */

import { event, warn } from "./logger.js";

const queue = [];

/**
 * Add an event to the queue.
 */
export function enqueue(newEvent) {
  queue.push(newEvent);

  event("EVENT_ENQUEUED", {
    eventId: newEvent.eventId,
    eventType: newEvent.eventType,
    queueLength: queue.length,
  });

  return queue.length;
}

/**
 * Peek the next event.
 */
export function peek() {
  return queue.length > 0 ? queue[0] : null;
}

/**
 * Remove the next event.
 */
export function dequeue() {
  if (queue.length === 0) {
    warn("Attempted to dequeue from an empty queue.");
    return null;
  }

  return queue.shift();
}

/**
 * Read all queued events.
 */
export function getQueue() {
  return [...queue];
}

/**
 * Current queue size.
 */
export function size() {
  return queue.length;
}

/**
 * Empty the queue.
 */
export function clear() {
  queue.length = 0;

  event("QUEUE_CLEARED");
}