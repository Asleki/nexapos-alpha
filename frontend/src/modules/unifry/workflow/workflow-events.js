/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: workflow-events.js
 * Layer: UniFry Workflow
 * NEES: NEM-005
 * ==========================================================
 *
 * Responsibility:
 * Define workflow orchestration event types.
 *
 * Workflow events describe execution progress
 * rather than business operations.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - workflow-engine.js
 * - workflow-smoke-test.js
 *
 * Must Never:
 * - Execute workflows
 * - Publish business events
 * - Store workflow state
 * - Execute business logic
 */

export const WorkflowEvent = Object.freeze({

  WORKFLOW_STARTED: "WORKFLOW_STARTED",

  WORKFLOW_COMPLETED: "WORKFLOW_COMPLETED",

  WORKFLOW_FAILED: "WORKFLOW_FAILED",

});