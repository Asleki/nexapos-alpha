/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: execution-smoke-test.js
 * Layer: UniFry Execution
 * NEES: NEM-007A
 * ==========================================================
 *
 * Responsibility:
 * Verify that the UniFry Execution Engine can
 * produce a complete operational execution report.
 *
 * Depends On:
 * - execution-engine.js
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

import { executeOperation } from "./execution-engine.js";

export async function runUniFryExecutionSmokeTest() {
  const result = await executeOperation({
    workflow: "UNIFRY_EXECUTION_SMOKE_TEST",
    event: {
      eventType: "UNIFRY_ORDER_CREATED",
      payload: {
        orderId: "EXECUTION_TEST_ORDER",
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
      result.workflow === "UNIFRY_EXECUTION_SMOKE_TEST" &&
      result.context?.integration?.accepted === true &&
      result.context?.integration?.context?.workflowReport?.accepted === true &&
      result.context?.kernel?.accepted === true &&
      result.context?.lifecycle?.accepted === true &&
      result.context?.timeline?.recorded === true &&
      result.context?.projection?.projected === true &&
      result.context?.state?.updated === true &&
      result.context?.bus?.published === true,
    result,
  };
}