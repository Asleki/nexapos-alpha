/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: execution-engine.js
 * Layer: UniFry Execution
 * NEES: NEM-007 / NEM-013
 * ==========================================================
 *
 * Responsibility:
 * Coordinate the complete execution of a
 * UniFry operational workflow across the
 * live NexaPOS execution pipeline.
 *
 * Depends On:
 * - execution-context.js
 * - execution-report.js
 * - ../integration/workflow-integration.js
 * - ../integration/timeline/timeline-integration.js
 * - ../integration/event-bus/event-bus-integration.js
 * - ../integration/state/state-integration.js
 *
 * Used By:
 * - unifry-service.js
 * - execution-smoke-test.js
 *
 * Must Never:
 * - Execute UI rendering
 * - Modify business events
 * - Synchronize external systems
 * - Replace business services
 */

import { createExecutionContext } from "./execution-context.js";
import { createExecutionReport } from "./execution-report.js";

import {
  executeWorkflowIntegration
} from "../integration/workflow-integration.js";

import {
  executeTimelineIntegration
} from "../integration/timeline/timeline-integration.js";

import {
  executeEventBusIntegration
} from "../integration/event-bus/event-bus-integration.js";

import {
  executeStateIntegration
} from "../integration/state/state-integration.js";

export async function executeOperation({

  workflow,

  event,

  kernel = null,

  lifecycle = null,

  timeline = null,

  projection = null,

  state = null,

  bus = null,

} = {}) {

  const integration = await executeWorkflowIntegration({

    workflow,

    event,

    kernel,

    lifecycle,

    timeline,

    projection,

    state,

    bus,

  });

  const lifecycleResult =
    integration
      ?.context
      ?.lifecycle ?? null;

  const timelineResult =
    timeline ?? executeTimelineIntegration({

      workflow,

      event,

      lifecycle: lifecycleResult,

    });

  const busResult =
    bus ?? executeEventBusIntegration({

      workflow,

      event,

    });

  const stateResult =
    state ?? executeStateIntegration({

      workflow,

      event,

      projection,

    });

  const context = createExecutionContext({

    workflow,

    event,

    integration,

    kernel,

    lifecycle: lifecycleResult,

    timeline: timelineResult,

    projection,

    state: stateResult,

    bus: busResult,

  });

  return createExecutionReport({

    accepted:
      integration.accepted === true &&
      timelineResult.accepted === true &&
      busResult.accepted === true &&
      stateResult.accepted === true,

    workflow,

    context,

    reason:
      integration.reason ??
      timelineResult.reason ??
      busResult.reason ??
      stateResult.reason ??
      null,

  });

}