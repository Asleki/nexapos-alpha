/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: execution-report.js
 * Layer: NexFarm Execution
 * NEES: NEM-007
 * ==========================================================
 *
 * Responsibility:
 * Create standardized execution reports for
 * NexFarm operational workflows.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - execution-engine.js
 * - execution-smoke-test.js
 * - Future NexFarm services
 *
 * Must Never:
 * - Execute business logic
 * - Modify business events
 * - Update read models
 * - Synchronize external systems
 */

export function createExecutionReport({

  accepted = false,

  workflow = null,

  context = null,

  reason = null,

} = {}) {

  return Object.freeze({

    accepted,

    workflow,

    context,

    reason,

  });

}