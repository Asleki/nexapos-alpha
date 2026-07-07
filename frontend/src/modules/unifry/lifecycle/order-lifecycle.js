/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: order-lifecycle.js
 * Layer: UniFry Order Lifecycle
 * NEES: NEM-004
 * ==========================================================
 *
 * Responsibility:
 * Coordinate lifecycle progression for
 * UniFry customer orders.
 *
 * Depends On:
 * - order-transition.js
 * - order-lifecycle-report.js
 *
 * Used By:
 * - order-workflow.js
 * - Future Kitchen Dashboard
 * - Future Manager Dashboard
 *
 * Must Never:
 * - Execute kitchen operations
 * - Publish events
 * - Store timelines
 * - Execute financial logic
 */

import { isValidTransition } from "./order-transition.js";
import { createOrderLifecycleReport } from "./order-lifecycle-report.js";

export function progressOrderLifecycle({
  currentStatus,
  nextStatus,
}) {

  const allowed = isValidTransition(
    currentStatus,
    nextStatus
  );

  if (!allowed) {

    return createOrderLifecycleReport({
      accepted: false,
      currentStatus,
      nextStatus,
      reason: "Invalid lifecycle transition.",
    });

  }

  return createOrderLifecycleReport({
    accepted: true,
    currentStatus,
    nextStatus,
    reason: null,
  });

}