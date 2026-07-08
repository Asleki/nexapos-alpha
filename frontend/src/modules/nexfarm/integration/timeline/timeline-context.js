/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: timeline-context.js
 * Layer: NexFarm Timeline Integration
 * NEES: NEM-010
 * ==========================================================
 *
 * Responsibility:
 * Create timeline integration context for
 * NexFarm operational workflows.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - timeline-integration.js
 * - timeline-report.js
 *
 * Must Never:
 * - Record timeline entries
 * - Modify business events
 * - Execute lifecycle transitions
 * - Synchronize external systems
 */

export function createTimelineContext({

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

    previousStatus:
      lifecycle?.context?.currentStatus ??
      null,

    currentStatus:
      lifecycle?.context?.nextStatus ??
      lifecycle?.context?.currentStatus ??
      null,

    recordedAt:
      new Date().toISOString(),

  });

}