/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: workflow-context.js
 * Layer: UniFry Workflow Integration
 * NEES: NEM-006
 * ==========================================================
 *
 * Responsibility:
 * Create the execution context shared by all
 * workflow integration components.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - workflow-integration.js
 * - workflow-smoke-test.js
 *
 * Must Never:
 * - Execute business logic
 * - Publish events
 * - Modify event payloads
 * - Synchronize external systems
 */

export function createWorkflowContext({

  workflow,

  event,

  kernel = null,

  lifecycle = null,

  timeline = null,

  projection = null,

  state = null,

  bus = null,

} = {}) {

  return Object.freeze({

    workflow,

    event,

    kernel,

    lifecycle,

    timeline,

    projection,

    state,

    bus,

    createdAt: new Date().toISOString(),

  });

}