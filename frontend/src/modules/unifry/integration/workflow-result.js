/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: workflow-result.js
 * Layer: UniFry Workflow Integration
 * NEES: NEM-006
 * ==========================================================
 *
 * Responsibility:
 * Create the final result returned from a
 * UniFry workflow integration execution.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - workflow-integration.js
 * - workflow-smoke-test.js
 * - unifry-service.js
 *
 * Must Never:
 * - Execute workflows
 * - Publish events
 * - Modify event payloads
 * - Synchronize external systems
 */

export function createWorkflowResult({
  accepted,
  workflow,
  context = null,
  reason = null,
  completedAt = new Date().toISOString(),
} = {}) {
  return Object.freeze({
    accepted,
    workflow,
    context,
    reason,
    completedAt,
  });
}