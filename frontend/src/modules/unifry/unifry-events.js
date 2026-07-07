/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: unifry-events.js
 * Layer: UniFry Module
 * NEES: Business Module Execution Layer
 * ==========================================================
 *
 * Responsibility:
 * Define UniFry event creation helpers.
 *
 * Depends On:
 * - event-schema.js
 *
 * Used By:
 * - UniFry UI
 * - Future UniFry workflows
 *
 * Must Never:
 * - Execute kernel logic
 * - Validate events
 * - Synchronize events
 * - Store events directly
 */

import { createEvent } from "../../core/event-schema.js";

export function createUniFryOrderCreatedEvent({
  orderId = crypto.randomUUID(),
  itemName = "Fries",
  quantity = 1,
  amount = 0,
  currency = "KES",
  context = {},
} = {}) {
  return createEvent({
    type: "UNIFRY_ORDER_CREATED",
    context,
    payload: {
      orderId,
      itemName,
      quantity,
      amount,
      currency,
      status: "created",
    },
  });
}