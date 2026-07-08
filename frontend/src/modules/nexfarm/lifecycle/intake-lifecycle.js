/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: intake-lifecycle.js
 * Layer: NexFarm Lifecycle
 * NEES: NEM-004
 * ==========================================================
 */

import { IntakeStatus } from "./intake-status.js";
import { isValidIntakeTransition } from "./intake-transition.js";
import { resolveIntakeWorkflowStatus } from "./intake-workflow.js";

export function executeIntakeLifecycle({
  event,
  lifecycle = null,
} = {}) {

  const currentStatus =
    lifecycle?.lifecycle?.context?.currentStatus ??
    lifecycle?.context?.currentStatus ??
    IntakeStatus.INITIAL;

  const nextStatus =
    resolveIntakeWorkflowStatus(event?.eventType) ??
    lifecycle?.lifecycle?.context?.nextStatus ??
    lifecycle?.context?.nextStatus ??
    null;

  const accepted =
    isValidIntakeTransition(
      currentStatus,
      nextStatus,
    );

  return Object.freeze({

    accepted,

    context: {

      currentStatus:
        accepted ? nextStatus : currentStatus,

      previousStatus:
        currentStatus,

      nextStatus,

    },

    reason:
      accepted
        ? null
        : "INVALID_INTAKE_TRANSITION",

  });

}