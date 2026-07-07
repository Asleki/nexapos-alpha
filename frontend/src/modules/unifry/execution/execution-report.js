/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: execution-report.js
 * Layer: UniFry Execution
 * NEES: NEM-007
 * ==========================================================
 *
 * Responsibility:
 * Create a standardized report describing
 * the outcome of a UniFry operational execution.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - execution-engine.js
 * - execution-smoke-test.js
 *
 * Must Never:
 * - Execute workflows
 * - Publish events
 * - Store execution state
 * - Synchronize external systems
 */

export function createExecutionReport({
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