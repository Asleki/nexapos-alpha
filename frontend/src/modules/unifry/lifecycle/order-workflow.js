/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: order-workflow.js
 * Layer: UniFry Order Lifecycle
 * NEES: NEM-004
 * ==========================================================
 *
 * Responsibility:
 * Translate UniFry business events into
 * lifecycle state transitions.
 *
 * Depends On:
 * - order-status.js
 *
 * Used By:
 * - Future Workflow Engine
 * - Future Event Bus Integration
 * - Future Kitchen Dashboard
 *
 * Must Never:
 * - Execute business logic
 * - Update read models
 * - Publish events
 * - Store timelines
 */

import { OrderStatus } from "./order-status.js";

const workflow = Object.freeze({

  UNIFRY_ORDER_CREATED: OrderStatus.CREATED,

  UNIFRY_ORDER_VALIDATED: OrderStatus.VALIDATED,

  UNIFRY_ORDER_QUEUED: OrderStatus.QUEUED,

  UNIFRY_PREPARATION_STARTED: OrderStatus.PREPARING,

  UNIFRY_ORDER_READY: OrderStatus.READY,

  UNIFRY_ORDER_COLLECTED: OrderStatus.COLLECTED,

  UNIFRY_ORDER_COMPLETED: OrderStatus.COMPLETED,

  UNIFRY_ORDER_CANCELLED: OrderStatus.CANCELLED,

});

/**
 * Resolve the lifecycle status represented
 * by a business event.
 */
export function resolveWorkflowStatus(eventType) {

  return workflow[eventType] ?? null;

}