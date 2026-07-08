/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: workflow-engine.js
 * Layer: NexFarm Workflow
 * NEES: NEM-005
 * ==========================================================
 *
 * Responsibility:
 * Coordinate NexFarm operational workflows.
 *
 * Depends On:
 * - workflow-context.js
 * - workflow-events.js
 * - workflow-result.js
 * - workflow-report.js
 * - ../integration/lifecycle/lifecycle-integration.js
 *
 * Used By:
 * - workflow-integration.js
 * - execution-engine.js
 *
 * Must Never:
 * - Execute UI rendering
 * - Modify business events
 * - Update read models
 * - Synchronize external systems
 */

import {
  createWorkflowContext
} from "./workflow-context.js";

import {
  createWorkflowReport
} from "./workflow-report.js";

import {
  executeLifecycleIntegration
} from "../integration/lifecycle/lifecycle-integration.js";

export function executeWorkflow({

  workflow,

  event,

  kernel = null,

  lifecycle = null,

  timeline = null,

  projection = null,

  state = null,

  bus = null,

} = {}) {

  const lifecycleResult =
    executeLifecycleIntegration({

      workflow,

      event,

      lifecycle,

    });

  const context = createWorkflowContext({

    workflow,

    event,

    kernel,

    lifecycle: lifecycleResult,

    timeline,

    projection,

    state,

    bus,

  });

  return createWorkflowReport({

    accepted:
      lifecycleResult.accepted === true,

    workflow,

    context,

    lifecycle: lifecycleResult,

    reason:
      lifecycleResult.reason ?? null,

  });

}