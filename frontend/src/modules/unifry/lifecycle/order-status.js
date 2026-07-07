/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: order-status.js
 * Layer: UniFry Order Lifecycle
 * NEES: NEM-004
 * ==========================================================
 *
 * Responsibility:
 * Define every valid lifecycle status for
 * a UniFry customer order.
 *
 * These statuses represent business state only.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - order-transition.js
 * - order-lifecycle.js
 * - order-workflow.js
 * - Future Kitchen Dashboard
 * - Future Manager Dashboard
 *
 * Must Never:
 * - Execute business logic
 * - Validate transitions
 * - Publish events
 * - Modify timelines
 */

export const OrderStatus = Object.freeze({

  CREATED: "created",

  VALIDATED: "validated",

  QUEUED: "queued",

  PREPARING: "preparing",

  READY: "ready",

  COLLECTED: "collected",

  COMPLETED: "completed",

  CANCELLED: "cancelled",

});