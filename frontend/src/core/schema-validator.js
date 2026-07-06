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
 *
 * Depends On:
 * - event-schema.js
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

import { EVENT_SCHEMA_VERSION } from "./event-schema.js";

export function validateSchema(event) {
  
  if (!event || typeof event !== "object") {
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
  
  if (!event.context || typeof event.context !== "object") {
    return {
      valid: false,
      validator: "schema",
      reason: "Missing event context."
    };
  }
  
  return {
    valid: true,
    validator: "schema"
  };
  
}