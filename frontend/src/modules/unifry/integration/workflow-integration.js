/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: workflow-integration.js
 * Layer: UniFry Workflow Integration
 * NEES: NEM-006 / NEM-009
 * ==========================================================
 *
 * Responsibility:
 * Coordinate complete UniFry workflow integration
 * across platform services.
 *
 * Depends On:
 * - workflow-context.js
 * - workflow-result.js
 * - lifecycle-integration.js
 * - ../workflow/workflow-engine.js
 *
 * Used By:
 * - unifry-service.js
 * - workflow-smoke-test.js
 *
 * Must Never:
 * - Execute UI rendering
 * - Modify business events
 * - Synchronize external systems
 * - Replace business services
 */

import { createWorkflowContext } from "./workflow-context.js";
import { createWorkflowResult } from "./workflow-result.js";

import { executeWorkflow } from "../workflow/workflow-engine.js";

import {
  executeLifecycleIntegration
} from "./lifecycle/lifecycle-integration.js";

export async function executeWorkflowIntegration({

  workflow,

  event,

  kernel = null,

  lifecycle = null,

  timeline = null,

  projection = null,

  state = null,

  bus = null,

} = {}) {

  const lifecycleResult = lifecycle ?? executeLifecycleIntegration({

    workflow,

    event,

    currentStatus: null,

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

  const workflowReport = await executeWorkflow({

    workflow,

    event,

    kernel,

    lifecycle: lifecycleResult,

    timeline,

    projection,

    bus,

  });

  return createWorkflowResult({

    accepted:
      workflowReport.accepted === true &&
      lifecycleResult.accepted === true,

    workflow,

    context: {

      ...context,

      workflowReport,

    },

    reason:
      lifecycleResult.reason ??
      workflowReport.reason ??
      null,

  });

}