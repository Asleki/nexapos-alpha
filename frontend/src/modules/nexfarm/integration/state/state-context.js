/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: state-context.js
 * Layer: NexFarm State Integration
 * NEES: NEM-012
 * ==========================================================
 *
 * Responsibility:
 * Create state integration context for
 * NexFarm operational workflows.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - state-integration.js
 * - state-report.js
 *
 * Must Never:
 * - Update state
 * - Modify business events
 * - Execute business logic
 * - Synchronize external systems
 */

export function createStateIntegrationContext({

  workflow = null,

  event = null,

  projection = null,

  state = null,

  supplierId = null,

  deliveryId = null,

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

    projection,

    state,

    updatedAt:
      new Date().toISOString(),

  });

}