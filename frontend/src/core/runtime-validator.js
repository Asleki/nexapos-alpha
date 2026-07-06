/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: runtime-validator.js
 * Layer: Event Validation Engine
 * NEES: SK-008
 * ==========================================================
 *
 * Responsibility:
 * Validate that an event belongs to an allowed runtime mode.
 *
 * Must Never:
 * - Queue events
 * - Modify runtime mode
 * - Approve live operations
 * - Execute business logic
 */

import { RuntimeMode } from "./event-schema.js";

export function validateRuntime(event) {
  if (!event || typeof event !== "object") {
    return {
      valid: false,
      validator: "runtime",
      reason: "Missing event."
    };
  }

  const runtimeMode = event.context?.session?.runtimeMode;

  const allowedModes = Object.values(RuntimeMode);

  if (!allowedModes.includes(runtimeMode)) {
    return {
      valid: false,
      validator: "runtime",
      reason: "Invalid runtime mode."
    };
  }

  return {
    valid: true,
    validator: "runtime"
  };
}