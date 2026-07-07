/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: event-report.js
 * Layer: System Event Bus
 * NEES: NEM-003
 * ==========================================================
 *
 * Responsibility:
 * Create a standardized publication report for
 * events processed by the System Event Bus.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - event-publisher.js
 * - event-bus.js
 *
 * Must Never:
 * - Publish events
 * - Store event history
 * - Notify subscribers
 * - Execute business logic
 */

export function createEventReport({
  published,
  channel,
  eventType,
  subscriberCount,
  publishedAt = new Date().toISOString(),
}) {

  return Object.freeze({

    published,

    channel,

    eventType,

    subscriberCount,

    publishedAt,

  });

}