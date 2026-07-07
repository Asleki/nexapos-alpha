/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: event-channels.js
 * Layer: System Event Bus
 * NEES: NEM-003
 * ==========================================================
 *
 * Responsibility:
 * Define the logical communication channels used
 * by the NexaPOS System Event Bus.
 *
 * Channels organize published events without
 * coupling publishers to subscribers.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - event-publisher.js
 * - event-subscriber.js
 * - event-bus.js
 *
 * Must Never:
 * - Publish events
 * - Store event history
 * - Execute business logic
 * - Notify subscribers
 */

export const EventChannel = Object.freeze({

  SYSTEM: "SYSTEM",

  BUSINESS: "BUSINESS",

  STATE: "STATE",

  UI: "UI",

  SECURITY: "SECURITY",

  SYNC: "SYNC",

  ANALYTICS: "ANALYTICS",

  DIAGNOSTICS: "DIAGNOSTICS",

});