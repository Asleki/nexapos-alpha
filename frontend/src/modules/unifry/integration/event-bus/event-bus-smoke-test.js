/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: event-bus-smoke-test.js
 * Layer: UniFry Event Bus Integration
 * NEES: NEM-011A
 * ==========================================================
 *
 * Responsibility:
 * Verify that UniFry Event Bus Integration can
 * publish a business event onto the NexaPOS
 * Core Event Bus.
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

export function runUniFryEventBusIntegrationSmokeTest() {

  const result = executeEventBusIntegration({

    workflow:
      "UNIFRY_EVENT_BUS_INTEGRATION_SMOKE_TEST",

    event: {

      eventType: "UNIFRY_ORDER_CREATED",

      payload: {

        orderId: "EVENT_BUS_TEST_ORDER",

      },

    },

  });

  return {

    passed:

      result.accepted === true &&

      result.context?.orderId ===
        "EVENT_BUS_TEST_ORDER" &&

      result.publication?.published === true,

    result,

  };

}