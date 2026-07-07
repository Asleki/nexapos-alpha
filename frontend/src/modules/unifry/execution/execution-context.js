/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: execution-context.js
 * Layer: UniFry Execution
 * NEES: NEM-007
 * ==========================================================
 *
 * Responsibility:
 * Create the execution context for a complete
 * UniFry operational execution.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - execution-engine.js
 * - execution-smoke-test.js
 *
 * Must Never:
 * - Execute workflows
 * - Publish events
 * - Execute business logic
 * - Synchronize external systems
 */

export function createExecutionContext({

  workflow,

  event,

  integration = null,

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

    integration,

    kernel,

    lifecycle,

    timeline,

    projection,

    state,

    bus,

    startedAt: new Date().toISOString(),

  });

}