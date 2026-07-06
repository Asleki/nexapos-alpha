/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: timestamp-validator.js
 * Layer: Event Validation Engine
 * NEES: SK-008
 * ==========================================================
 *
 * Responsibility:
 * Validate event timestamps.
 */

export function validateTimestamp(event) {

  if (!event || !event.timestamp) {
    return {
      valid: false,
      validator: "timestamp",
      reason: "Missing timestamp."
    };
  }

  const date = new Date(event.timestamp);

  if (Number.isNaN(date.getTime())) {
    return {
      valid: false,
      validator: "timestamp",
      reason: "Invalid timestamp."
    };
  }

  return {
    valid: true,
    validator: "timestamp"
  };

}