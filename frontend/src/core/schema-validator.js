/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: schema-validator.js
 * Layer: Event Validation Engine
 * NEES: SK-008
 * ==========================================================
 *
 * Responsibility:
 * Validate that an event conforms to the approved schema.
 */

import { EVENT_SCHEMA_VERSION } from "./event-schema.js";

export function validateSchema(event) {

  if (!event) {
    return {
      valid: false,
      validator: "schema",
      reason: "Missing event."
    };
  }

  if (event.schemaVersion !== EVENT_SCHEMA_VERSION) {
    return {
      valid: false,
      validator: "schema",
      reason: "Unsupported schema version."
    };
  }

  return {
    valid: true,
    validator: "schema"
  };
}