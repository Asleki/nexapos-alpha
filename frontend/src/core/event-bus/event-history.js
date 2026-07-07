/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: event-history.js
 * Layer: System Event Bus
 * NEES: NEM-003
 * ==========================================================
 *
 * Responsibility:
 * Keep an in-memory history of events published
 * through the System Event Bus.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - event-publisher.js
 * - event-bus.js
 * - Future diagnostics
 * - Future NexVox observation layer
 *
 * Must Never:
 * - Execute business logic
 * - Notify subscribers
 * - Modify published events
 * - Persist event history
 */

const eventHistory = [];

export function recordEventHistory(entry) {
  eventHistory.push(Object.freeze({
    ...entry,
    recordedAt: new Date().toISOString(),
  }));

  return entry;
}

export function getEventHistory() {
  return [...eventHistory];
}

export function clearEventHistory() {
  eventHistory.length = 0;
}

export function getEventHistoryCount() {
  return eventHistory.length;
}