/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: event-bus-report.js
 * Layer: UniFry Event Bus Integration
 * NEES: NEM-011
 * ==========================================================
 *
 * Responsibility:
 * Create a standardized report describing
 * the result of publishing a UniFry event
 * to the NexaPOS Event Bus.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - event-bus-integration.js
 * - event-bus-smoke-test.js
 *
 * Must Never:
 * - Publish events
 * - Modify source events
 * - Execute business logic
 * - Synchronize external systems
 */

export function createEventBusIntegrationReport({
  accepted,
  context = null,
  publication = null,
  reason = null,
  completedAt = new Date().toISOString(),
} = {}) {

  return Object.freeze({

    accepted,

    context,

    publication,

    reason,

    completedAt,

  });

}