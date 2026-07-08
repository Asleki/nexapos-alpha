/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: workflow-result.js
 * Layer: NexFarm Workflow
 * NEES: NEM-005
 * ==========================================================
 *
 * Responsibility:
 * Create standardized workflow results for
 * NexFarm operational workflows.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - workflow-engine.js
 * - workflow-integration.js
 * - workflow-smoke-test.js
 *
 * Must Never:
 * - Execute business logic
 * - Modify business events
 * - Update read models
 * - Synchronize external systems
 */

export function createWorkflowResult({

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