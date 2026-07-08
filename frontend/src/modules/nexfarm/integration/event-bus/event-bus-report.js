/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: event-bus-report.js
 * Layer: NexFarm Event Bus Integration
 * NEES: NEM-011
 * ==========================================================
 *
 * Responsibility:
 * Create standardized event bus integration
 * reports for NexFarm workflows.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - event-bus-integration.js
 * - event-bus-smoke-test.js
 *
 * Must Never:
 * - Execute business logic
 * - Publish events
 * - Modify business events
 * - Synchronize external systems
 */

export function createEventBusIntegrationReport({

  accepted = false,

  workflow = null,

  context = null,

  publication = null,

  reason = null,

} = {}) {

  return Object.freeze({

    accepted,

    workflow,

    context,

    publication,

    reason,

  });

}