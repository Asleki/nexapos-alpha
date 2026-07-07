/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: read-model-builder.js
 * Layer: Read Model Engine
 * NEES: SK-010
 * ==========================================================
 *
 * Responsibility:
 * Build a derived read model from an event and projection result.
 *
 * Depends On:
 * - read-model-store.js
 *
 * Used By:
 * - projection-engine.js
 * - read-model-engine.js
 *
 * Must Never:
 * - Store source events
 * - Modify source events
 * - Execute business logic outside projection rules
 */

import { getReadModel, saveReadModel } from "./read-model-store.js";

export function buildReadModel({
  name,
  event,
  projector,
  initialState = {}
}) {

  const currentModel = getReadModel(name) ?? initialState;

  const nextModel = projector({
    currentModel,
    event
  });

  return saveReadModel(name, nextModel);

}