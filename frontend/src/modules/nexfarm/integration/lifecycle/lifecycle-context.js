/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: lifecycle-context.js
 * Layer: NexFarm Lifecycle Integration
 * NEES: NEM-008
 * ==========================================================
 *
 * Responsibility:
 * Create the lifecycle integration context for
 * NexFarm operational workflows.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - lifecycle-integration.js
 * - lifecycle-report.js
 * - Future lifecycle integrations
 *
 * Must Never:
 * - Execute business logic
 * - Modify lifecycle states
 * - Update read models
 * - Synchronize external systems
 */

export function createLifecycleContext({

  workflow = null,

  event = null,

  lifecycle = null,

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

    lifecycle,

    currentStatus:
      lifecycle?.context?.currentStatus ??
      null,

    nextStatus:
      lifecycle?.context?.nextStatus ??
      null,

  });

}