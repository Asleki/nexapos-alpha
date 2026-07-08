/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: workflow-integration.js
 * Layer: NexFarm Workflow Integration
 * NEES: NEM-006
 * ==========================================================
 *
 * Responsibility:
 * Coordinate complete NexFarm workflow
 * integration across platform services.
 *
 * Depends On:
 * - workflow-context.js
 * - workflow-result.js
 * - workflow-engine.js
 * - ../integration/lifecycle/lifecycle-integration.js
 * - ../integration/timeline/timeline-integration.js
 * - ../integration/event-bus/event-bus-integration.js
 * - ../integration/state/state-integration.js
 *
 * Used By:
 * - execution-engine.js
 * - workflow-smoke-test.js
 *
 * Must Never:
 * - Execute UI rendering
 * - Modify business events
 * - Replace business services
 * - Synchronize external systems
 */

import {
  createWorkflowContext
} from "./workflow-context.js";

import {
  createWorkflowResult
} from "./workflow-result.js";

import {
  executeWorkflow
} from "./workflow-engine.js";

import {
  executeTimelineIntegration
} from "../integration/timeline/timeline-integration.js";

import {
  executeEventBusIntegration
} from "../integration/event-bus/event-bus-integration.js";

import {
  executeStateIntegration
} from "../integration/state/state-integration.js";

export function executeWorkflowIntegration({

  workflow,

  event,

  kernel = null,

  lifecycle = null,

  timeline = null,

  projection = null,

  state = null,

  bus = null,

} = {}) {

  const workflowResult = executeWorkflow({

    workflow,

    event,

    kernel,

    lifecycle,

    timeline,

    projection,

    state,

    bus,

  });

  const timelineResult =
    executeTimelineIntegration({

      workflow,

      event,

      lifecycle:
        workflowResult.lifecycle,

    });

  const busResult =
    executeEventBusIntegration({

      workflow,

      event,

    });

  const stateResult =
    executeStateIntegration({

      workflow,

      event,

      projection,

      state,

    });

  const context = createWorkflowContext({

    workflow,

    event,

    kernel,

    lifecycle:
      workflowResult.lifecycle,

    timeline:
      timelineResult,

    projection,

    state:
      stateResult,

    bus:
      busResult,

  });

  return createWorkflowResult({

    accepted:

      workflowResult.accepted === true &&

      timelineResult.accepted === true &&

      busResult.accepted === true &&

      stateResult.accepted === true,

    workflow,

    context,

    lifecycle:
      workflowResult.lifecycle,

    reason:

      workflowResult.reason ??

      timelineResult.reason ??

      busResult.reason ??

      stateResult.reason ??

      null,

  });

}