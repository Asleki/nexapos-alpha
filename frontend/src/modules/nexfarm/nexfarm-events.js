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

import { createEvent } from "../../core/event-schema.js";

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

  INTERNAL_DRYING_ASSESSMENT_RECORDED:
    "INTERNAL_DRYING_ASSESSMENT_RECORDED",

  INTERNAL_LOSS_REVIEW_REQUIRED:
    "INTERNAL_LOSS_REVIEW_REQUIRED",

  INTERNAL_GRAIN_LOSS_RECORDED:
    "INTERNAL_GRAIN_LOSS_RECORDED",

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

export function createSupplierRegisteredEvent({
  context = {},
  supplierId,
  firstName,
  lastName,
  nationalId,
  phone,
} = {}) {

  return createEvent({
    type:
      NexFarmEventType.SUPPLIER_REGISTERED,
    context,
    payload: {
      supplierId,
      firstName,
      lastName,
      nationalId,
      phone,
    },
  });

}

export function createGrainIntakeStartedEvent({
  context = {},
  intakeId = crypto.randomUUID(),
  receivedAt = new Date().toISOString(),
} = {}) {

  return createEvent({
    type:
      NexFarmEventType.GRAIN_INTAKE_STARTED,
    context,
    payload: {
      intakeId,
      receivedAt,
    },
  });

}

export function createGrainTypeSelectedEvent({
  context = {},
  intakeId,
  grainType,
} = {}) {

  return createEvent({
    type:
      NexFarmEventType.GRAIN_TYPE_SELECTED,
    context,
    payload: {
      intakeId,
      grainType,
    },
  });

}

export function createMoistureTestRecordedEvent({
  context = {},
  intakeId,
  moisturePercentage,
  measurementStage = "initial_intake",
  dryingZoneId = null,
  dryingStartedAt = null,
  dryingEndedAt = null,
  measuredAt = new Date().toISOString(),
} = {}) {

  return createEvent({
    type:
      NexFarmEventType.MOISTURE_TEST_RECORDED,
    context,
    payload: {
      intakeId,
      moisturePercentage,
      measurementStage,
      dryingZoneId,
      dryingStartedAt,
      dryingEndedAt,
      measuredAt,
    },
  });

}

export function createWeightCapturedEvent({
  context = {},
  intakeId,
  weightKg,
  measurementStage = "initial_intake",
  beforeDryingWeightKg = null,
  dryingZoneId = null,
  dryingStartedAt = null,
  dryingEndedAt = null,
  capturedAt = new Date().toISOString(),
} = {}) {

  return createEvent({
    type:
      NexFarmEventType.WEIGHT_CAPTURED,
    context,
    payload: {
      intakeId,
      weightKg,
      measurementStage,
      beforeDryingWeightKg,
      dryingZoneId,
      dryingStartedAt,
      dryingEndedAt,
      capturedAt,
    },
  });

}

export function createPricePreviewCreatedEvent({
  context = {},
  intakeId,
  grainType,
  moisturePercentage,
  weightKg,
  priceChartVersion,
  pricePerKg,
  grossAmount,
  currency = "KES",
} = {}) {

  return createEvent({
    type:
      NexFarmEventType.PRICE_PREVIEW_CREATED,
    context,
    payload: {
      intakeId,
      grainType,
      moisturePercentage,
      weightKg,
      priceChartVersion,
      pricePerKg,
      grossAmount,
      currency,
    },
  });

}

export function createSupplierAcceptedOfferEvent({
  context = {},
  intakeId,
  grainType,
  moisturePercentage,
  weightKg,
  priceChartVersion,
  pricePerKg,
  grossAmount,
  currency = "KES",
  acceptedAt = new Date().toISOString(),
} = {}) {

  return createEvent({
    type:
      NexFarmEventType.SUPPLIER_ACCEPTED_OFFER,
    context,
    payload: {
      intakeId,
      grainType,
      moisturePercentage,
      weightKg,
      priceChartVersion,
      pricePerKg,
      grossAmount,
      currency,
      acceptedAt,
    },
  });

}

export function createPackagingSuggestedEvent({
  context = {},
  intakeId,
  grainType,
  weightKg,
  suggestedBags = [],
  totalPackagedKg,
  eZoneKg,
  suggestedAt = new Date().toISOString(),
} = {}) {

  return createEvent({
    type:
      NexFarmEventType.PACKAGING_SUGGESTED,
    context,
    payload: {
      intakeId,
      grainType,
      weightKg,
      suggestedBags,
      totalPackagedKg,
      eZoneKg,
      suggestedAt,
    },
  });

}

export function createBagCreatedEvent({
  context = {},
  intakeId,
  bagId = crypto.randomUUID(),
  bagSequence,
  grainType,
  bagSizeKg,
  actualWeightKg,
  createdAt = new Date().toISOString(),
} = {}) {

  return createEvent({
    type:
      NexFarmEventType.BAG_CREATED,
    context,
    payload: {
      intakeId,
      bagId,
      bagSequence,
      grainType,
      bagSizeKg,
      actualWeightKg,
      createdAt,
    },
  });

}

export function createQrAssignedEvent({
  context = {},
  intakeId,
  bagId,
  labelCode,
  grainType,
  bagSizeKg,
  actualWeightKg,
  qrPayload,
  qrValue,
  printableLabel,
  assignedAt = new Date().toISOString(),
} = {}) {

  return createEvent({
    type:
      NexFarmEventType.QR_ASSIGNED,
    context,
    payload: {
      intakeId,
      bagId,
      labelCode,
      grainType,
      bagSizeKg,
      actualWeightKg,
      qrPayload,
      qrValue,
      printableLabel,
      assignedAt,
    },
  });

}

export function createRackAssignedEvent({
  context = {},
  intakeId,
  bagId,
  grainType,
  bagSizeKg,
  actualWeightKg,
  rackSection,
  row,
  column,
  locationCode,
  assignedAt = new Date().toISOString(),
} = {}) {

  return createEvent({
    type:
      NexFarmEventType.RACK_ASSIGNED,
    context,
    payload: {
      intakeId,
      bagId,
      grainType,
      bagSizeKg,
      actualWeightKg,
      rackSection,
      row,
      column,
      locationCode,
      assignedAt,
    },
  });

}

export function createSolarDryingAssignedEvent({
  context = {},
  intakeId,
  grainType,
  moisturePercentage,
  beforeDryingWeightKg,
  dryingZoneId,
  dryingCycle = 1,
  dryingStartedAt = new Date().toISOString(),
} = {}) {

  return createEvent({
    type:
      NexFarmEventType.SOLAR_DRYING_ASSIGNED,
    context,
    payload: {
      intakeId,
      grainType,
      moisturePercentage,
      beforeDryingWeightKg,
      dryingZoneId,
      dryingCycle,
      dryingStartedAt,
    },
  });

}

export function createInternalDryingAssessmentRecordedEvent({
  context = {},
  intakeId,
  grainType,
  dryingZoneId,
  dryingCycle = 1,
  beforeDryingWeightKg,
  afterDryingWeightKg,
  moistureBefore,
  moistureAfter,
  dryingStartedAt,
  dryingEndedAt,
  dryingDurationMinutes,
  weightLossKg,
  weightLossPercent,
  moistureDropPercent,
  acceptableLossRange,
  targetMoisturePercent,
  abnormalLoss,
  grainCondition = "acceptable",
  assessmentDecision,
  conditionNotes = null,
  evidenceReference = null,
  assessedAt = new Date().toISOString(),
} = {}) {

  return createEvent({
    type:
      NexFarmEventType
        .INTERNAL_DRYING_ASSESSMENT_RECORDED,
    context,
    payload: {
      intakeId,
      grainType,
      dryingZoneId,
      dryingCycle,
      beforeDryingWeightKg,
      afterDryingWeightKg,
      moistureBefore,
      moistureAfter,
      dryingStartedAt,
      dryingEndedAt,
      dryingDurationMinutes,
      weightLossKg,
      weightLossPercent,
      moistureDropPercent,
      acceptableLossRange,
      targetMoisturePercent,
      abnormalLoss,
      grainCondition,
      assessmentDecision,
      conditionNotes,
      evidenceReference,
      assessedAt,
    },
  });

}

export function createInternalLossReviewRequiredEvent({
  context = {},
  intakeId,
  grainType,
  dryingZoneId,
  dryingCycle = 1,
  beforeDryingWeightKg,
  afterDryingWeightKg,
  weightLossKg,
  weightLossPercent,
  moistureBefore,
  moistureAfter,
  reviewReason = "ABNORMAL_WEIGHT_LOSS",
  conditionNotes = null,
  evidenceReference = null,
  reviewStatus = "pending",
  requiredAt = new Date().toISOString(),
} = {}) {

  return createEvent({
    type:
      NexFarmEventType.INTERNAL_LOSS_REVIEW_REQUIRED,
    context,
    payload: {
      intakeId,
      grainType,
      dryingZoneId,
      dryingCycle,
      beforeDryingWeightKg,
      afterDryingWeightKg,
      weightLossKg,
      weightLossPercent,
      moistureBefore,
      moistureAfter,
      reviewReason,
      conditionNotes,
      evidenceReference,
      reviewStatus,
      requiredAt,
    },
  });

}

export function createInternalGrainLossRecordedEvent({
  context = {},
  intakeId,
  grainType,
  dryingZoneId,
  dryingCycle = 1,
  beforeDryingWeightKg,
  assessedWeightKg,
  lossQuantityKg,
  moisturePercentage,
  lossReason,
  conditionNotes = null,
  evidenceReference = null,
  approvalStatus = "pending",
  recordedAt = new Date().toISOString(),
} = {}) {

  return createEvent({
    type:
      NexFarmEventType.INTERNAL_GRAIN_LOSS_RECORDED,
    context,
    payload: {
      intakeId,
      grainType,
      dryingZoneId,
      dryingCycle,
      beforeDryingWeightKg,
      assessedWeightKg,
      lossQuantityKg,
      moisturePercentage,
      lossReason,
      conditionNotes,
      evidenceReference,
      approvalStatus,
      recordedAt,
    },
  });

}

export function createEZoneAssignedEvent({
  context = {},
  intakeId,
  grainType,
  eZoneKg,
  sourceReason = "packaging_remainder",
  assignedAt = new Date().toISOString(),
} = {}) {

  return createEvent({
    type:
      NexFarmEventType.EZONE_ASSIGNED,
    context,
    payload: {
      intakeId,
      grainType,
      eZoneKg,
      sourceReason,
      assignedAt,
    },
  });

}