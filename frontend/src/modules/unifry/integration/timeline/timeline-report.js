/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: timeline-report.js
 * Layer: UniFry Timeline Integration
 * NEES: NEM-010
 * ==========================================================
 *
 * Responsibility:
 * Create a standardized report describing
 * the result of a timeline integration.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - timeline-integration.js
 * - timeline-smoke-test.js
 *
 * Must Never:
 * - Record timeline entries
 * - Modify lifecycle state
 * - Publish events
 * - Synchronize external systems
 */

export function createTimelineIntegrationReport({
  accepted,
  context = null,
  timeline = null,
  reason = null,
  completedAt = new Date().toISOString(),
} = {}) {

  return Object.freeze({

    accepted,

    context,

    timeline,

    reason,

    completedAt,

  });

}