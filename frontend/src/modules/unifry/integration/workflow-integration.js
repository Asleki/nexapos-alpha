/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: workflow-integration.js
 * Layer: UniFry Workflow Integration
 * NEES: NEM-006
 * ==========================================================
 *
 * Responsibility:
 * Coordinate complete UniFry workflow integration
 * across platform services.
 *
 * Depends On:
 * - workflow-context.js
 * - workflow-result.js
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

  const context = createWorkflowContext({

    workflow,

    event,

    kernel,

    lifecycle,

    timeline,

    projection,

    state,

    bus,

  });

  const workflowReport = await executeWorkflow({

    workflow,

    event,

    kernel,

    lifecycle,

    timeline,

    projection,

    bus,

  });

  return createWorkflowResult({

    accepted: workflowReport.accepted,

    workflow,

    context: {

      ...context,

      workflowReport,

    },

    reason: workflowReport.reason ?? null,

  });

}