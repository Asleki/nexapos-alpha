/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: event-bus-context.js
 * Layer: UniFry Event Bus Integration
 * NEES: NEM-011
 * ==========================================================
 *
 * Responsibility:
 * Create the execution context used when
 * publishing UniFry business events onto
 * the NexaPOS Event Bus.
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

export function createEventBusContext({
  workflow,
  event,
  orderId,
  channel = "UNIFRY",
  publisher = "UNIFRY_MODULE",
  publishedAt = new Date().toISOString(),
} = {}) {

  return Object.freeze({

    workflow,

    event,

    orderId,

    channel,

    publisher,

    publishedAt,

  });

}