/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: workflow-engine.js
 * Layer: UniFry Workflow
 * NEES: NEM-005
 * ==========================================================
 *
 * Responsibility:
 * Coordinate complete UniFry workflow execution
 * across platform services.
 *
 * Depends On:
 * - workflow-events.js
 * - workflow-report.js
 *
 * Used By:
 * - unifry-service.js
 * - workflow-smoke-test.js
 *
 * Must Never:
 * - Execute UI rendering
 * - Replace business services
 * - Store workflow state
 * - Synchronize external systems
 */

import { WorkflowEvent } from "./workflow-events.js";
import { createWorkflowReport } from "./workflow-report.js";

export async function executeWorkflow({
  workflow = "UNKNOWN_WORKFLOW",
  event = null,

  kernel = null,
  lifecycle = null,
  timeline = null,
  projection = null,
  bus = null,
} = {}) {

  const startedEvent = WorkflowEvent.WORKFLOW_STARTED;

  try {

    const completedEvent = WorkflowEvent.WORKFLOW_COMPLETED;

    return createWorkflowReport({

      accepted: true,

      workflow,

      event: {
        started: startedEvent,
        completed: completedEvent,
        businessEvent: event,
      },

      kernel,

      lifecycle,

      timeline,

      projection,

      bus,

    });

  } catch (error) {

    return createWorkflowReport({

      accepted: false,

      workflow,

      event: {
        started: startedEvent,
        failed: WorkflowEvent.WORKFLOW_FAILED,
        businessEvent: event,
      },

      kernel,

      lifecycle,

      timeline,

      projection,

      bus,

      reason: error.message,

    });

  }

}