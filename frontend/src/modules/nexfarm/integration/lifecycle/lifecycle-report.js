/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: lifecycle-report.js
 * Layer: NexFarm Lifecycle Integration
 * NEES: NEM-008
 * ==========================================================
 *
 * Responsibility:
 * Create standardized lifecycle integration
 * reports for NexFarm workflows.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - lifecycle-integration.js
 * - lifecycle-smoke-test.js
 *
 * Must Never:
 * - Execute business logic
 * - Modify lifecycle states
 * - Update read models
 * - Synchronize external systems
 */

export function createLifecycleIntegrationReport({

  accepted = false,

  workflow = null,

  context = null,

  lifecycle = null,

  reason = null,

} = {}) {

  return Object.freeze({

    accepted,

    workflow,

    context,

    lifecycle,

    reason,

  });

}