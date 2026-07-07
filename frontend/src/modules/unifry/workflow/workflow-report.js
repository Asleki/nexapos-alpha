/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: workflow-report.js
 * Layer: UniFry Workflow
 * NEES: NEM-005
 * ==========================================================
 *
 * Responsibility:
 * Create a standardized report describing
 * the outcome of a UniFry workflow execution.
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
 * - Publish events
 * - Store workflow state
 * - Execute business logic
 */

export function createWorkflowReport({
  accepted,
  workflow,
  event = null,
  kernel = null,
  lifecycle = null,
  timeline = null,
  projection = null,
  bus = null,
  reason = null,
  completedAt = new Date().toISOString(),
}) {
  return Object.freeze({
    accepted,
    workflow,
    event,
    kernel,
    lifecycle,
    timeline,
    projection,
    bus,
    reason,
    completedAt,
  });
}