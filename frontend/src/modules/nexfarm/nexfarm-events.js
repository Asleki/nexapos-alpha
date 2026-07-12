/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: nexfarm-events.js
 * Layer: NexFarm Module
 * NEES: Business Module Execution Layer
 * ==========================================================
 *
 * Responsibility:
 * Define immutable operational events produced by
 * the NexFarm business module.
 *
 * These events preserve supplier, intake, commercial,
 * drying-custody, packaging, storage, loss-control,
 * financial-request, and completion facts.
 *
 * Drying events are structured so the NexFarm drying
 * custody projection can derive:
 * - Active batches in drying
 * - Drying-cycle history
 * - Entry and return measurements
 * - Time in the drying zone
 * - Moisture and weight changes
 * - Assessment decisions
 * - Loss-review states
 * - Internal grain-loss records
 * - Packaging and rack-admission readiness
 *
 * Future Use:
 * - NexFarm operational read models
 * - NexFarm drying and storage dashboards
 * - Audit and recovery event replay
 * - NexVox AI L1 observational analytics
 *
 * NexVox AI may observe these events but must never:
 * - Create or modify production events
 * - Approve supplier payments
 * - Approve drying assessments
 * - Authorize packaging
 * - Authorize rack assignment
 * - Confirm internal grain loss
 *
 * Must Never:
 * - Execute business logic
 * - Modify existing events
 * - Synchronize data
 * - Update projections directly
 * - Process supplier payments
 * - Assign physical storage locations
 */

import { createEvent } from "../../core/event-schema.js";

export const NexFarmEventType = Object.freeze({

  /**
   * ======================================================
   * Supplier
   * ======================================================
   */

  SUPPLIER_REGISTERED:
    "SUPPLIER_REGISTERED",

  SUPPLIER_UPDATED:
    "SUPPLIER_UPDATED",

  SUPPLIER_DETAILS_CAPTURED:
    "SUPPLIER_DETAILS_CAPTURED",

  /**
   * ======================================================
   * Grain Intake
   * ======================================================
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
   * ======================================================
   * Packaging
   * ======================================================
   */

  PACKAGING_SUGGESTED:
    "PACKAGING_SUGGESTED",

  BAG_CREATED:
    "BAG_CREATED",

  QR_ASSIGNED:
    "QR_ASSIGNED",

  /**
   * ======================================================
   * Storage and Drying Custody
   * ======================================================
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
   * ======================================================
   * Financial
   * ======================================================
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
   * ======================================================
   * Completion
   * ======================================================
   */

  INTAKE_COMPLETED:
    "INTAKE_COMPLETED",

  INTAKE_CANCELLED:
    "INTAKE_CANCELLED",

});

/**
 * ==========================================================
 * Supplier Events
 * ==========================================================
 */

export function createSupplierRegisteredEvent({
  context = {},
  supplierId,
  firstName,
  lastName,
  nationalId,
  phone,
  registeredAt = new Date().toISOString(),
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
      registeredAt,
    },
  });

}

/**
 * ==========================================================
 * Grain Intake Events
 * ==========================================================
 */

export function createGrainIntakeStartedEvent({
  context = {},
  intakeId = crypto.randomUUID(),
  supplierId = null,
  temporarySupplierReference = null,
  receivedAt = new Date().toISOString(),
} = {}) {

  return createEvent({
    type:
      NexFarmEventType.GRAIN_INTAKE_STARTED,

    context,

    payload: {
      intakeId,
      supplierId,
      temporarySupplierReference,
      receivedAt,
    },
  });

}

export function createGrainTypeSelectedEvent({
  context = {},
  intakeId,
  grainType,
  selectedAt = new Date().toISOString(),
} = {}) {

  return createEvent({
    type:
      NexFarmEventType.GRAIN_TYPE_SELECTED,

    context,

    payload: {
      intakeId,
      grainType,
      selectedAt,
    },
  });

}

/**
 * Record a moisture observation.
 *
 * measurementStage examples:
 * - initial_intake
 * - after_solar_drying
 * - returned_from_drying
 * - drying_return
 * - e_zone
 */
export function createMoistureTestRecordedEvent({
  context = {},
  intakeId,
  moisturePercentage,
  measurementStage = "initial_intake",

  dryingCycleId = null,
  dryingCycleNumber = null,
  dryingCycle = null,

  dryingZoneId = null,
  dryingStartedAt = null,
  dryingEndedAt = null,
  returnedAt = null,

  measuredAt = new Date().toISOString(),
} = {}) {

  const resolvedDryingCycleNumber =
    dryingCycleNumber ??
    dryingCycle ??
    null;

  return createEvent({
    type:
      NexFarmEventType.MOISTURE_TEST_RECORDED,

    context,

    payload: {
      intakeId,
      moisturePercentage,
      measurementStage,

      dryingCycleId,
      dryingCycleNumber:
        resolvedDryingCycleNumber,

      dryingCycle:
        resolvedDryingCycleNumber,

      dryingZoneId,
      dryingStartedAt,
      dryingEndedAt,

      returnedAt:
        returnedAt ??
        dryingEndedAt ??
        null,

      measuredAt,
    },
  });

}

/**
 * Record a physical grain-weight observation.
 *
 * measurementStage examples:
 * - initial_intake
 * - after_solar_drying
 * - returned_from_drying
 * - drying_return
 * - packaging
 * - e_zone
 */
export function createWeightCapturedEvent({
  context = {},
  intakeId,
  weightKg,
  measurementStage = "initial_intake",

  dryingCycleId = null,
  dryingCycleNumber = null,
  dryingCycle = null,

  beforeDryingWeightKg = null,
  dryingZoneId = null,
  dryingStartedAt = null,
  dryingEndedAt = null,
  returnedAt = null,

  capturedAt = new Date().toISOString(),
} = {}) {

  const resolvedDryingCycleNumber =
    dryingCycleNumber ??
    dryingCycle ??
    null;

  return createEvent({
    type:
      NexFarmEventType.WEIGHT_CAPTURED,

    context,

    payload: {
      intakeId,
      weightKg,
      measurementStage,

      dryingCycleId,
      dryingCycleNumber:
        resolvedDryingCycleNumber,

      dryingCycle:
        resolvedDryingCycleNumber,

      beforeDryingWeightKg,
      dryingZoneId,
      dryingStartedAt,
      dryingEndedAt,

      returnedAt:
        returnedAt ??
        dryingEndedAt ??
        null,

      capturedAt,
    },
  });

}

/**
 * ==========================================================
 * Commercial Events
 * ==========================================================
 */

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
  createdAt = new Date().toISOString(),
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
      createdAt,
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

/**
 * ==========================================================
 * Packaging Events
 * ==========================================================
 */

export function createPackagingSuggestedEvent({
  context = {},
  intakeId,
  grainType,
  weightKg,
  suggestedBags = [],
  totalPackagedKg,
  eZoneKg,
  sourceDryingCycleId = null,
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
      sourceDryingCycleId,
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
  sourceDryingCycleId = null,
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
      sourceDryingCycleId,
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

/**
 * ==========================================================
 * Rack Storage Events
 * ==========================================================
 */

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
  sourceDryingCycleId = null,
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
      sourceDryingCycleId,
      assignedAt,
    },
  });

}

/**
 * ==========================================================
 * Solar Drying Custody Events
 * ==========================================================
 */

/**
 * Record the beginning of one internal drying cycle.
 *
 * dryingCycleId is preferred when available.
 * The drying projection can derive a deterministic fallback
 * from intakeId and dryingCycleNumber.
 */
export function createSolarDryingAssignedEvent({
  context = {},
  intakeId,
  dryingCycleId = null,

  dryingCycleNumber = null,
  dryingCycle = 1,

  grainType,
  dryingZoneId,

  moistureAtEntryPercent = null,
  moisturePercentage = null,

  weightAtEntryKg = null,
  beforeDryingWeightKg = null,

  enteredAt = null,
  dryingStartedAt = new Date().toISOString(),

  expectedReviewAt = null,
} = {}) {

  const resolvedDryingCycleNumber =
    dryingCycleNumber ??
    dryingCycle ??
    1;

  const resolvedMoistureAtEntry =
    moistureAtEntryPercent ??
    moisturePercentage ??
    null;

  const resolvedWeightAtEntry =
    weightAtEntryKg ??
    beforeDryingWeightKg ??
    null;

  const resolvedEnteredAt =
    enteredAt ??
    dryingStartedAt;

  return createEvent({
    type:
      NexFarmEventType.SOLAR_DRYING_ASSIGNED,

    context,

    payload: {
      intakeId,
      dryingCycleId,

      dryingCycleNumber:
        resolvedDryingCycleNumber,

      dryingCycle:
        resolvedDryingCycleNumber,

      grainType,
      dryingZoneId,

      moistureAtEntryPercent:
        resolvedMoistureAtEntry,

      moisturePercentage:
        resolvedMoistureAtEntry,

      moistureBefore:
        resolvedMoistureAtEntry,

      weightAtEntryKg:
        resolvedWeightAtEntry,

      beforeDryingWeightKg:
        resolvedWeightAtEntry,

      enteredAt:
        resolvedEnteredAt,

      dryingStartedAt:
        resolvedEnteredAt,

      expectedReviewAt,
    },
  });

}

/**
 * Record the internal safety, custody, moisture,
 * condition, and weight-loss assessment performed
 * after grain returns from a drying zone.
 */
export function createInternalDryingAssessmentRecordedEvent({
  context = {},
  intakeId,
  dryingCycleId = null,

  dryingCycleNumber = null,
  dryingCycle = 1,

  grainType,
  dryingZoneId,

  weightAtEntryKg = null,
  beforeDryingWeightKg = null,

  weightAtReturnKg = null,
  afterDryingWeightKg = null,

  moistureAtEntryPercent = null,
  moistureBefore = null,

  moistureAtReturnPercent = null,
  moistureAfter = null,

  enteredAt = null,
  dryingStartedAt,

  returnedAt = null,
  dryingEndedAt,

  durationMinutes = null,
  dryingDurationMinutes,

  weightLossKg,
  weightLossPercent,
  moistureDropPercent,

  acceptableLossRange,
  targetMoisturePercent,
  abnormalLoss,

  conditionStatus = null,
  grainCondition = "acceptable",

  assessmentDecision,

  conditionNotes = null,
  evidenceReference = null,

  assessedAt = new Date().toISOString(),
} = {}) {

  const resolvedDryingCycleNumber =
    dryingCycleNumber ??
    dryingCycle ??
    1;

  const resolvedWeightAtEntry =
    weightAtEntryKg ??
    beforeDryingWeightKg ??
    null;

  const resolvedWeightAtReturn =
    weightAtReturnKg ??
    afterDryingWeightKg ??
    null;

  const resolvedMoistureAtEntry =
    moistureAtEntryPercent ??
    moistureBefore ??
    null;

  const resolvedMoistureAtReturn =
    moistureAtReturnPercent ??
    moistureAfter ??
    null;

  const resolvedEnteredAt =
    enteredAt ??
    dryingStartedAt ??
    null;

  const resolvedReturnedAt =
    returnedAt ??
    dryingEndedAt ??
    assessedAt;

  const resolvedDurationMinutes =
    durationMinutes ??
    dryingDurationMinutes ??
    null;

  const resolvedConditionStatus =
    conditionStatus ??
    grainCondition ??
    "acceptable";

  return createEvent({
    type:
      NexFarmEventType
        .INTERNAL_DRYING_ASSESSMENT_RECORDED,

    context,

    payload: {
      intakeId,
      dryingCycleId,

      dryingCycleNumber:
        resolvedDryingCycleNumber,

      dryingCycle:
        resolvedDryingCycleNumber,

      grainType,
      dryingZoneId,

      weightAtEntryKg:
        resolvedWeightAtEntry,

      beforeDryingWeightKg:
        resolvedWeightAtEntry,

      weightAtReturnKg:
        resolvedWeightAtReturn,

      afterDryingWeightKg:
        resolvedWeightAtReturn,

      moistureAtEntryPercent:
        resolvedMoistureAtEntry,

      moistureBefore:
        resolvedMoistureAtEntry,

      moistureAtReturnPercent:
        resolvedMoistureAtReturn,

      moistureAfter:
        resolvedMoistureAtReturn,

      enteredAt:
        resolvedEnteredAt,

      dryingStartedAt:
        resolvedEnteredAt,

      returnedAt:
        resolvedReturnedAt,

      dryingEndedAt:
        resolvedReturnedAt,

      durationMinutes:
        resolvedDurationMinutes,

      dryingDurationMinutes:
        resolvedDurationMinutes,

      weightLossKg,
      weightLossPercent,
      moistureDropPercent,

      acceptableLossRange,
      targetMoisturePercent,
      abnormalLoss,

      conditionStatus:
        resolvedConditionStatus,

      grainCondition:
        resolvedConditionStatus,

      assessmentDecision,
      conditionNotes,
      evidenceReference,
      assessedAt,
    },
  });

}

/**
 * Record that a drying batch requires authorized
 * internal loss review before it may continue.
 */
export function createInternalLossReviewRequiredEvent({
  context = {},
  intakeId,
  dryingCycleId = null,

  dryingCycleNumber = null,
  dryingCycle = 1,

  grainType,
  dryingZoneId,

  weightAtEntryKg = null,
  beforeDryingWeightKg = null,

  weightAtReturnKg = null,
  afterDryingWeightKg = null,

  weightLossKg,
  weightLossPercent,

  moistureAtEntryPercent = null,
  moistureBefore = null,

  moistureAtReturnPercent = null,
  moistureAfter = null,

  reviewReason = "ABNORMAL_WEIGHT_LOSS",
  conditionStatus = null,
  conditionNotes = null,
  evidenceReference = null,
  reviewStatus = "pending",

  requiredAt = new Date().toISOString(),
} = {}) {

  const resolvedDryingCycleNumber =
    dryingCycleNumber ??
    dryingCycle ??
    1;

  const resolvedWeightAtEntry =
    weightAtEntryKg ??
    beforeDryingWeightKg ??
    null;

  const resolvedWeightAtReturn =
    weightAtReturnKg ??
    afterDryingWeightKg ??
    null;

  const resolvedMoistureAtEntry =
    moistureAtEntryPercent ??
    moistureBefore ??
    null;

  const resolvedMoistureAtReturn =
    moistureAtReturnPercent ??
    moistureAfter ??
    null;

  return createEvent({
    type:
      NexFarmEventType.INTERNAL_LOSS_REVIEW_REQUIRED,

    context,

    payload: {
      intakeId,
      dryingCycleId,

      dryingCycleNumber:
        resolvedDryingCycleNumber,

      dryingCycle:
        resolvedDryingCycleNumber,

      grainType,
      dryingZoneId,

      weightAtEntryKg:
        resolvedWeightAtEntry,

      beforeDryingWeightKg:
        resolvedWeightAtEntry,

      weightAtReturnKg:
        resolvedWeightAtReturn,

      afterDryingWeightKg:
        resolvedWeightAtReturn,

      weightLossKg,
      weightLossPercent,

      moistureAtEntryPercent:
        resolvedMoistureAtEntry,

      moistureBefore:
        resolvedMoistureAtEntry,

      moistureAtReturnPercent:
        resolvedMoistureAtReturn,

      moistureAfter:
        resolvedMoistureAtReturn,

      reviewReason,
      conditionStatus,
      conditionNotes,
      evidenceReference,
      reviewStatus,
      requiredAt,
    },
  });

}

/**
 * Record a confirmed internal NexFarm grain-loss fact.
 *
 * This is not a supplier rejection and does not reopen
 * pricing or supplier payment. The grain already belongs
 * to NexFarm when this event is created.
 */
export function createInternalGrainLossRecordedEvent({
  context = {},
  intakeId,
  dryingCycleId = null,

  dryingCycleNumber = null,
  dryingCycle = 1,

  grainType,
  dryingZoneId,

  weightAtEntryKg = null,
  beforeDryingWeightKg = null,

  weightAtReturnKg = null,
  assessedWeightKg = null,

  lossQuantityKg,

  moistureAtReturnPercent = null,
  moisturePercentage = null,

  conditionStatus = "lost",
  lossReason,
  conditionNotes = null,
  evidenceReference = null,

  approvalStatus = "pending",
  recordedAt = new Date().toISOString(),
} = {}) {

  const resolvedDryingCycleNumber =
    dryingCycleNumber ??
    dryingCycle ??
    1;

  const resolvedWeightAtEntry =
    weightAtEntryKg ??
    beforeDryingWeightKg ??
    null;

  const resolvedWeightAtReturn =
    weightAtReturnKg ??
    assessedWeightKg ??
    null;

  const resolvedMoistureAtReturn =
    moistureAtReturnPercent ??
    moisturePercentage ??
    null;

  return createEvent({
    type:
      NexFarmEventType.INTERNAL_GRAIN_LOSS_RECORDED,

    context,

    payload: {
      intakeId,
      dryingCycleId,

      dryingCycleNumber:
        resolvedDryingCycleNumber,

      dryingCycle:
        resolvedDryingCycleNumber,

      grainType,
      dryingZoneId,

      weightAtEntryKg:
        resolvedWeightAtEntry,

      beforeDryingWeightKg:
        resolvedWeightAtEntry,

      weightAtReturnKg:
        resolvedWeightAtReturn,

      assessedWeightKg:
        resolvedWeightAtReturn,

      lossQuantityKg,

      moistureAtReturnPercent:
        resolvedMoistureAtReturn,

      moisturePercentage:
        resolvedMoistureAtReturn,

      conditionStatus,
      lossReason,
      conditionNotes,
      evidenceReference,
      approvalStatus,
      recordedAt,
    },
  });

}

/**
 * ==========================================================
 * E-Zone Events
 * ==========================================================
 */

/**
 * Record loose grain assigned to the ventilated E-Zone.
 *
 * E-Zone grain is not represented as a completed NexFarm bag.
 */
export function createEZoneAssignedEvent({
  context = {},
  intakeId,
  grainType,
  eZoneKg,

  moisturePercentage = null,
  eZoneLocationId = null,

  sourceReason = "packaging_remainder",
  sourceDryingCycleId = null,

  assignedAt = new Date().toISOString(),
  expectedReviewAt = null,
} = {}) {

  return createEvent({
    type:
      NexFarmEventType.EZONE_ASSIGNED,

    context,

    payload: {
      intakeId,
      grainType,
      eZoneKg,
      moisturePercentage,
      eZoneLocationId,
      sourceReason,
      sourceDryingCycleId,
      assignedAt,
      expectedReviewAt,
    },
  });

}