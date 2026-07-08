/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: lifecycle-smoke-test.js
 * Layer: NexFarm Lifecycle Integration
 * NEES: NEM-008A
 * ==========================================================
 *
 * Responsibility:
 * Verify that NexFarm Lifecycle Integration
 * correctly coordinates a lifecycle transition.
 *
 * Depends On:
 * - lifecycle-integration.js
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
  executeLifecycleIntegration
} from "./lifecycle-integration.js";

export function runNexFarmLifecycleIntegrationSmokeTest() {

  const result = executeLifecycleIntegration({

    workflow:
      "NEXFARM_LIFECYCLE_INTEGRATION_SMOKE_TEST",

    event: {

      eventType:
        "SUPPLIER_REGISTERED",

      payload: {

        supplierId:
          "NF-TEST-0001",

      },

    },

    lifecycle: {

      context: {

        currentStatus: null,

        nextStatus:
          "registered",

      },

    },

  });

  return {

    passed:

      result.accepted === true &&

      result.context?.supplierId ===
        "NF-TEST-0001" &&

      result.context?.nextStatus ===
        "registered" &&

      result.lifecycle?.context?.currentStatus ===
        "registered",

    result,

  };

}