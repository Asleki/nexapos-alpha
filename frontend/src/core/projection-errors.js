/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: projection-errors.js
 * Layer: Read Model Engine
 * NEES: SK-010
 * ==========================================================
 *
 * Responsibility:
 * Define reusable error codes used by the
 * Read Model Engine during event projection.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - projection-engine.js
 * - read-model-builder.js
 * - read-model-engine.js
 *
 * Must Never:
 * - Build read models
 * - Execute projections
 * - Modify events
 * - Execute business logic
 */

export const ProjectionErrorCode = Object.freeze({

  UNKNOWN_EVENT: "UNKNOWN_EVENT",

  UNKNOWN_PROJECTION: "UNKNOWN_PROJECTION",

  INVALID_READ_MODEL: "INVALID_READ_MODEL",

  PROJECTION_FAILED: "PROJECTION_FAILED",

  REGISTRY_ERROR: "REGISTRY_ERROR"

});