/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: read-model-engine.js
 * Layer: Read Model Engine
 * NEES: SK-010
 * ==========================================================
 *
 * Responsibility:
 * Coordinate the complete Read Model Engine by
 * executing registered projections against events
 * and publishing read model updates into application state.
 *
 * Depends On:
 * - projection-engine.js
 * - state-engine.js
 *
 * Used By:
 * - kernel-engine.js
 * - Future Business Modules
 * - Future Dashboard Layer
 *
 * Must Never:
 * - Modify source events
 * - Execute business logic
 * - Synchronize events
 * - Store source events
 */

import { projectEvent } from "./projection-engine.js";
import { updateApplicationState } from "./state/state-engine.js";

export function updateReadModel({
  projectionName,
  readModelName,
  event,
  initialState = {}
}) {

  const projectionResult = projectEvent({
    projectionName,
    readModelName,
    event,
    initialState
  });

  if (projectionResult.projected) {
    updateApplicationState((state) => ({
      ...state,
      readModels: {
        ...state.readModels,
        [readModelName]: projectionResult.readModel,
      },
    }));
  }

  return projectionResult;

}