/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: lifecycle-integration.js
 * Layer: NexFarm Lifecycle Integration
 * NEES: NEM-008
 * ==========================================================
 *
 * Responsibility:
 * Integrate NexFarm business events with the
 * NexFarm Lifecycle Engine.
 *
 * Depends On:
 * - lifecycle-context.js
 * - lifecycle-report.js
 * - ../../lifecycle/intake-lifecycle.js
 *
 * Used By:
 * - workflow-integration.js
 * - lifecycle-smoke-test.js
 *
 * Must Never:
 * - Modify business events
 * - Execute business logic
 * - Update read models
 * - Synchronize external systems
 */

import {
  createLifecycleContext
} from "./lifecycle-context.js";

import {
  createLifecycleIntegrationReport
} from "./lifecycle-report.js";

import {
  executeIntakeLifecycle
} from "../../lifecycle/intake-lifecycle.js";

export function executeLifecycleIntegration({

  workflow,

  event,

  lifecycle,

} = {}) {

  const supplierId =
    event?.payload?.supplierId ?? null;

  const deliveryId =
    event?.payload?.deliveryId ?? null;

  const context = createLifecycleContext({

    workflow,

    event,

    lifecycle,

    supplierId,

    deliveryId,

  });

  const result = executeIntakeLifecycle({

    event,

    lifecycle,

  });

  return createLifecycleIntegrationReport({

    accepted:
      result?.accepted === true,

    workflow,

    context,

    lifecycle: result,

    reason:
      result?.reason ?? null,

  });

}