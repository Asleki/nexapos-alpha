/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: read-model-registry.js
 * Layer: Read Model Engine
 * NEES: SK-010
 * ==========================================================
 *
 * Responsibility:
 * Register and retrieve projection functions
 * used to build read models.
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
 * - Store read models
 * - Modify source events
 * - Execute business logic
 */

const registry = new Map();

/**
 * Register a projection.
 */
export function registerProjection(name, projector) {

  registry.set(name, projector);

}

/**
 * Retrieve a projection.
 */
export function getProjection(name) {

  return registry.get(name) ?? null;

}

/**
 * Determine whether a projection exists.
 */
export function hasProjection(name) {

  return registry.has(name);

}

/**
 * Return all registered projections.
 */
export function listProjections() {

  return Array.from(registry.keys());

}

/**
 * Remove a projection.
 */
export function unregisterProjection(name) {

  registry.delete(name);

}