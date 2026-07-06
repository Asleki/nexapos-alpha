/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: duplicate-validator.js
 * Layer: Event Validation Engine
 * NEES: SK-008
 * ==========================================================
 *
 * Responsibility:
 * Detect duplicate operational events.
 *
 * Alpha:
 * Uses an in-memory event registry.
 *
 * Future:
 * Persistent Event Index.
 */

const processedEvents = new Set();

export function validateDuplicate(event) {

  if (!event?.eventId) {
    return {
      valid: false,
      validator: "duplicate",
      reason: "Missing event ID."
    };
  }

  if (processedEvents.has(event.eventId)) {
    return {
      valid: false,
      validator: "duplicate",
      reason: "Duplicate event."
    };
  }

  return {
    valid: true,
    validator: "duplicate"
  };
}

/**
 * Marks an event as processed.
 */
export function registerProcessedEvent(eventId) {

  processedEvents.add(eventId);

}

/**
 * Clears duplicate tracking.
 */
export function clearProcessedEvents() {

  processedEvents.clear();

}