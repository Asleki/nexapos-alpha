/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: event-bus-integration.js
 * Layer: UniFry Event Bus Integration
 * NEES: NEM-011
 * ==========================================================
 *
 * Responsibility:
 * Integrate UniFry business events with the
 * NexaPOS Core Event Bus.
 *
 * Depends On:
 * - event-bus-context.js
 * - event-bus-report.js
 * - ../../../../core/event-bus/event-publisher.js
 *
 * Used By:
 * - workflow-integration.js
 * - event-bus-smoke-test.js
 *
 * Must Never:
 * - Modify source events
 * - Execute business logic
 * - Update read models
 * - Synchronize external systems
 */

import { createEventBusContext } from "./event-bus-context.js";
import { createEventBusIntegrationReport } from "./event-bus-report.js";

import {
  publishToChannel
} from "../../../../core/event-bus/event-publisher.js";

export function executeEventBusIntegration({
  workflow,
  event,
} = {}) {

  const orderId =
    event?.payload?.orderId ?? null;

  const context = createEventBusContext({

    workflow,

    event,

    orderId,

  });

  const publication = publishToChannel({

    channel: context.channel,

    eventType: event?.eventType ?? "UNKNOWN_EVENT",

    payload: event?.payload ?? {},

    metadata: {

      workflow,

      orderId,

      publisher: context.publisher,

    },

  });

  return createEventBusIntegrationReport({

    accepted: publication?.published === true,

    context,

    publication,

    reason: null,

  });

}