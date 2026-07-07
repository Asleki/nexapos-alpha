/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: state-events.js
 * Layer: Application State Layer
 * NEES: M-002
 * ==========================================================
 *
 * Responsibility:
 * Define application state lifecycle event names.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - state-store.js
 * - state-subscriber.js
 * - state-engine.js
 *
 * Must Never:
 * - Store state
 * - Mutate state
 * - Notify subscribers directly
 * - Execute business logic
 */

export const StateEvent = Object.freeze({

  STATE_INITIALIZED: "STATE_INITIALIZED",

  STATE_UPDATED: "STATE_UPDATED",

  STATE_RESET: "STATE_RESET",

  SUBSCRIBER_ADDED: "SUBSCRIBER_ADDED",

  SUBSCRIBER_REMOVED: "SUBSCRIBER_REMOVED",

});