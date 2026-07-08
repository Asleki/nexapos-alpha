/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: state-integration.js
 * Layer: NexFarm State Integration
 * NEES: NEM-012
 * ==========================================================
 *
 * Responsibility:
 * Integrate NexFarm projection results with
 * the NexaPOS reactive state layer.
 *
 * Depends On:
 * - state-context.js
 * - state-report.js
 *
 * Used By:
 * - execution-engine.js
 * - state-smoke-test.js
 *
 * Must Never:
 * - Execute business logic
 * - Modify business events
 * - Update read models
 * - Synchronize external systems
 */

import {
  createStateIntegrationContext
} from "./state-context.js";

import {
  createStateIntegrationReport
} from "./state-report.js";

export function executeStateIntegration({

  workflow,

  event,

  projection,

  state,

} = {}) {

  const context =
    createStateIntegrationContext({

      workflow,

      event,

      projection,

      state,

    });

  return createStateIntegrationReport({

    accepted:
      state?.updated === true,

    workflow,

    context,

    state,

    reason:
      state?.updated === true
        ? null
        : "STATE_UPDATE_FAILED",

  });

}