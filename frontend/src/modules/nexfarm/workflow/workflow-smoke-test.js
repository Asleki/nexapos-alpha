/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: workflow-smoke-test.js
 * Layer: NexFarm Workflow
 * NEES: NEM-006A
 * ==========================================================
 *
 * Responsibility:
 * Verify that the NexFarm Workflow Layer
 * coordinates a complete operational workflow.
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
 * - Publish production events
 * - Render UI
 */

import {
  executeWorkflowIntegration
} from "./workflow-integration.js";

export function runNexFarmWorkflowSmokeTest() {

  const result = executeWorkflowIntegration({

    workflow:
      "NEXFARM_WORKFLOW_SMOKE_TEST",

    event: {

      eventType:
        "SUPPLIER_REGISTERED",

      payload: {

        supplierId:
          "NF-TEST-0001",

        deliveryId:
          "DEL-TEST-0001",

      },

    },

    state: {

      updated: true,

    },

  });

  return {

    passed:

      result.accepted === true &&

      result.context?.supplierId ===
        "NF-TEST-0001" &&

      result.context?.deliveryId ===
        "DEL-TEST-0001" &&

      result.lifecycle?.accepted === true,

    result,

  };

}