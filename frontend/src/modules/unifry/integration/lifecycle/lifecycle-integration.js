/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: lifecycle-integration.js
 * Layer: UniFry Lifecycle Integration
 * NEES: NEM-009
 * ==========================================================
 *
 * Responsibility:
 * Integrate workflow execution with the
 * UniFry Order Lifecycle engine.
 *
 * Depends On:
 * - lifecycle-context.js
 * - lifecycle-report.js
 * - order-workflow.js
 * - order-lifecycle.js
 *
 * Used By:
 * - workflow-integration.js
 * - lifecycle-smoke-test.js
 *
 * Must Never:
 * - Modify source events
 * - Publish events
 * - Update read models
 * - Synchronize external systems
 */

import { createLifecycleContext } from "./lifecycle-context.js";
import { createLifecycleIntegrationReport } from "./lifecycle-report.js";

import {
  resolveWorkflowStatus,
} from "../../lifecycle/order-workflow.js";

import {
  progressOrderLifecycle,
} from "../../lifecycle/order-lifecycle.js";

export function executeLifecycleIntegration({
  workflow,
  event,
  currentStatus = null,
} = {}) {

  const nextStatus = resolveWorkflowStatus(
    event?.eventType
  );

  const context = createLifecycleContext({

    workflow,

    event,

    orderId: event?.payload?.orderId ?? null,

    currentStatus,

    nextStatus,

  });

  const lifecycle = progressOrderLifecycle({

    currentStatus,

    nextStatus,

  });

  return createLifecycleIntegrationReport({

    accepted: lifecycle.accepted,

    context,

    lifecycle,

    reason: lifecycle.reason,

  });

}