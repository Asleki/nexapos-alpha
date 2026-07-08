/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: intake-workflow.js
 * Layer: NexFarm Lifecycle
 * NEES: NEM-004
 * ==========================================================
 */

import { IntakeStatus } from "./intake-status.js";

export function resolveIntakeWorkflowStatus(eventType) {

  const workflow = {

    SUPPLIER_REGISTERED:
      IntakeStatus.REGISTERED,

    GRAIN_INTAKE_STARTED:
      IntakeStatus.DELIVERY_STARTED,

    GRAIN_DELIVERY_STARTED:
      IntakeStatus.DELIVERY_STARTED,

    GRAIN_VISUALLY_INSPECTED:
      IntakeStatus.INSPECTED,

    GRAIN_REJECTED:
      IntakeStatus.REJECTED,

    MOISTURE_TEST_RECORDED:
      IntakeStatus.MOISTURE_TESTED,

    WEIGHT_CAPTURED:
      IntakeStatus.WEIGHED,

    PACKAGING_SUGGESTED:
      IntakeStatus.PACKAGING_READY,

  };

  return workflow[eventType] ?? null;

}