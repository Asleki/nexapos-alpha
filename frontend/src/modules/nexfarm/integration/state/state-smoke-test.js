/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: state-smoke-test.js
 * Layer: NexFarm State Integration
 * NEES: NEM-012A
 * ==========================================================
 *
 * Responsibility:
 * Verify that NexFarm State Integration
 * correctly coordinates reactive state updates.
 *
 * Depends On:
 * - state-integration.js
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
  executeStateIntegration
} from "./state-integration.js";

export function runNexFarmStateIntegrationSmokeTest() {

  const result = executeStateIntegration({

    workflow:
      "NEXFARM_STATE_INTEGRATION_SMOKE_TEST",

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

    projection: {

      projected: true,

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

      result.state?.updated === true,

    result,

  };

}