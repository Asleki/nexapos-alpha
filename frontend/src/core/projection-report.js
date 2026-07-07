/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: projection-report.js
 * Layer: Read Model Engine
 * NEES: SK-010
 * ==========================================================
 *
 * Responsibility:
 * Create a standardized report for read model
 * projection operations.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - projection-engine.js
 * - read-model-engine.js
 *
 * Must Never:
 * - Build read models
 * - Execute business logic
 * - Modify source events
 */

export function createProjectionReport({
  projected,
  readModel = null,
  projection = null,
  errors = []
}) {

  return {

    projected,

    projectedAt: new Date().toISOString(),

    readModel,

    projection,

    errors

  };

}