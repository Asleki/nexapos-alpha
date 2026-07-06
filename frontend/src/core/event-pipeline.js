/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: event-pipeline.js
 * Layer: Event Processing Pipeline
 *  * NEES: SK-002 / SK-008
 * ==========================================================
 *
 * Responsibility:
 * Coordinate the lifecycle of newly created events.
 *
 * Must Never:
 * - Execute business logic
 * - Synchronize events
 * - Modify validated event payloads
 */

import { validateEvent } from "./event-validator.js";
import { registerProcessedEvent } from "./duplicate-validator.js";
import { enqueuePersistent } from "./persistent-event-queue.js";
import { log } from "./logger.js";

export async function processEvent(event) {
  const report = validateEvent(event);

  if (!report.valid) {
    log("Event validation failed.", report);

    return {
      accepted: false,
      event,
      validation: report,
    };
  }

  registerProcessedEvent(event.eventId);

  await enqueuePersistent(event);

  log("Event accepted and queued.", {
    eventId: event.eventId,
    eventType: event.eventType,
  });

  return {
    accepted: true,
    event,
    validation: report,
  };
}