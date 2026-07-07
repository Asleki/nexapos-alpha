/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: state-integration.js
 * Layer: UniFry State Integration
 * NEES: NEM-012
 * ==========================================================
 *
 * Responsibility:
 * Integrate UniFry projection results with
 * the NexaPOS Application State Layer.
 *
 * Depends On:
 * - state-context.js
 * - state-report.js
 *
 * Used By:
 * - workflow-integration.js
 * - state-smoke-test.js
 *
 * Must Never:
 * - Execute business logic
 * - Modify source events
 * - Update read models directly
 * - Synchronize external systems
 */

import { createStateIntegrationContext } from "./state-context.js";
import { createStateIntegrationReport } from "./state-report.js";

export function executeStateIntegration({
  workflow,
  event,
  projection,
  state = null,
} = {}) {

  const orderId =
    event?.payload?.orderId ?? null;

  const context = createStateIntegrationContext({

    workflow,

    event,

    orderId,

    projection,

    state,

  });

  if (!projection?.projected) {

    return createStateIntegrationReport({

      accepted: false,

      context,

      stateUpdate: null,

      reason: "Projection was not applied.",

    });

  }

  return createStateIntegrationReport({

    accepted: true,

    context,

    stateUpdate: {

      updated: true,

      readModelName: projection.readModelName ?? null,

      projectedAt: projection.projectedAt ?? new Date().toISOString(),

    },

    reason: null,

  });

}