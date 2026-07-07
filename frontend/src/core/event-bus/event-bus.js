/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: event-bus.js
 * Layer: System Event Bus
 * NEES: NEM-003
 * ==========================================================
 *
 * Responsibility:
 * Coordinate all communication through the
 * NexaPOS System Event Bus.
 *
 * This file provides the public API for
 * publishing and subscribing to channels.
 *
 * Depends On:
 * - event-publisher.js
 * - event-subscriber.js
 *
 * Used By:
 * - Future Kernel Integrations
 * - Future Business Modules
 * - Future Analytics
 * - Future Notification Engine
 * - Future NexVox Observer
 *
 * Must Never:
 * - Execute business logic
 * - Validate events
 * - Store business data
 * - Synchronize external systems
 */

import { publishToChannel } from "./event-publisher.js";

import {
  subscribeToChannel,
  unsubscribeFromChannel,
} from "./event-subscriber.js";

/**
 * Publish an event to a System Event Bus channel.
 */
export function publishEvent({
  channel,
  eventType,
  payload = {},
  metadata = {},
}) {

  return publishToChannel({
    channel,
    eventType,
    payload,
    metadata,
  });

}

/**
 * Subscribe to a System Event Bus channel.
 */
export function subscribeEvent(channel, listener) {

  return subscribeToChannel(
    channel,
    listener
  );

}

/**
 * Remove a channel subscription.
 */
export function unsubscribeEvent(
  channel,
  listener
) {

  unsubscribeFromChannel(
    channel,
    listener
  );

}