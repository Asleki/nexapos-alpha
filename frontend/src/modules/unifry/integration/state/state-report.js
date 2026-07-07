/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: state-report.js
 * Layer: UniFry State Integration
 * NEES: NEM-012
 * ==========================================================
 *
 * Responsibility:
 * Create a standardized report describing
 * the result of a UniFry Reactive State
 * Integration.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - state-integration.js
 * - state-smoke-test.js
 *
 * Must Never:
 * - Update application state
 * - Execute business logic
 * - Modify source events
 * - Synchronize external systems
 */

export function createStateIntegrationReport({
  accepted,
  context = null,
  stateUpdate = null,
  reason = null,
  completedAt = new Date().toISOString(),
} = {}) {

  return Object.freeze({

    accepted,

    context,

    stateUpdate,

    reason,

    completedAt,

  });

}