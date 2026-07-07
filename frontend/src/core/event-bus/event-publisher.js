/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: event-publisher.js
 * Layer: System Event Bus
 * NEES: NEM-003
 * ==========================================================
 *
 * Responsibility:
 * Publish events to System Event Bus channels.
 *
 * Depends On:
 * - event-history.js
 * - event-subscriber.js
 * - event-report.js
 *
 * Used By:
 * - event-bus.js
 * - Future Kernel integrations
 * - Future Modules
 *
 * Must Never:
 * - Execute business logic
 * - Modify published events
 * - Persist event history
 * - Validate business operations
 */

import { recordEventHistory } from "./event-history.js";
import { notifyChannelSubscribers } from "./event-subscriber.js";
import { createEventReport } from "./event-report.js";

export function publishToChannel({
  channel,
  eventType,
  payload = {},
  metadata = {},
}) {
  const publishedEvent = Object.freeze({
    channel,
    eventType,
    payload,
    metadata,
    publishedAt: new Date().toISOString(),
  });

  recordEventHistory(publishedEvent);

  const subscriberCount =
    notifyChannelSubscribers(channel, publishedEvent);

  return createEventReport({
    published: true,
    channel,
    eventType,
    subscriberCount,
    publishedAt: publishedEvent.publishedAt,
  });
}