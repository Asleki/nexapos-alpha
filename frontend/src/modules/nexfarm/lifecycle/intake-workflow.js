/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: intake-workflow.js
 * Layer: NexFarm Lifecycle
 * NEES: NEM-004
 * ==========================================================
 *
 * Responsibility:
 * Resolve immutable NexFarm business events
 * into lifecycle statuses.
 *
 * This resolver performs event-to-status mapping
 * only. It does NOT validate whether a transition
 * is allowed.
 *
 * IMPORTANT:
 * Supplier registration is an optional supplier
 * relationship workflow.
 *
 * Grain intake may begin:
 *
 * INITIAL
 *      ↓
 * GRAIN_INTAKE_STARTED
 *
 * or
 *
 * INITIAL
 *      ↓
 * SUPPLIER_REGISTERED
 *      ↓
 * GRAIN_INTAKE_STARTED
 *
 * Both paths are valid.
 *
 * Must Never:
 * - Execute business logic
 * - Validate transitions
 * - Modify lifecycle state
 * - Publish events
 * - Perform supplier lookup
 * - Create Nexa IDs
 * - Perform identity verification
 */

import { IntakeStatus } from "./intake-status.js";

export function resolveIntakeWorkflowStatus(
  eventType,
) {

  const workflow = {

    /**
     * ==========================================
     * Optional Supplier Relationship
     * ==========================================
     *
     * Supplier registration remains supported
     * but is NOT a mandatory entry point into
     * the intake lifecycle.
     */

    SUPPLIER_REGISTERED:
      IntakeStatus.REGISTERED,

    /**
     * ==========================================
     * Grain Intake
     * ==========================================
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
     * ==========================================
     * Commercial
     * ==========================================
     */

    PRICE_PREVIEW_CREATED:
      IntakeStatus.PRICE_PREVIEWED,

    SUPPLIER_ACCEPTED_OFFER:
      IntakeStatus.OFFER_ACCEPTED,

    SUPPLIER_DECLINED_OFFER:
      IntakeStatus.REJECTED,

    /**
     * ==========================================
     * Internal Drying & Quality Control
     * ==========================================
     *
     * Once the commercial transaction has been
     * completed, all remaining lifecycle events
     * are internal NexFarm custody operations.
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
     * ==========================================
     * Packaging & Storage
     * ==========================================
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
     * ==========================================
     * Completion
     * ==========================================
     */

    INTAKE_COMPLETED:
      IntakeStatus.COMPLETED,

  };

  return workflow[eventType] ?? null;

}