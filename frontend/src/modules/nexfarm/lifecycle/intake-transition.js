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
 * complete NexFarm intake workflow.
 *
 * Must Never:
 * - Execute business logic
 * - Publish events
 * - Modify inventory
 * - Approve payments
 */

import { IntakeStatus } from "./intake-status.js";

export const IntakeTransition = Object.freeze({

  /**
   * Initial
   */

  [IntakeStatus.INITIAL]: [
    IntakeStatus.REGISTERED,
    IntakeStatus.DELIVERY_STARTED,
  ],

  /**
   * Optional supplier registration
   */

  [IntakeStatus.REGISTERED]: [
    IntakeStatus.DELIVERY_STARTED,
  ],

  /**
   * Intake
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
   * Moisture and weight
   */

  [IntakeStatus.MOISTURE_TESTED]: [
    IntakeStatus.WEIGHED,
  ],

  [IntakeStatus.WEIGHED]: [
    IntakeStatus.PRICE_PREVIEWED,
    IntakeStatus.DRYING,
    IntakeStatus.DRYING_ASSESSED,
  ],

  /**
   * Supplier commercial flow
   */

  [IntakeStatus.PRICE_PREVIEWED]: [
    IntakeStatus.OFFER_ACCEPTED,
    IntakeStatus.REJECTED,
  ],

  [IntakeStatus.OFFER_ACCEPTED]: [
    IntakeStatus.PACKAGING_READY,
    IntakeStatus.DRYING,
  ],

  /**
   * Internal drying
   */

  [IntakeStatus.DRYING]: [
    IntakeStatus.MOISTURE_TESTED,
    IntakeStatus.REJECTED,
    IntakeStatus.GRAIN_LOST,
  ],

  [IntakeStatus.DRYING_ASSESSED]: [
    IntakeStatus.PACKAGING_READY,
    IntakeStatus.DRYING,
    IntakeStatus.RETURN_TO_DRYING,
    IntakeStatus.LOSS_REVIEW,
    IntakeStatus.GRAIN_LOST,
  ],

  [IntakeStatus.RETURN_TO_DRYING]: [
    IntakeStatus.DRYING,
  ],

  [IntakeStatus.LOSS_REVIEW]: [
    IntakeStatus.DRYING,
    IntakeStatus.PACKAGING_READY,
    IntakeStatus.GRAIN_LOST,
  ],

  /**
   * Packaging
   */

  [IntakeStatus.PACKAGING_READY]: [
    IntakeStatus.BAGGED,
    IntakeStatus.EZONE,
  ],

  [IntakeStatus.BAGGED]: [
    IntakeStatus.QR_READY,
  ],

  /**
   * E-Zone
   */

  [IntakeStatus.EZONE]: [
    IntakeStatus.PACKAGING_READY,
    IntakeStatus.COMPLETED,
    IntakeStatus.GRAIN_LOST,
  ],

  /**
   * Storage
   */

  [IntakeStatus.QR_READY]: [
    IntakeStatus.STORED,
  ],

  [IntakeStatus.STORED]: [
    IntakeStatus.COMPLETED,
  ],

  /**
   * Terminal states
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