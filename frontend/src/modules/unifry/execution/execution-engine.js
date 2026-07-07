/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: execution-engine.js
 * Layer: UniFry Execution
 * NEES: NEM-007
 * ==========================================================
 *
 * Responsibility:
 * Coordinate the complete execution of a
 * UniFry operational workflow.
 *
 * Depends On:
 * - execution-context.js
 * - execution-report.js
 * - ../integration/workflow-integration.js
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

    lifecycle,

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