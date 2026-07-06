/**
 * NexaPOS Alpha 1.0
 * Event Schema Foundation
 *
 * Every operational action in NexaPOS is represented
 * as an immutable event.
 *
 * Events are created locally first,
 * validated,
 * stored,
 * queued,
 * and synchronized later.
 */
/**
 * Current event schema version.
 */
export const EVENT_SCHEMA_VERSION = "1.0.0";

/**
/**
 * Supported runtime modes.
 */
export const RuntimeMode = Object.freeze({
  SIMULATION: "simulation",
  LIVE: "live",
});

/**
 * Initial event lifecycle.
 */
export const EventStatus = Object.freeze({
  CREATED: "created",
  VALIDATED: "validated",
  QUEUED: "queued",
  SYNCED: "synced",
  FAILED: "failed",
});

/**
 * Creates a new immutable event object.
 */
export function createEvent({
  type,
  payload = {},
  actorId = null,
  deviceId = null,
  runtimeMode = RuntimeMode.SIMULATION,
}) {
  return Object.freeze({
    eventId: crypto.randomUUID(),
    schemaVersion: EVENT_SCHEMA_VERSION,

    eventType: type,

    timestamp: new Date().toISOString(),

    runtimeMode,

    actorId,

    deviceId,

    status: EventStatus.CREATED,

    payload,
  });
}