/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: bag-transition.js
 * Layer: NexFarm Lifecycle
 * NEES: NEM-004
 * ==========================================================
 *
 * Responsibility:
 * Define valid lifecycle transitions for
 * official NexFarm grain bags.
 *
 * Depends On:
 * - bag-status.js
 *
 * Used By:
 * - bag-lifecycle.js
 *
 * Must Never:
 * - Execute business logic
 * - Modify inventory
 * - Publish events
 * - Synchronize data
 */

import { BagStatus } from "./bag-status.js";

export const BagTransition = Object.freeze({

  [BagStatus.INITIAL]: [
    BagStatus.CREATED,
  ],

  [BagStatus.CREATED]: [
    BagStatus.FILLED,
    BagStatus.CANCELLED,
  ],

  [BagStatus.FILLED]: [
    BagStatus.LABELED,
    BagStatus.CANCELLED,
  ],

  [BagStatus.LABELED]: [
    BagStatus.STORED,
  ],

  [BagStatus.STORED]: [
    BagStatus.RESERVED,
    BagStatus.DISPATCHED,
  ],

  [BagStatus.RESERVED]: [
    BagStatus.DISPATCHED,
    BagStatus.STORED,
  ],

  [BagStatus.DISPATCHED]: [],

  [BagStatus.CANCELLED]: [],

});

export function isValidBagTransition(
  currentStatus,
  nextStatus,
) {

  const allowedTransitions =
    BagTransition[currentStatus] ?? [];

  return allowedTransitions.includes(
    nextStatus,
  );

}