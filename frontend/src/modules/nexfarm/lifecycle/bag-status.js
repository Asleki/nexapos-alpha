/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: bag-status.js
 * Layer: NexFarm Lifecycle
 * NEES: NEM-004
 * ==========================================================
 *
 * Responsibility:
 * Define the lifecycle states of an official
 * NexFarm grain bag from creation to dispatch.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - bag-lifecycle.js
 * - bag-transition.js
 *
 * Must Never:
 * - Execute business logic
 * - Validate transitions
 * - Modify inventory
 * - Publish events
 */

export const BagStatus = Object.freeze({

  INITIAL:
    "initial",

  CREATED:
    "created",

  FILLED:
    "filled",

  LABELED:
    "labeled",

  STORED:
    "stored",

  RESERVED:
    "reserved",

  DISPATCHED:
    "dispatched",

  CANCELLED:
    "cancelled",

});