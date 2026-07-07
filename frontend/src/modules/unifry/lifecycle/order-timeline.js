/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: order-timeline.js
 * Layer: UniFry Order Lifecycle
 * NEES: NEM-004
 * ==========================================================
 *
 * Responsibility:
 * Record lifecycle timeline entries for
 * UniFry customer orders.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - Future Workflow Engine
 * - Future Kitchen Dashboard
 * - Future Analytics
 * - Future NexVox Observation Layer
 *
 * Must Never:
 * - Validate transitions
 * - Execute business logic
 * - Publish events
 * - Modify source events
 */

const timelines = new Map();

export function recordOrderTimelineEntry({
  orderId,
  status,
  eventType,
  actorId = null,
  timestamp = new Date().toISOString(),
}) {
  const currentTimeline = timelines.get(orderId) ?? [];

  const entry = Object.freeze({
    orderId,
    status,
    eventType,
    actorId,
    timestamp,
  });

  timelines.set(orderId, [
    ...currentTimeline,
    entry,
  ]);

  return entry;
}

export function getOrderTimeline(orderId) {
  return timelines.get(orderId) ?? [];
}

export function clearOrderTimelines() {
  timelines.clear();
}