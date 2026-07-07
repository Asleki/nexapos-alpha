/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: state-smoke-test.js
 * Layer: UniFry State Integration
 * NEES: NEM-012A
 * ==========================================================
 *
 * Responsibility:
 * Verify that UniFry Reactive State
 * Integration correctly processes a
 * successful projection.
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
 * - Render UI
 * - Synchronize external systems
 */

import {
  executeStateIntegration
} from "./state-integration.js";

export function runUniFryStateIntegrationSmokeTest() {

  const result = executeStateIntegration({

    workflow:
      "UNIFRY_STATE_INTEGRATION_SMOKE_TEST",

    event: {

      eventType: "UNIFRY_ORDER_CREATED",

      payload: {

        orderId: "STATE_TEST_ORDER",

      },

    },

    projection: {

      projected: true,

      readModelName:
        "UNIFRY_ACTIVE_ORDERS_READ_MODEL",

      projectedAt:
        new Date().toISOString(),

    },

  });

  return {

    passed:

      result.accepted === true &&

      result.context?.orderId ===
        "STATE_TEST_ORDER" &&

      result.stateUpdate?.updated === true,

    result,

  };

}