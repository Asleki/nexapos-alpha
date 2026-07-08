/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: timeline-integration.js
 * Layer: NexFarm Timeline Integration
 * NEES: NEM-010
 * ==========================================================
 *
 * Responsibility:
 * Integrate NexFarm lifecycle results with
 * the NexFarm timeline recorder.
 *
 * Depends On:
 * - timeline-context.js
 * - timeline-report.js
 * - ../../lifecycle/bag-timeline.js
 *
 * Used By:
 * - execution-engine.js
 * - timeline-smoke-test.js
 *
 * Must Never:
 * - Execute business logic
 * - Modify business events
 * - Execute lifecycle transitions
 * - Synchronize external systems
 */

import {
  createTimelineContext
} from "./timeline-context.js";

import {
  createTimelineIntegrationReport
} from "./timeline-report.js";

import {
  recordBagTimelineEntry
} from "../../lifecycle/bag-timeline.js";

export function executeTimelineIntegration({

  workflow,

  event,

  lifecycle,

} = {}) {

  const context = createTimelineContext({

    workflow,

    event,

    lifecycle,

  });

  const timeline = recordBagTimelineEntry({

    supplierId: context.supplierId,

    deliveryId: context.deliveryId,

    eventType: event?.eventType ?? null,

    previousStatus: context.previousStatus,

    currentStatus: context.currentStatus,

  });

  return createTimelineIntegrationReport({

    accepted: true,

    workflow,

    context,

    timeline,

    reason: null,

  });

}