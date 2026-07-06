/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: validation-errors.js
 * Layer: Event Validation Engine
 * NEES: SK-008
 * ==========================================================
 *
 * Responsibility:
 * Define reusable validation error codes.
 *
 * Must Never:
 * - Validate events directly
 * - Queue events
 * - Synchronize events
 * - Execute business logic
 */

export const ValidationErrorCode = Object.freeze({
  MISSING_EVENT: "MISSING_EVENT",
  UNSUPPORTED_SCHEMA_VERSION: "UNSUPPORTED_SCHEMA_VERSION",
  MISSING_PAYLOAD: "MISSING_PAYLOAD",
  INVALID_PAYLOAD: "INVALID_PAYLOAD",
  INVALID_RUNTIME_MODE: "INVALID_RUNTIME_MODE",
  MISSING_TIMESTAMP: "MISSING_TIMESTAMP",
  INVALID_TIMESTAMP: "INVALID_TIMESTAMP",
  MISSING_EVENT_ID: "MISSING_EVENT_ID",
  DUPLICATE_EVENT: "DUPLICATE_EVENT",
});