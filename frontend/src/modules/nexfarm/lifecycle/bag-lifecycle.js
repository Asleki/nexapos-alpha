/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: bag-lifecycle.js
 * Layer: NexFarm Lifecycle
 * NEES: NEM-004
 * ==========================================================
 *
 * Responsibility:
 * Coordinate lifecycle progression for
 * NexFarm official grain bags.
 *
 * Depends On:
 * - bag-status.js
 * - bag-transition.js
 *
 * Used By:
 * - Future bag workflow
 * - Future inventory workflow
 * - Future rack assignment
 *
 * Must Never:
 * - Execute inventory movements
 * - Publish events
 * - Store timelines
 * - Execute financial logic
 */

import { BagStatus } from "./bag-status.js";
import { isValidBagTransition } from "./bag-transition.js";

export function executeBagLifecycle({
  currentStatus = BagStatus.INITIAL,
  nextStatus,
} = {}) {

  const accepted =
    isValidBagTransition(
      currentStatus,
      nextStatus,
    );

  return Object.freeze({

    accepted,

    context: {

      previousStatus:
        currentStatus,

      currentStatus:
        accepted ? nextStatus : currentStatus,

      nextStatus,

    },

    reason:
      accepted
        ? null
        : "INVALID_BAG_TRANSITION",

  });

}