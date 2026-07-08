/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: workflow-report.js
 * Layer: NexFarm Workflow
 * NEES: NEM-005
 * ==========================================================
 *
 * Responsibility:
 * Create standardized workflow reports for
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

export function createWorkflowReport({

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