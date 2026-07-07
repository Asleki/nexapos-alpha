/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: order-lifecycle-report.js
 * Layer: UniFry Order Lifecycle
 * NEES: NEM-004
 * ==========================================================
 *
 * Responsibility:
 * Create a standardized report describing
 * the outcome of an order lifecycle transition.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - order-lifecycle.js
 *
 * Must Never:
 * - Execute business logic
 * - Validate transitions
 * - Publish events
 * - Modify timelines
 */

export function createOrderLifecycleReport({
  accepted,
  currentStatus,
  nextStatus,
  reason = null,
  evaluatedAt = new Date().toISOString(),
}) {

  return Object.freeze({

    accepted,

    currentStatus,

    nextStatus,

    reason,

    evaluatedAt,

  });

}