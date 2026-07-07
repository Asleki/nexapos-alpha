/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: lifecycle-smoke-test.js
 * Layer: UniFry Lifecycle Integration
 * NEES: NEM-009A
 * ==========================================================
 *
 * Responsibility:
 * Verify that UniFry Lifecycle Integration can
 * resolve a business event into a valid lifecycle
 * transition.
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
 * - Publish events
 * - Render UI
 */

import {
  executeLifecycleIntegration
} from "./lifecycle-integration.js";

export function runUniFryLifecycleIntegrationSmokeTest() {

  const result = executeLifecycleIntegration({
    workflow: "UNIFRY_LIFECYCLE_INTEGRATION_SMOKE_TEST",
    event: {
      eventType: "UNIFRY_ORDER_CREATED",
      payload: {
        orderId: "LIFECYCLE_TEST_ORDER",
      },
    },
    currentStatus: null,
  });

  return {
    passed:
      result.accepted === true &&
      result.context?.currentStatus === null &&
      result.context?.nextStatus === "created" &&
      result.lifecycle?.accepted === true,
    result,
  };

}