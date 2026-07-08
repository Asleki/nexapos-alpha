/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: bag-timeline.js
 * Layer: NexFarm Lifecycle
 * NEES: NEM-004
 * ==========================================================
 */

const bagTimelines = new Map();

export function recordBagTimelineEntry({
  supplierId = null,
  deliveryId = null,
  eventType = null,
  previousStatus = null,
  currentStatus = null,
  timestamp = new Date().toISOString(),
} = {}) {

  const timelineId =
    deliveryId ??
    supplierId ??
    "NEXFARM_UNKNOWN_TIMELINE";

  const currentTimeline =
    bagTimelines.get(timelineId) ?? [];

  const entry = Object.freeze({

    supplierId,

    deliveryId,

    eventType,

    previousStatus,

    currentStatus,

    timestamp,

  });

  bagTimelines.set(timelineId, [
    ...currentTimeline,
    entry,
  ]);

  return entry;

}

export function getBagTimeline(timelineId) {

  return bagTimelines.get(timelineId) ?? [];

}

export function clearBagTimelines() {

  bagTimelines.clear();

}