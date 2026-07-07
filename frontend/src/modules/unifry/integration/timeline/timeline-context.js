/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: timeline-context.js
 * Layer: UniFry Timeline Integration
 * NEES: NEM-010
 * ==========================================================
 *
 * Responsibility:
 * Create the execution context used when
 * recording UniFry order lifecycle timeline entries.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - timeline-integration.js
 * - timeline-smoke-test.js
 *
 * Must Never:
 * - Record timeline entries
 * - Execute lifecycle transitions
 * - Publish events
 * - Synchronize external systems
 */

export function createTimelineContext({
  workflow,
  event,
  orderId,
  previousStatus = null,
  currentStatus = null,
  actorId = null,
  timestamp = new Date().toISOString(),
} = {}) {
  return Object.freeze({
    workflow,
    event,
    orderId,
    previousStatus,
    currentStatus,
    actorId,
    timestamp,
    createdAt: new Date().toISOString(),
  });
}