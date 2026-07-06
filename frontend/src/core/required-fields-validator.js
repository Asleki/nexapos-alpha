/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: required-fields-validator.js
 * Layer: Event Validation Engine
 * NEES: SK-008
 * ==========================================================
 *
 * Responsibility:
 * Validate that an event contains required top-level fields.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - event-validator.js
 *
 * Must Never:
 * - Validate business payload meaning
 * - Validate runtime permissions
 * - Queue events
 * - Synchronize events
 */

export function validateRequiredFields(event) {

  if (!event || typeof event !== "object") {
    return {
      valid: false,
      validator: "required-fields",
      reason: "Missing event."
    };
  }

  const requiredFields = [
    "eventId",
    "schemaVersion",
    "eventType",
    "timestamp",
    "status",
    "context",
    "payload"
  ];

  const missingFields = requiredFields.filter((field) => {
    return event[field] === undefined || event[field] === null;
  });

  if (missingFields.length > 0) {
    return {
      valid: false,
      validator: "required-fields",
      reason: "Missing required event fields.",
      missingFields
    };
  }

  return {
    valid: true,
    validator: "required-fields"
  };

}