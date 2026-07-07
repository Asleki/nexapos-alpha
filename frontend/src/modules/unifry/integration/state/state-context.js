/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: state-context.js
 * Layer: UniFry State Integration
 * NEES: NEM-012
 * ==========================================================
 *
 * Responsibility:
 * Create the execution context used when
 * integrating UniFry workflow execution with
 * the NexaPOS Application State Layer.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - state-integration.js
 * - state-smoke-test.js
 *
 * Must Never:
 * - Update application state
 * - Execute business logic
 * - Modify source events
 * - Synchronize external systems
 */

export function createStateIntegrationContext({
  workflow,
  event,
  orderId,
  projection = null,
  state = null,
  updatedAt = new Date().toISOString(),
} = {}) {

  return Object.freeze({

    workflow,

    event,

    orderId,

    projection,

    state,

    updatedAt,

  });

}