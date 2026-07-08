/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: execution-smoke-test.js
 * Layer: NexFarm Execution
 * NEES: NEM-007A
 * ==========================================================
 *
 * Responsibility:
 * Verify that the NexFarm Execution Engine can
 * coordinate a complete operational workflow.
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
 * - Publish production events
 * - Render UI
 */

import {
  executeOperation
} from "./execution-engine.js";

export async function runNexFarmExecutionSmokeTest() {

  const result = await executeOperation({

    workflow:
      "NEXFARM_EXECUTION_SMOKE_TEST",

    event: {

      eventType:
        "SUPPLIER_REGISTERED",

      payload: {

        supplierId:
          "NF-TEST-0001",

      },

    },

  });

  return {

    passed:

      result.accepted === true &&

      result.context?.supplierId ===
        "NF-TEST-0001" &&

      result.workflow ===
        "NEXFARM_EXECUTION_SMOKE_TEST",

    result,

  };

}