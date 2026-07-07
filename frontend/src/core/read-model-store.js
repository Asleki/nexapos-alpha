/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: read-model-store.js
 * Layer: Read Model Engine
 * NEES: SK-010
 * ==========================================================
 *
 * Responsibility:
 * Store and retrieve derived read models.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - read-model-builder.js
 * - projection-engine.js
 * - read-model-engine.js
 *
 * Must Never:
 * - Store source events
 * - Execute projections
 * - Execute business logic
 */

const readModels = new Map();

/**
 * Save or replace a read model.
 */
export function saveReadModel(name, model) {

  readModels.set(name, model);

  return model;

}

/**
 * Retrieve a read model.
 */
export function getReadModel(name) {

  return readModels.get(name) ?? null;

}

/**
 * Determine whether a read model exists.
 */
export function hasReadModel(name) {

  return readModels.has(name);

}

/**
 * Remove a read model.
 */
export function removeReadModel(name) {

  readModels.delete(name);

}

/**
 * Return all registered read models.
 */
export function listReadModels() {

  return Array.from(readModels.keys());

}

/**
 * Clear all read models.
 */
export function clearReadModels() {

  readModels.clear();

}