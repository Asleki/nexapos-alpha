/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: execution-engine.js
 * Layer: NexFarm Execution
 * NEES: NEM-007
 * ==========================================================
 *
 * Responsibility:
 * Coordinate the complete execution of a
 * NexFarm operational workflow.
 *
 * Depends On:
 * - execution-context.js
 * - execution-report.js
 * - ../workflow/workflow-integration.js
 *
 * Used By:
 * - nexfarm-service.js
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
} from "../workflow/workflow-integration.js";

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

  const context = createExecutionContext({

    workflow,

    event,

    integration,

    kernel,

    lifecycle:
    integration.lifecycle,

    timeline,

    projection,

    state,

    bus,

  });

  return createExecutionReport({

    accepted: integration.accepted,

    workflow,

    context,

    reason: integration.reason ?? null,

  });

}