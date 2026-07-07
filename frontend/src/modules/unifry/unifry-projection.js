/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: unifry-projection.js
 * Layer: UniFry Module
 * NEES: Business Module Execution Layer
 * ==========================================================
 *
 * Responsibility:
 * Project UniFry events into a derived read model.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - Read Model Engine
 * - UniFry UI
 *
 * Must Never:
 * - Modify source events
 * - Execute kernel logic
 * - Synchronize events
 * - Store source events
 */

export const UNIFRY_ACTIVE_ORDERS_PROJECTION =
  "UNIFRY_ACTIVE_ORDERS_PROJECTION";

export const UNIFRY_ACTIVE_ORDERS_READ_MODEL =
  "UNIFRY_ACTIVE_ORDERS";

export function projectUniFryActiveOrders({
  currentModel,
  event
}) {
  if (event.eventType !== "UNIFRY_ORDER_CREATED") {
    return currentModel;
  }

  const order = {
    orderId: event.payload.orderId,
    itemName: event.payload.itemName,
    quantity: event.payload.quantity,
    amount: event.payload.amount,
    currency: event.payload.currency,
    status: event.payload.status,
    createdAt: event.timestamp,
  };

  return {
    ...currentModel,
    orders: [
      ...(currentModel.orders ?? []),
      order
    ],
    totalOrders: (currentModel.totalOrders ?? 0) + 1,
    lastUpdatedAt: new Date().toISOString(),
  };
}