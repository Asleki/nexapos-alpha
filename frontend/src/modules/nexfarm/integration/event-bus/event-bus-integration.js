/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: event-bus-integration.js
 * Layer: NexFarm Event Bus Integration
 * NEES: NEM-011
 * ==========================================================
 *
 * Responsibility:
 * Integrate NexFarm operational events with
 * the NexaPOS Core Event Bus.
 *
 * Depends On:
 * - event-bus-context.js
 * - event-bus-report.js
 * - ../../../../core/event-bus/event-publisher.js
 *
 * Used By:
 * - execution-engine.js
 * - event-bus-smoke-test.js
 *
 * Must Never:
 * - Execute business logic
 * - Modify business events
 * - Update read models
 * - Synchronize external systems
 */

import {
  createEventBusContext
} from "./event-bus-context.js";

import {
  createEventBusIntegrationReport
} from "./event-bus-report.js";

import {
  publishToChannel
} from "../../../../core/event-bus/event-publisher.js";

export function executeEventBusIntegration({

  workflow,

  event,

} = {}) {

  const context = createEventBusContext({

    workflow,

    event,

  });

  const publication = publishToChannel({

    channel:
      context.channel,

    eventType:
      event?.eventType ?? "UNKNOWN_EVENT",

    payload:
      event?.payload ?? {},

    metadata: {

      workflow,

      supplierId:
        context.supplierId,

      deliveryId:
        context.deliveryId,

      publisher:
        context.publisher,

    },

  });

  return createEventBusIntegrationReport({

    accepted:
      publication?.published === true,

    workflow,

    context,

    publication,

    reason:
      publication?.reason ?? null,

  });

}