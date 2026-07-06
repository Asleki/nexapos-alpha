/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: kernel-smoke-test.js
 * Layer: Kernel Validation Test
 * NEES: SK-002 / SK-008
 * ==========================================================
 *
 * Responsibility:
 * Verify that the event creation → validation → queue pipeline works.
 *
 * Must Never:
 * - Execute real business operations
 * - Simulate live payments
 * - Replace formal tests
 */

import { createEvent } from "./event-schema.js";
import { processEvent } from "./event-pipeline.js";
import { log } from "./logger.js";

export async function runKernelSmokeTest() {
  const testEvent = createEvent({
    type: "KERNEL_SMOKE_TEST",
    actorId: "SYSTEM_TEST",
    deviceId: "SIMULATED_DEVICE",
    payload: {
      purpose: "Validate kernel event pipeline",
    },
  });

  const result = await processEvent(testEvent);

  log("Kernel smoke test completed.", result);

  return result;
}