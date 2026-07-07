/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: lifecycle-context.js
 * Layer: UniFry Lifecycle Integration
 * NEES: NEM-009
 * ==========================================================
 *
 * Responsibility:
 * Create the execution context used when
 * integrating workflow execution with the
 * UniFry Order Lifecycle.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - lifecycle-integration.js
 * - lifecycle-smoke-test.js
 *
 * Must Never:
 * - Execute lifecycle transitions
 * - Modify order state
 * - Publish events
 * - Synchronize external systems
 */

export function createLifecycleContext({
  workflow,
  event,
  orderId,
  currentStatus = null,
  nextStatus = null,
} = {}) {
  return Object.freeze({
    workflow,
    event,
    orderId,
    currentStatus,
    nextStatus,
    createdAt: new Date().toISOString(),
  });
}