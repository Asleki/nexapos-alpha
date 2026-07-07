/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: timeline-smoke-test.js
 * Layer: UniFry Timeline Integration
 * NEES: NEM-010A
 * ==========================================================
 *
 * Responsibility:
 * Verify that UniFry Timeline Integration can
 * record a lifecycle timeline entry.
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
 * - Publish events
 * - Render UI
 */

import {
  executeTimelineIntegration
} from "./timeline-integration.js";

export function runUniFryTimelineIntegrationSmokeTest() {

  const result = executeTimelineIntegration({
    workflow: "UNIFRY_TIMELINE_INTEGRATION_SMOKE_TEST",
    event: {
      eventType: "UNIFRY_ORDER_CREATED",
      payload: {
        orderId: "TIMELINE_TEST_ORDER",
      },
      context: {
        identity: {
          identityId: "SYSTEM_TEST",
        },
      },
    },
    lifecycle: {
      context: {
        currentStatus: null,
        nextStatus: "created",
      },
    },
  });

  return {
    passed:
      result.accepted === true &&
      result.context?.orderId === "TIMELINE_TEST_ORDER" &&
      result.context?.currentStatus === "created" &&
      result.timeline?.status === "created",
    result,
  };

}