/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: order-transition.js
 * Layer: UniFry Order Lifecycle
 * NEES: NEM-004
 * ==========================================================
 *
 * Responsibility:
 * Define every valid lifecycle transition for
 * UniFry customer orders.
 *
 * Depends On:
 * - order-status.js
 *
 * Used By:
 * - order-lifecycle.js
 * - Future Workflow Engine
 * - Future Kitchen Dashboard
 *
 * Must Never:
 * - Execute business logic
 * - Modify order state
 * - Publish events
 * - Store timelines
 */

import { OrderStatus } from "./order-status.js";

export const OrderTransition = Object.freeze({

  [OrderStatus.CREATED]: [
    OrderStatus.VALIDATED,
    OrderStatus.CANCELLED,
  ],

  [OrderStatus.VALIDATED]: [
    OrderStatus.QUEUED,
    OrderStatus.CANCELLED,
  ],

  [OrderStatus.QUEUED]: [
    OrderStatus.PREPARING,
    OrderStatus.CANCELLED,
  ],

  [OrderStatus.PREPARING]: [
    OrderStatus.READY,
    OrderStatus.CANCELLED,
  ],

  [OrderStatus.READY]: [
    OrderStatus.COLLECTED,
  ],

  [OrderStatus.COLLECTED]: [
    OrderStatus.COMPLETED,
  ],

  [OrderStatus.COMPLETED]: [],

  [OrderStatus.CANCELLED]: [],

});

/**
 * Determine whether a lifecycle transition
 * is permitted.
 */
export function isValidTransition(
  currentStatus,
  nextStatus
) {

  const allowed =
    OrderTransition[currentStatus] ?? [];

  return allowed.includes(nextStatus);

}