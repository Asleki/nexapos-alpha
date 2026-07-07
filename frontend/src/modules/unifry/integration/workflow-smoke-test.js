/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: workflow-smoke-test.js
 * Layer: UniFry Workflow Integration
 * NEES: NEM-006A
 * ==========================================================
 *
 * Responsibility:
 * Verify that the UniFry Workflow Integration
 * can produce a complete integration result.
 *
 * Depends On:
 * - workflow-integration.js
 *
 * Used By:
 * - Development diagnostics
 *
 * Must Never:
 * - Execute real business operations
 * - Replace formal tests
 * - Synchronize external systems
 * - Render UI
 */

import { executeWorkflowIntegration } from "./workflow-integration.js";

export async function runUniFryWorkflowIntegrationSmokeTest() {
  const result = await executeWorkflowIntegration({
    workflow: "UNIFRY_WORKFLOW_INTEGRATION_SMOKE_TEST",
    event: {
      eventType: "UNIFRY_ORDER_CREATED",
      payload: {
        orderId: "WORKFLOW_INTEGRATION_TEST_ORDER",
      },
    },
    kernel: {
      accepted: true,
    },
    lifecycle: {
      accepted: true,
      currentStatus: null,
      nextStatus: "created",
    },
    timeline: {
      recorded: true,
    },
    projection: {
      projected: true,
    },
    state: {
      updated: true,
    },
    bus: {
      published: true,
    },
  });

  return {
    passed:
      result.accepted === true &&
      result.workflow === "UNIFRY_WORKFLOW_INTEGRATION_SMOKE_TEST" &&
      result.context?.workflowReport?.accepted === true &&
      result.context?.kernel?.accepted === true &&
      result.context?.lifecycle?.accepted === true &&
      result.context?.timeline?.recorded === true &&
      result.context?.projection?.projected === true &&
      result.context?.state?.updated === true &&
      result.context?.bus?.published === true,
    result,
  };
}