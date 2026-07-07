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
 * executing registered projections against events.
 *
 * Depends On:
 * - projection-engine.js
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

export function updateReadModel({
  projectionName,
  readModelName,
  event,
  initialState = {}
}) {

  return projectEvent({
    projectionName,
    readModelName,
    event,
    initialState
  });

}