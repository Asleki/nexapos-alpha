/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: timeline-smoke-test.js
 * Layer: NexFarm Timeline Integration
 * NEES: NEM-010A
 * ==========================================================
 *
 * Responsibility:
 * Verify that NexFarm Timeline Integration
 * records lifecycle timeline entries.
 *
 * Depends On:
 * - timeline-integration.js
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
  executeTimelineIntegration
} from "./timeline-integration.js";

export function runNexFarmTimelineIntegrationSmokeTest() {

  const result = executeTimelineIntegration({

    workflow:
      "NEXFARM_TIMELINE_INTEGRATION_SMOKE_TEST",

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

    lifecycle: {

      context: {

        currentStatus:
          null,

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

      result.context?.deliveryId ===
        "DEL-TEST-0001" &&

      result.timeline?.currentStatus ===
        "registered",

    result,

  };

}