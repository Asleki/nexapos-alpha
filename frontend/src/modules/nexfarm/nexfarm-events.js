/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: nexfarm-events.js
 * Layer: NexFarm Module
 * NEES: Business Module Execution Layer
 * ==========================================================
 *
 * Responsibility:
 * Define all operational events produced by
 * the NexFarm business module.
 *
 * These events are immutable and represent
 * business facts only.
 *
 * Must Never:
 * - Execute business logic
 * - Modify existing events
 * - Synchronize data
 * - Update projections directly
 */

export const NexFarmEventType = Object.freeze({

  /**
   * Supplier
   */

  SUPPLIER_REGISTERED:
    "SUPPLIER_REGISTERED",

  SUPPLIER_UPDATED:
    "SUPPLIER_UPDATED",

  SUPPLIER_DETAILS_CAPTURED:
    "SUPPLIER_DETAILS_CAPTURED",

  /**
   * Grain Intake
   */

  GRAIN_INTAKE_STARTED:
    "GRAIN_INTAKE_STARTED",

  GRAIN_TYPE_SELECTED:
    "GRAIN_TYPE_SELECTED",

  MOISTURE_TEST_RECORDED:
    "MOISTURE_TEST_RECORDED",

  WEIGHT_CAPTURED:
    "WEIGHT_CAPTURED",

  PRICE_PREVIEW_CREATED:
    "PRICE_PREVIEW_CREATED",

  SUPPLIER_ACCEPTED_OFFER:
    "SUPPLIER_ACCEPTED_OFFER",

  SUPPLIER_DECLINED_OFFER:
    "SUPPLIER_DECLINED_OFFER",

  /**
   * Packaging
   */

  PACKAGING_SUGGESTED:
    "PACKAGING_SUGGESTED",

  BAG_CREATED:
    "BAG_CREATED",

  QR_ASSIGNED:
    "QR_ASSIGNED",

  /**
   * Storage
   */

  RACK_ASSIGNED:
    "RACK_ASSIGNED",

  SOLAR_DRYING_ASSIGNED:
    "SOLAR_DRYING_ASSIGNED",

  EZONE_ASSIGNED:
    "EZONE_ASSIGNED",

  /**
   * Financial
   */

  PAYMENT_CALCULATED:
    "PAYMENT_CALCULATED",

  PAYMENT_REQUESTED:
    "PAYMENT_REQUESTED",

  PAYMENT_APPROVED:
    "PAYMENT_APPROVED",

  PAYMENT_DECLINED:
    "PAYMENT_DECLINED",

  /**
   * Completion
   */

  INTAKE_COMPLETED:
    "INTAKE_COMPLETED",

  INTAKE_CANCELLED:
    "INTAKE_CANCELLED",

});