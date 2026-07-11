/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: intake-transition.js
 * Layer: NexFarm Lifecycle
 * NEES: NEM-004
 * ==========================================================
 *
 * Responsibility:
 * Define valid lifecycle transitions for the
 * complete NexFarm grain intake workflow.
 *
 * IMPORTANT:
 * Supplier registration is optional.
 *
 * Grain intake may begin directly:
 *
 * INITIAL
 *      ↓
 * DELIVERY_STARTED
 *
 * or through optional supplier registration:
 *
 * INITIAL
 *      ↓
 * REGISTERED
 *      ↓
 * DELIVERY_STARTED
 *
 * REGISTERED must never become a mandatory gate
 * for starting or completing a grain intake.
 *
 * Must Never:
 * - Execute business logic
 * - Publish events
 * - Modify inventory
 * - Approve payments
 * - Register suppliers
 * - Create Nexa IDs
 * - Perform identity matching
 */

import { IntakeStatus } from "./intake-status.js";

export const IntakeTransition = Object.freeze({

  /**
   * ==========================================
   * Initial
   * ==========================================
   *
   * Both entry paths are valid:
   *
   * 1. Optional supplier registration
   * 2. Direct grain intake
   */

  [IntakeStatus.INITIAL]: [
    IntakeStatus.REGISTERED,
    IntakeStatus.DELIVERY_STARTED,
  ],

  /**
   * ==========================================
   * Optional Supplier Registration
   * ==========================================
   *
   * Registration remains supported for
   * recurring suppliers but is not required.
   */

  [IntakeStatus.REGISTERED]: [
    IntakeStatus.DELIVERY_STARTED,
  ],

  /**
   * ==========================================
   * Grain Intake
   * ==========================================
   */

  [IntakeStatus.DELIVERY_STARTED]: [
    IntakeStatus.INSPECTED,
    IntakeStatus.REJECTED,
  ],

  [IntakeStatus.INSPECTED]: [
    IntakeStatus.MOISTURE_TESTED,
    IntakeStatus.REJECTED,
  ],

  /**
   * ==========================================
   * Moisture and Weight
   * ==========================================
   */

  [IntakeStatus.MOISTURE_TESTED]: [
    IntakeStatus.WEIGHED,
  ],

  [IntakeStatus.WEIGHED]: [

    /**
     * Initial supplier commercial path.
     */

    IntakeStatus.PRICE_PREVIEWED,

    /**
     * Grain may require drying.
     */

    IntakeStatus.DRYING,

    /**
     * Returned grain may proceed to internal
     * drying assessment after moisture and
     * weight have been captured again.
     */

    IntakeStatus.DRYING_ASSESSED,
  ],

  /**
   * ==========================================
   * Supplier Commercial Flow
   * ==========================================
   */

  [IntakeStatus.PRICE_PREVIEWED]: [
    IntakeStatus.OFFER_ACCEPTED,
    IntakeStatus.REJECTED,
  ],

  [IntakeStatus.OFFER_ACCEPTED]: [

    /**
     * Grain is already safe for packaging.
     */

    IntakeStatus.PACKAGING_READY,

    /**
     * Grain requires internal drying after
     * the supplier transaction is completed.
     */

    IntakeStatus.DRYING,
  ],

  /**
   * ==========================================
   * Internal Drying and Quality Control
   * ==========================================
   */

  [IntakeStatus.DRYING]: [

    /**
     * Grain returns from the drying zone
     * and must be tested again.
     */

    IntakeStatus.MOISTURE_TESTED,

    /**
     * Grain may be rejected from storage
     * before a completed internal assessment.
     */

    IntakeStatus.REJECTED,

    /**
     * Grain may be recorded as an internal
     * NexFarm loss.
     */

    IntakeStatus.GRAIN_LOST,
  ],

  [IntakeStatus.DRYING_ASSESSED]: [

    /**
     * Safe grain continues to packaging.
     */

    IntakeStatus.PACKAGING_READY,

    /**
     * Grain may be assigned directly to
     * another drying cycle.
     */

    IntakeStatus.DRYING,

    /**
     * Explicit return-to-drying decision.
     */

    IntakeStatus.RETURN_TO_DRYING,

    /**
     * Abnormal loss or condition requires
     * internal review.
     */

    IntakeStatus.LOSS_REVIEW,

    /**
     * Unsafe or lost grain becomes a terminal
     * internal loss record.
     */

    IntakeStatus.GRAIN_LOST,
  ],

  [IntakeStatus.RETURN_TO_DRYING]: [
    IntakeStatus.DRYING,
  ],

  [IntakeStatus.LOSS_REVIEW]: [

    /**
     * Review may authorize another drying cycle.
     */

    IntakeStatus.DRYING,

    /**
     * Review may approve continuation to
     * packaging where the grain is safe.
     */

    IntakeStatus.PACKAGING_READY,

    /**
     * Review may confirm internal grain loss.
     */

    IntakeStatus.GRAIN_LOST,
  ],

  /**
   * ==========================================
   * Packaging
   * ==========================================
   */

  [IntakeStatus.PACKAGING_READY]: [

    /**
     * Full grain bags are created.
     */

    IntakeStatus.BAGGED,

    /**
     * Packaging remainder is assigned
     * to the E-Zone.
     */

    IntakeStatus.EZONE,
  ],

  [IntakeStatus.BAGGED]: [
    IntakeStatus.QR_READY,
  ],

  /**
   * ==========================================
   * E-Zone
   * ==========================================
   */

  [IntakeStatus.EZONE]: [

    /**
     * E-Zone grain may later become eligible
     * for packaging.
     */

    IntakeStatus.PACKAGING_READY,

    /**
     * Intake may complete where all remaining
     * grain is validly accounted for in E-Zone.
     */

    IntakeStatus.COMPLETED,

    /**
     * E-Zone grain may later be recorded
     * as an internal loss.
     */

    IntakeStatus.GRAIN_LOST,
  ],

  /**
   * ==========================================
   * Storage
   * ==========================================
   */

  [IntakeStatus.QR_READY]: [
    IntakeStatus.STORED,
  ],

  [IntakeStatus.STORED]: [
    IntakeStatus.COMPLETED,
  ],

  /**
   * ==========================================
   * Terminal States
   * ==========================================
   */

  [IntakeStatus.COMPLETED]: [],

  [IntakeStatus.REJECTED]: [],

  [IntakeStatus.GRAIN_LOST]: [],

});

export function isValidIntakeTransition(
  currentStatus,
  nextStatus,
) {

  const allowedTransitions =
    IntakeTransition[currentStatus] ?? [];

  return allowedTransitions.includes(
    nextStatus,
  );

}