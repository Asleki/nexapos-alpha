/**
 * NexaPOS Alpha 1.0
 * Event Schema Foundation
 *
 * Every operational action in NexaPOS is represented
 * as an immutable event.
 */

import { createEventContext } from "./event-context.js";

export const EVENT_SCHEMA_VERSION = "1.0.0";

export const RuntimeMode = Object.freeze({
  SIMULATION: "simulation",
  LIVE: "live",
});

export const EventStatus = Object.freeze({
  CREATED: "created",
  VALIDATED: "validated",
  QUEUED: "queued",
  SYNCED: "synced",
  FAILED: "failed",
});

export function createEvent({
  type,
  payload = {},
  context = {},
  runtimeMode = RuntimeMode.SIMULATION,
}) {
  return Object.freeze({
    eventId: crypto.randomUUID(),
    schemaVersion: EVENT_SCHEMA_VERSION,
    eventType: type,
    timestamp: new Date().toISOString(),
    status: EventStatus.CREATED,
    context: createEventContext({
      ...context,
      session: {
        runtimeMode,
        ...(context.session ?? {}),
      },
    }),
    payload,
  });
}