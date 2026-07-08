/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: workflow-context.js
 * Layer: NexFarm Workflow
 * NEES: NEM-005
 * ==========================================================
 *
 * Responsibility:
 * Create workflow context objects for
 * NexFarm operational workflows.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - workflow-engine.js
 * - workflow-integration.js
 * - workflow-smoke-test.js
 *
 * Must Never:
 * - Execute business logic
 * - Modify business events
 * - Update read models
 * - Synchronize external systems
 */

export function createWorkflowContext({

  workflow = null,

  event = null,

  kernel = null,

  lifecycle = null,

  timeline = null,

  projection = null,

  state = null,

  bus = null,

} = {}) {

  return Object.freeze({

    workflow,

    supplierId:
      event?.payload?.supplierId ?? null,

    deliveryId:
      event?.payload?.deliveryId ?? null,

    event,

    kernel,

    lifecycle,

    timeline,

    projection,

    state,

    bus,

  });

}