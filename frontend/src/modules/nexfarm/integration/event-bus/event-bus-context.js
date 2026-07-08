/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: event-bus-context.js
 * Layer: NexFarm Event Bus Integration
 * NEES: NEM-011
 * ==========================================================
 *
 * Responsibility:
 * Create event bus integration context for
 * NexFarm operational workflows.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - event-bus-integration.js
 * - event-bus-report.js
 *
 * Must Never:
 * - Publish events
 * - Modify business events
 * - Execute business logic
 * - Synchronize external systems
 */

export function createEventBusContext({

  workflow = null,

  event = null,

  supplierId = null,

  deliveryId = null,

  channel = "NEXFARM",

  publisher = "NEXFARM_MODULE",

} = {}) {

  return Object.freeze({

    workflow,

    supplierId:
      supplierId ??
      event?.payload?.supplierId ??
      null,

    deliveryId:
      deliveryId ??
      event?.payload?.deliveryId ??
      null,

    event,

    channel,

    publisher,

    publishedAt:
      new Date().toISOString(),

  });

}