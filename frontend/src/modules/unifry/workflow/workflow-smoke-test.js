/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: workflow-smoke-test.js
 * Layer: UniFry Workflow
 * NEES: NEM-005A
 * ==========================================================
 *
 * Responsibility:
 * Verify that the UniFry Workflow Engine can
 * produce a complete workflow execution report.
 *
 * Depends On:
 * - workflow-engine.js
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

import { executeWorkflow } from "./workflow-engine.js";

export async function runUniFryWorkflowSmokeTest() {

  const result = await executeWorkflow({
    workflow: "UNIFRY_ORDER_WORKFLOW_SMOKE_TEST",
    event: {
      eventType: "UNIFRY_ORDER_CREATED",
      payload: {
        orderId: "WORKFLOW_TEST_ORDER",
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
    bus: {
      published: true,
    },
  });

  return {
    passed:
      result.accepted === true &&
      result.workflow === "UNIFRY_ORDER_WORKFLOW_SMOKE_TEST" &&
      result.kernel?.accepted === true &&
      result.lifecycle?.accepted === true &&
      result.timeline?.recorded === true &&
      result.projection?.projected === true &&
      result.bus?.published === true,
    result,
  };

}