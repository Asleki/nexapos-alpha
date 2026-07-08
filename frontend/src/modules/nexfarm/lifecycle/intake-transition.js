/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: intake-transition.js
 * Layer: NexFarm Lifecycle
 * NEES: NEM-004
 * ==========================================================
 */

import { IntakeStatus } from "./intake-status.js";

export const IntakeTransition = Object.freeze({
  [IntakeStatus.INITIAL]: [
    IntakeStatus.REGISTERED,
  ],

  [IntakeStatus.REGISTERED]: [
    IntakeStatus.DELIVERY_STARTED,
  ],

  [IntakeStatus.DELIVERY_STARTED]: [
    IntakeStatus.INSPECTED,
    IntakeStatus.REJECTED,
  ],

  [IntakeStatus.INSPECTED]: [
    IntakeStatus.MOISTURE_TESTED,
    IntakeStatus.REJECTED,
  ],

  [IntakeStatus.MOISTURE_TESTED]: [
    IntakeStatus.WEIGHED,
  ],

  [IntakeStatus.WEIGHED]: [
    IntakeStatus.PACKAGING_READY,
  ],

  [IntakeStatus.PACKAGING_READY]: [
    IntakeStatus.COMPLETED,
  ],

  [IntakeStatus.COMPLETED]: [],

  [IntakeStatus.REJECTED]: [],
});

export function isValidIntakeTransition(
  currentStatus,
  nextStatus
) {
  const allowed =
    IntakeTransition[currentStatus] ?? [];

  return allowed.includes(nextStatus);
}