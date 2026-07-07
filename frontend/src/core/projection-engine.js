/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: projection-engine.js
 * Layer: Read Model Engine
 * NEES: SK-010
 * ==========================================================
 *
 * Responsibility:
 * Execute registered projections against events.
 *
 * Depends On:
 * - read-model-registry.js
 * - read-model-builder.js
 * - projection-report.js
 * - projection-errors.js
 *
 * Used By:
 * - read-model-engine.js
 *
 * Must Never:
 * - Modify source events
 * - Store source events
 * - Execute synchronization
 * - Execute business logic outside registered projections
 */

import { getProjection } from "./read-model-registry.js";
import { buildReadModel } from "./read-model-builder.js";
import { createProjectionReport } from "./projection-report.js";
import { ProjectionErrorCode } from "./projection-errors.js";

export function projectEvent({
  projectionName,
  readModelName,
  event,
  initialState = {},
}) {
  const projector = getProjection(projectionName);

  if (!projector) {
    return createProjectionReport({
      projected: false,
      projection: projectionName,
      readModel: readModelName,
      errors: [
        {
          code: ProjectionErrorCode.UNKNOWN_PROJECTION,
          reason: "Projection is not registered.",
        },
      ],
    });
  }

  try {
    const readModel = buildReadModel({
      name: readModelName,
      event,
      projector,
      initialState,
    });

    return createProjectionReport({
      projected: true,
      projection: projectionName,
      readModel,
      errors: [],
    });
  } catch (err) {
    return createProjectionReport({
      projected: false,
      projection: projectionName,
      readModel: readModelName,
      errors: [
        {
          code: ProjectionErrorCode.PROJECTION_FAILED,
          reason: err.message ?? "Projection failed.",
        },
      ],
    });
  }
}