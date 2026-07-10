/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: intake-workflow.js
 * Layer: NexFarm Lifecycle
 * NEES: NEM-004
 * ==========================================================
 *
 * Responsibility:
 * Resolve the current intake workflow status
 * from immutable NexFarm business events.
 *
 * Must Never:
 * - Execute business logic
 * - Validate events
 * - Modify lifecycle state
 * - Publish events
 */

import { IntakeStatus } from "./intake-status.js";

export function resolveIntakeWorkflowStatus(
  eventType,
) {

  const workflow = {

    /**
     * Supplier
     */

    SUPPLIER_REGISTERED:
      IntakeStatus.REGISTERED,

    /**
     * Intake
     */

    GRAIN_INTAKE_STARTED:
      IntakeStatus.DELIVERY_STARTED,

    GRAIN_DELIVERY_STARTED:
      IntakeStatus.DELIVERY_STARTED,

    GRAIN_TYPE_SELECTED:
      IntakeStatus.INSPECTED,

    GRAIN_VISUALLY_INSPECTED:
      IntakeStatus.INSPECTED,

    GRAIN_REJECTED:
      IntakeStatus.REJECTED,

    MOISTURE_TEST_RECORDED:
      IntakeStatus.MOISTURE_TESTED,

    WEIGHT_CAPTURED:
      IntakeStatus.WEIGHED,

    /**
     * Commercial
     */

    PRICE_PREVIEW_CREATED:
      IntakeStatus.PRICE_PREVIEWED,

    SUPPLIER_ACCEPTED_OFFER:
      IntakeStatus.OFFER_ACCEPTED,

    SUPPLIER_DECLINED_OFFER:
      IntakeStatus.REJECTED,

    /**
     * Internal Drying
     */

    SOLAR_DRYING_ASSIGNED:
      IntakeStatus.DRYING,

    INTERNAL_DRYING_ASSESSMENT_RECORDED:
      IntakeStatus.DRYING_ASSESSED,

    RETURN_TO_DRYING:
      IntakeStatus.RETURN_TO_DRYING,

    LOSS_REVIEW_REQUIRED:
      IntakeStatus.LOSS_REVIEW,

    INTERNAL_LOSS_REVIEW_REQUIRED:
      IntakeStatus.LOSS_REVIEW,

    INTERNAL_GRAIN_LOSS_RECORDED:
      IntakeStatus.GRAIN_LOST,

    /**
     * Packaging
     */

    PACKAGING_SUGGESTED:
      IntakeStatus.PACKAGING_READY,

    BAG_CREATED:
      IntakeStatus.BAGGED,

    EZONE_ASSIGNED:
      IntakeStatus.EZONE,

    QR_ASSIGNED:
      IntakeStatus.QR_READY,

    RACK_ASSIGNED:
      IntakeStatus.STORED,

    /**
     * Completion
     */

    INTAKE_COMPLETED:
      IntakeStatus.COMPLETED,

  };

  return workflow[eventType] ?? null;

}