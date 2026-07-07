/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: timeline-integration.js
 * Layer: UniFry Timeline Integration
 * NEES: NEM-010
 * ==========================================================
 *
 * Responsibility:
 * Integrate lifecycle execution with the
 * UniFry Order Timeline recorder.
 *
 * Depends On:
 * - timeline-context.js
 * - timeline-report.js
 * - order-timeline.js
 *
 * Used By:
 * - workflow-integration.js
 * - timeline-smoke-test.js
 *
 * Must Never:
 * - Execute lifecycle transitions
 * - Modify source events
 * - Publish events
 * - Synchronize external systems
 */

import { createTimelineContext } from "./timeline-context.js";
import { createTimelineIntegrationReport } from "./timeline-report.js";

import {
  recordOrderTimelineEntry
} from "../../lifecycle/order-timeline.js";

export function executeTimelineIntegration({
  workflow,
  event,
  lifecycle,
} = {}) {

  const orderId =
    event?.payload?.orderId ?? null;

  const previousStatus =
    lifecycle?.context?.currentStatus ?? null;

  const currentStatus =
    lifecycle?.context?.nextStatus ?? null;

  const actorId =
    event?.context?.identity?.identityId ?? null;

  const context = createTimelineContext({
    workflow,
    event,
    orderId,
    previousStatus,
    currentStatus,
    actorId,
  });

  if (!orderId || !currentStatus) {
    return createTimelineIntegrationReport({
      accepted: false,
      context,
      timeline: null,
      reason: "Timeline requires orderId and currentStatus.",
    });
  }

  const timeline = recordOrderTimelineEntry({
    orderId,
    status: currentStatus,
    eventType: event?.eventType ?? null,
    actorId,
  });

  return createTimelineIntegrationReport({
    accepted: true,
    context,
    timeline,
    reason: null,
  });

}