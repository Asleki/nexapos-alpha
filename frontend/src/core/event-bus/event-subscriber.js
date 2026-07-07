/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: event-subscriber.js
 * Layer: System Event Bus
 * NEES: NEM-003
 * ==========================================================
 *
 * Responsibility:
 * Manage subscribers for System Event Bus channels.
 *
 * Depends On:
 * - event-channels.js
 *
 * Used By:
 * - event-publisher.js
 * - event-bus.js
 *
 * Must Never:
 * - Publish events
 * - Store event history
 * - Execute business logic
 * - Modify published events
 */

import { EventChannel } from "./event-channels.js";

const subscribers = new Map();

Object.values(EventChannel).forEach((channel) => {
  subscribers.set(channel, new Set());
});

export function subscribeToChannel(channel, listener) {
  if (!subscribers.has(channel)) {
    subscribers.set(channel, new Set());
  }

  subscribers.get(channel).add(listener);

  return () => unsubscribeFromChannel(channel, listener);
}

export function unsubscribeFromChannel(channel, listener) {
  subscribers.get(channel)?.delete(listener);
}

export function notifyChannelSubscribers(channel, event) {
  const channelSubscribers = subscribers.get(channel) ?? new Set();

  for (const listener of channelSubscribers) {
    listener(event);
  }

  return channelSubscribers.size;
}

export function getChannelSubscriberCount(channel) {
  return subscribers.get(channel)?.size ?? 0;
}