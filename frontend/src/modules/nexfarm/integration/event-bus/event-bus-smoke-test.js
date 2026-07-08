/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: event-bus-smoke-test.js
 * Layer: NexFarm Event Bus Integration
 * NEES: NEM-011A
 * ==========================================================
 *
 * Responsibility:
 * Verify that NexFarm Event Bus Integration
 * publishes operational events to the Core
 * Event Bus.
 *
 * Depends On:
 * - event-bus-integration.js
 *
 * Used By:
 * - Development diagnostics
 *
 * Must Never:
 * - Execute real business operations
 * - Replace formal tests
 * - Render UI
 * - Synchronize external systems
 */

import {
  executeEventBusIntegration
} from "./event-bus-integration.js";

export function runNexFarmEventBusIntegrationSmokeTest() {

  const result = executeEventBusIntegration({

    workflow:
      "NEXFARM_EVENT_BUS_INTEGRATION_SMOKE_TEST",

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

  });

  return {

    passed:

      result.accepted === true &&

      result.context?.supplierId ===
        "NF-TEST-0001" &&

      result.context?.deliveryId ===
        "DEL-TEST-0001" &&

      result.publication?.published === true,

    result,

  };

}