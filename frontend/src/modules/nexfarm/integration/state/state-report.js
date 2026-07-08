/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: state-report.js
 * Layer: NexFarm State Integration
 * NEES: NEM-012
 * ==========================================================
 *
 * Responsibility:
 * Create standardized state integration
 * reports for NexFarm workflows.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - state-integration.js
 * - state-smoke-test.js
 *
 * Must Never:
 * - Execute business logic
 * - Update application state
 * - Modify business events
 * - Synchronize external systems
 */

export function createStateIntegrationReport({

  accepted = false,

  workflow = null,

  context = null,

  state = null,

  reason = null,

} = {}) {

  return Object.freeze({

    accepted,

    workflow,

    context,

    state,

    reason,

  });

}