/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: state-subscriber.js
 * Layer: Application State Layer
 * NEES: M-002
 * ==========================================================
 *
 * Responsibility:
 * Manage application state subscribers.
 *
 * Subscribers are notified whenever the
 * application state changes.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - state-engine.js
 * - Future UI Components
 *
 * Must Never:
 * - Store application state
 * - Execute business logic
 * - Synchronize data
 * - Validate business operations
 */

const subscribers = new Set();

/**
 * Register a state subscriber.
 */
export function subscribe(listener) {

  subscribers.add(listener);

  return () => unsubscribe(listener);

}

/**
 * Remove a state subscriber.
 */
export function unsubscribe(listener) {

  subscribers.delete(listener);

}

/**
 * Notify every subscriber of the latest state.
 */
export function notifySubscribers(state) {

  for (const listener of subscribers) {
    listener(state);
  }

}

/**
 * Return the number of active subscribers.
 */
export function getSubscriberCount() {

  return subscribers.size;

}