/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: payload-validator.js
 * Layer: Event Validation Engine
 * NEES: SK-008
 * ==========================================================
 *
 * Responsibility:
 * Validate that an event payload exists and is usable.
 *
 * Must Never:
 * - Interpret business meaning
 * - Approve transactions
 * - Modify payload values
 * - Validate runtime mode
 */

export function validatePayload(event) {
  if (!event || typeof event !== "object") {
    return {
      valid: false,
      validator: "payload",
      reason: "Missing event."
    };
  }

  if (!event.payload || typeof event.payload !== "object") {
    return {
      valid: false,
      validator: "payload",
      reason: "Missing or invalid payload."
    };
  }

  return {
    valid: true,
    validator: "payload"
  };
}