/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: execution-context.js
 * Layer: NexFarm Execution
 * NEES: NEM-007
 * ==========================================================
 *
 * Responsibility:
 * Create the execution context for NexFarm
 * operational workflows.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - execution-engine.js
 * - execution-report.js
 * - Future NexFarm execution services
 *
 * Must Never:
 * - Execute business logic
 * - Modify business events
 * - Update read models
 * - Synchronize external systems
 */

export function createExecutionContext({

  workflow = null,

  event = null,

  integration = null,

  kernel = null,

  lifecycle = null,

  timeline = null,

  projection = null,

  state = null,

  bus = null,

} = {}) {

  const supplierId =
    event?.payload?.supplierId ?? null;

  const deliveryId =
    event?.payload?.deliveryId ?? null;

  return Object.freeze({

    workflow,

    supplierId,

    deliveryId,

    event,

    integration,

    kernel,

    lifecycle,

    timeline,

    projection,

    state,

    bus,

  });

}