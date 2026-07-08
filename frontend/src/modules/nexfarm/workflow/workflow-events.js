/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: workflow-events.js
 * Layer: NexFarm Workflow
 * NEES: NEM-005
 * ==========================================================
 *
 * Responsibility:
 * Define NexFarm workflow event types.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - workflow-engine.js
 * - workflow-smoke-test.js
 *
 * Must Never:
 * - Execute business logic
 * - Modify business events
 * - Update read models
 * - Synchronize external systems
 */

export const NEXFARM_WORKFLOW_EVENTS = Object.freeze({

  SUPPLIER_REGISTERED:
    "SUPPLIER_REGISTERED",

  GRAIN_DELIVERY_STARTED:
    "GRAIN_DELIVERY_STARTED",

  MOISTURE_TEST_RECORDED:
    "MOISTURE_TEST_RECORDED",

  WEIGHT_CAPTURED:
    "WEIGHT_CAPTURED",

  PACKAGING_SUGGESTED:
    "PACKAGING_SUGGESTED",

  BAG_CREATED:
    "BAG_CREATED",

  SUPPLIER_PAYMENT_REQUESTED:
    "SUPPLIER_PAYMENT_REQUESTED",

  SUPPLIER_PAYMENT_CONFIRMED:
    "SUPPLIER_PAYMENT_CONFIRMED",

  GRAIN_DISPATCHED:
    "GRAIN_DISPATCHED",

});