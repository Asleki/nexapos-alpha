/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: drying-projection.js
 * Layer: NexFarm Storage Projection
 * NEES: Business Module Read Model Layer
 * ==========================================================
 *
 * Responsibility:
 * Project immutable NexFarm drying, return-measurement,
 * assessment, review, loss, and storage-preparation events
 * into the NexFarm Drying Custody Read Model.
 *
 * This projection allows NexFarm operations and future
 * NexVox AI L1 observers to determine:
 * - Which grain batches are currently drying
 * - Which drying cycle is active
 * - How long a completed drying cycle lasted
 * - Whether return moisture was captured
 * - Whether return weight was captured
 * - Whether internal assessment is pending
 * - Whether packaging and rack admission are allowed
 * - Whether another drying cycle is required
 * - Whether loss review is required
 * - Whether grain has been closed as internal loss
 *
 * Architectural Rule:
 * Events remain the source of truth.
 * This projection creates a disposable derived view only.
 *
 * Future Use:
 * - NexFarm drying dashboard
 * - Drying-zone custody monitoring
 * - Rack admission safety checks
 * - Manager loss-review dashboard
 * - NexVox AI L1 observational analytics
 * - Drying-duration and abnormal-loss analysis
 *
 * NexVox AI may observe this projection but must never:
 * - Approve packaging
 * - Approve rack admission
 * - Resolve loss reviews
 * - Record grain loss
 * - Modify lifecycle state
 * - Execute business operations
 *
 * Depends On:
 * - drying-read-model.js
 *
 * Used By:
 * - read-model-engine.js
 * - nexfarm-bootstrap.js
 * - Future NexFarm UI
 * - Future NexVox AI L1 observer
 *
 * Must Never:
 * - Modify source events
 * - Create business events
 * - Execute Kernel logic
 * - Perform supplier pricing
 * - Process supplier payments
 * - Assign racks
 * - Generate QR codes
 * - Synchronize external systems
 */

import {
  createInitialNexFarmDryingReadModel,
  NexFarmDryingCustodyStatus,
} from "./drying-read-model.js";

/**
 * Stable projection registry name.
 */
export const NEXFARM_DRYING_CUSTODY_PROJECTION =
  "NEXFARM_DRYING_CUSTODY_PROJECTION";

/**
 * NexFarm event types consumed by this projection.
 *
 * The values remain local constants so this projection
 * does not create a circular dependency with
 * nexfarm-events.js.
 */
const DryingProjectionEventType = Object.freeze({

  SOLAR_DRYING_ASSIGNED:
    "SOLAR_DRYING_ASSIGNED",

  MOISTURE_TEST_RECORDED:
    "MOISTURE_TEST_RECORDED",

  WEIGHT_CAPTURED:
    "WEIGHT_CAPTURED",

  INTERNAL_DRYING_ASSESSMENT_RECORDED:
    "INTERNAL_DRYING_ASSESSMENT_RECORDED",

  INTERNAL_LOSS_REVIEW_REQUIRED:
    "INTERNAL_LOSS_REVIEW_REQUIRED",

  LOSS_REVIEW_REQUIRED:
    "LOSS_REVIEW_REQUIRED",

  INTERNAL_GRAIN_LOSS_RECORDED:
    "INTERNAL_GRAIN_LOSS_RECORDED",

  PACKAGING_SUGGESTED:
    "PACKAGING_SUGGESTED",

  EZONE_ASSIGNED:
    "EZONE_ASSIGNED",

  BAG_CREATED:
    "BAG_CREATED",

  RACK_ASSIGNED:
    "RACK_ASSIGNED",

  INTAKE_COMPLETED:
    "INTAKE_COMPLETED",

});

/**
 * Assessment decision values expected from the
 * internal drying assessment event.
 */
const DryingAssessmentDecision = Object.freeze({

  READY_FOR_STORAGE_PREPARATION:
    "ready_for_storage_preparation",

  RETURN_TO_DRYING:
    "return_to_drying",

  LOSS_REVIEW_REQUIRED:
    "loss_review_required",

  INTERNAL_GRAIN_LOSS:
    "internal_grain_loss",

  RETEST_REQUIRED:
    "retest_required",

});

/**
 * Return a normalized event type.
 */
function resolveEventType(event = {}) {

  return (
    event.eventType ??
    event.type ??
    null
  );

}

/**
 * Return the immutable event timestamp used for
 * deterministic read-model updates.
 */
function resolveEventTimestamp(event = {}) {

  return (
    event.timestamp ??
    event.createdAt ??
    null
  );

}

/**
 * Return the event identity context safely.
 */
function resolveIdentityContext(event = {}) {

  const context =
    event.context ?? {};

  const identity =
    context.identity ?? {};

  return {
    actorIdentityId:
      identity.identityId ??
      context.identityId ??
      null,

    actorType:
      identity.actorType ??
      context.actorType ??
      null,

    deviceId:
      context.deviceId ??
      event.deviceId ??
      null,

    estateId:
      context.estateId ??
      identity.estateId ??
      null,

    businessUnitId:
      context.businessUnitId ??
      context.businessUnit ??
      identity.businessUnitId ??
      identity.businessUnit ??
      null,

    runtimeMode:
      context.runtimeMode ??
      event.runtimeMode ??
      null,
  };

}

/**
 * Return a unique array without changing order.
 */
function addUnique(
  values = [],
  value,
) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return [...values];
  }

  if (values.includes(value)) {
    return [...values];
  }

  return [
    ...values,
    value,
  ];

}

/**
 * Remove one value from an array.
 */
function removeValue(
  values = [],
  value,
) {

  return values.filter(
    (currentValue) =>
      currentValue !== value,
  );

}

/**
 * Safely convert a value to a finite number.
 */
function toFiniteNumber(
  value,
  fallback = null,
) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  const numberValue =
    Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return numberValue;

}

/**
 * Normalize a string value.
 */
function normalizeValue(
  value,
) {

  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return String(value)
    .trim()
    .toLowerCase();
}

/**
 * Determine whether a moisture event represents
 * grain returning from solar drying.
 */
function isReturnedMoistureEvent(
  event = {},
) {

  const payload =
    event.payload ?? {};

  const measurementStage =
    normalizeValue(
      payload.measurementStage,
    );

  return (
    measurementStage ===
      "after_solar_drying" ||
    measurementStage ===
      "returned_from_drying" ||
    measurementStage ===
      "drying_return"
  );

}

/**
 * Determine whether a weight event represents
 * grain returning from solar drying.
 */
function isReturnedWeightEvent(
  event = {},
) {

  const payload =
    event.payload ?? {};

  const measurementStage =
    normalizeValue(
      payload.measurementStage,
    );

  return (
    measurementStage ===
      "after_solar_drying" ||
    measurementStage ===
      "returned_from_drying" ||
    measurementStage ===
      "drying_return"
  );

}

/**
 * Build a deterministic drying-cycle ID.
 *
 * An explicit dryingCycleId is preferred.
 * Otherwise, the intake ID and cycle number form
 * a stable derived identifier.
 */
function resolveDryingCycleId({
  payload = {},
  intakeId,
  dryingCycleNumber,
} = {}) {

  return (
    payload.dryingCycleId ??
    payload.dryingCycleID ??
    (
      intakeId
        ? `${intakeId}:DRYING:${dryingCycleNumber}`
        : null
    )
  );

}

/**
 * Resolve the active cycle for one batch.
 */
function resolveCurrentCycle(
  model,
  intakeId,
) {

  const batch =
    model.batchesByIntakeId?.[intakeId] ??
    null;

  if (!batch?.currentDryingCycleId) {
    return null;
  }

  return (
    model.cyclesById?.[
      batch.currentDryingCycleId
    ] ??
    null
  );

}

/**
 * Determine the next drying cycle number.
 */
function resolveNextDryingCycleNumber({
  model,
  intakeId,
  payload = {},
} = {}) {

  const explicitNumber =
    toFiniteNumber(
      payload.dryingCycleNumber ??
      payload.dryingCycle,
      null,
    );

  if (
    explicitNumber !== null &&
    explicitNumber >= 1
  ) {
    return explicitNumber;
  }

  const currentBatch =
    model.batchesByIntakeId?.[intakeId] ??
    null;

  const previousNumber =
    toFiniteNumber(
      currentBatch?.currentDryingCycleNumber,
      0,
    );

  return previousNumber + 1;

}

/**
 * Recalculate operational indexes and aggregates
 * from the current cycle and batch maps.
 *
 * Recalculation avoids incremental aggregate drift
 * during event replay and recovery.
 */
function rebuildDerivedCollections(
  model,
) {

  const cycles =
    Object.values(
      model.cyclesById ?? {},
    );

  const batches =
    Object.values(
      model.batchesByIntakeId ?? {},
    );

  const activeDryingCycleIds = [];
  const returnMeasurementsPendingCycleIds = [];
  const assessmentPendingCycleIds = [];
  const completedDryingCycleIds = [];

  const readyForStoragePreparationIntakeIds = [];
  const returnToDryingIntakeIds = [];
  const lossReviewIntakeIds = [];
  const internalGrainLossIntakeIds = [];

  let totalWeightEnteredKg = 0;
  let totalWeightReturnedKg = 0;
  let totalRecordedWeightLossKg = 0;
  let activeDryingWeightKg = 0;
  let internalGrainLossWeightKg = 0;

  let entryMoistureTotal = 0;
  let entryMoistureCount = 0;

  let returnMoistureTotal = 0;
  let returnMoistureCount = 0;

  let moistureDropTotal = 0;
  let moistureDropCount = 0;

  const durationValues = [];

  for (const cycle of cycles) {

    const entryWeight =
      toFiniteNumber(
        cycle.weightAtEntryKg,
        null,
      );

    const returnWeight =
      toFiniteNumber(
        cycle.weightAtReturnKg,
        null,
      );

    const weightLoss =
      toFiniteNumber(
        cycle.weightLossKg,
        null,
      );

    const entryMoisture =
      toFiniteNumber(
        cycle.moistureAtEntryPercent,
        null,
      );

    const returnMoisture =
      toFiniteNumber(
        cycle.moistureAtReturnPercent,
        null,
      );

    const moistureDrop =
      toFiniteNumber(
        cycle.moistureDropPercent,
        null,
      );

    const durationMinutes =
      toFiniteNumber(
        cycle.durationMinutes,
        null,
      );

    if (entryWeight !== null) {
      totalWeightEnteredKg +=
        entryWeight;
    }

    if (returnWeight !== null) {
      totalWeightReturnedKg +=
        returnWeight;
    }

    if (weightLoss !== null) {
      totalRecordedWeightLossKg +=
        weightLoss;
    }

    if (entryMoisture !== null) {
      entryMoistureTotal +=
        entryMoisture;

      entryMoistureCount +=
        1;
    }

    if (returnMoisture !== null) {
      returnMoistureTotal +=
        returnMoisture;

      returnMoistureCount +=
        1;
    }

    if (moistureDrop !== null) {
      moistureDropTotal +=
        moistureDrop;

      moistureDropCount +=
        1;
    }

    if (durationMinutes !== null) {
      durationValues.push(
        durationMinutes,
      );
    }

    if (
      cycle.status ===
      NexFarmDryingCustodyStatus.ACTIVE_IN_DRYING
    ) {
      activeDryingCycleIds.push(
        cycle.dryingCycleId,
      );

      if (entryWeight !== null) {
        activeDryingWeightKg +=
          entryWeight;
      }
    }

    if (
      cycle.status ===
      NexFarmDryingCustodyStatus
        .RETURN_MEASUREMENTS_PENDING
    ) {
      returnMeasurementsPendingCycleIds.push(
        cycle.dryingCycleId,
      );
    }

    if (
      cycle.status ===
      NexFarmDryingCustodyStatus.ASSESSMENT_PENDING
    ) {
      assessmentPendingCycleIds.push(
        cycle.dryingCycleId,
      );
    }

    if (
      cycle.status ===
      NexFarmDryingCustodyStatus.DRYING_COMPLETED
    ) {
      completedDryingCycleIds.push(
        cycle.dryingCycleId,
      );
    }

    if (
      cycle.closedAsLoss === true
    ) {
      const lostWeight =
        toFiniteNumber(
          cycle.lossQuantityKg,
          returnWeight ??
          entryWeight ??
          null,
        );

      if (lostWeight !== null) {
        internalGrainLossWeightKg +=
          lostWeight;
      }
    }

  }

  for (const batch of batches) {

    if (
      batch.currentStatus ===
      NexFarmDryingCustodyStatus
        .READY_FOR_STORAGE_PREPARATION
    ) {
      readyForStoragePreparationIntakeIds.push(
        batch.intakeId,
      );
    }

    if (
      batch.currentStatus ===
      NexFarmDryingCustodyStatus.RETURN_TO_DRYING
    ) {
      returnToDryingIntakeIds.push(
        batch.intakeId,
      );
    }

    if (
      batch.currentStatus ===
        NexFarmDryingCustodyStatus
          .LOSS_REVIEW_REQUIRED ||
      batch.currentStatus ===
        NexFarmDryingCustodyStatus
          .LOSS_REVIEW_PENDING
    ) {
      lossReviewIntakeIds.push(
        batch.intakeId,
      );
    }

    if (
      batch.currentStatus ===
      NexFarmDryingCustodyStatus
        .INTERNAL_GRAIN_LOSS
    ) {
      internalGrainLossIntakeIds.push(
        batch.intakeId,
      );
    }

  }

  const totalDurationMinutes =
    durationValues.reduce(
      (total, duration) =>
        total + duration,
      0,
    );

  return {
    ...model,

    activeDryingCycleIds,

    returnMeasurementsPendingCycleIds,

    assessmentPendingCycleIds,

    readyForStoragePreparationIntakeIds,

    returnToDryingIntakeIds,

    lossReviewIntakeIds,

    internalGrainLossIntakeIds,

    completedDryingCycleIds,

    totals: {
      totalBatches:
        batches.length,

      totalDryingCycles:
        cycles.length,

      activeDryingCycles:
        activeDryingCycleIds.length,

      returnMeasurementsPending:
        returnMeasurementsPendingCycleIds.length,

      assessmentsPending:
        assessmentPendingCycleIds.length,

      readyForStoragePreparation:
        readyForStoragePreparationIntakeIds.length,

      returnToDrying:
        returnToDryingIntakeIds.length,

      lossReviewsRequired:
        lossReviewIntakeIds.length,

      internalGrainLosses:
        internalGrainLossIntakeIds.length,

      completedDryingCycles:
        completedDryingCycleIds.length,
    },

    weights: {
      totalWeightEnteredKg:
        Number(
          totalWeightEnteredKg.toFixed(3),
        ),

      totalWeightReturnedKg:
        Number(
          totalWeightReturnedKg.toFixed(3),
        ),

      totalRecordedWeightLossKg:
        Number(
          totalRecordedWeightLossKg.toFixed(3),
        ),

      activeDryingWeightKg:
        Number(
          activeDryingWeightKg.toFixed(3),
        ),

      internalGrainLossWeightKg:
        Number(
          internalGrainLossWeightKg.toFixed(3),
        ),
    },

    moisture: {
      totalEntryMoistureObservations:
        entryMoistureCount,

      totalReturnMoistureObservations:
        returnMoistureCount,

      averageEntryMoisturePercent:
        entryMoistureCount > 0
          ? Number(
              (
                entryMoistureTotal /
                entryMoistureCount
              ).toFixed(3),
            )
          : null,

      averageReturnMoisturePercent:
        returnMoistureCount > 0
          ? Number(
              (
                returnMoistureTotal /
                returnMoistureCount
              ).toFixed(3),
            )
          : null,

      averageMoistureDropPercent:
        moistureDropCount > 0
          ? Number(
              (
                moistureDropTotal /
                moistureDropCount
              ).toFixed(3),
            )
          : null,
    },

    duration: {
      completedDurationObservations:
        durationValues.length,

      totalCompletedDurationMinutes:
        totalDurationMinutes,

      averageDryingDurationMinutes:
        durationValues.length > 0
          ? Number(
              (
                totalDurationMinutes /
                durationValues.length
              ).toFixed(3),
            )
          : null,

      longestDryingDurationMinutes:
        durationValues.length > 0
          ? Math.max(
              ...durationValues,
            )
          : null,

      shortestDryingDurationMinutes:
        durationValues.length > 0
          ? Math.min(
              ...durationValues,
            )
          : null,
    },
  };

}

/**
 * Apply read-model update metadata.
 */
function finalizeProjection({
  model,
  event,
} = {}) {

  return rebuildDerivedCollections({
    ...model,

    lastProcessedEventId:
      event.eventId ??
      null,

    lastProcessedEventType:
      resolveEventType(event),

    lastUpdatedAt:
      resolveEventTimestamp(event),
  });

}

/**
 * Project SOLAR_DRYING_ASSIGNED.
 */
function projectSolarDryingAssigned({
  model,
  event,
} = {}) {

  const payload =
    event.payload ?? {};

  const intakeId =
    payload.intakeId ??
    null;

  if (!intakeId) {
    return model;
  }

  const dryingCycleNumber =
    resolveNextDryingCycleNumber({
      model,
      intakeId,
      payload,
    });

  const dryingCycleId =
    resolveDryingCycleId({
      payload,
      intakeId,
      dryingCycleNumber,
    });

  if (!dryingCycleId) {
    return model;
  }

  const timestamp =
    resolveEventTimestamp(event);

  const identity =
    resolveIdentityContext(event);

  const existingBatch =
    model.batchesByIntakeId?.[intakeId] ??
    null;

  const existingCycle =
    model.cyclesById?.[dryingCycleId] ??
    null;

  const cycle = {
    ...(existingCycle ?? {}),

    dryingCycleId,
    intakeId,
    dryingCycleNumber,

    grainType:
      payload.grainType ??
      existingBatch?.grainType ??
      null,

    dryingZoneId:
      payload.dryingZoneId ??
      null,

    weightAtEntryKg:
      toFiniteNumber(
        payload.weightAtEntryKg ??
        payload.beforeDryingWeightKg,
        null,
      ),

    moistureAtEntryPercent:
      toFiniteNumber(
        payload.moistureAtEntryPercent ??
        payload.moisturePercentage ??
        payload.moistureBefore,
        null,
      ),

    enteredAt:
      payload.enteredAt ??
      payload.dryingStartedAt ??
      timestamp,

    expectedReviewAt:
      payload.expectedReviewAt ??
      null,

    returnedAt:
      null,

    weightAtReturnKg:
      null,

    moistureAtReturnPercent:
      null,

    durationMinutes:
      null,

    weightLossKg:
      null,

    weightLossPercent:
      null,

    moistureDropPercent:
      null,

    conditionStatus:
      null,

    conditionNotes:
      null,

    assessmentDecision:
      null,

    evidenceReference:
      null,

    abnormalLoss:
      false,

    reviewRequired:
      false,

    packagingAllowed:
      false,

    rackAssignmentAllowed:
      false,

    closedAsLoss:
      false,

    lossQuantityKg:
      null,

    ...identity,

    status:
      NexFarmDryingCustodyStatus.ACTIVE_IN_DRYING,

    createdAt:
      existingCycle?.createdAt ??
      timestamp,

    lastUpdatedAt:
      timestamp,
  };

  const batch = {
    ...(existingBatch ?? {}),

    intakeId,

    grainType:
      payload.grainType ??
      existingBatch?.grainType ??
      null,

    currentDryingCycleId:
      dryingCycleId,

    currentDryingCycleNumber:
      dryingCycleNumber,

    dryingCycleIds:
      addUnique(
        existingBatch?.dryingCycleIds ?? [],
        dryingCycleId,
      ),

    currentStatus:
      NexFarmDryingCustodyStatus.ACTIVE_IN_DRYING,

    packagingAllowed:
      false,

    rackAssignmentAllowed:
      false,

    reviewRequired:
      false,

    closedAsLoss:
      false,

    estateId:
      identity.estateId ??
      existingBatch?.estateId ??
      null,

    businessUnitId:
      identity.businessUnitId ??
      existingBatch?.businessUnitId ??
      null,

    runtimeMode:
      identity.runtimeMode ??
      existingBatch?.runtimeMode ??
      null,

    createdAt:
      existingBatch?.createdAt ??
      timestamp,

    lastUpdatedAt:
      timestamp,
  };

  return finalizeProjection({
    event,

    model: {
      ...model,

      batchesByIntakeId: {
        ...model.batchesByIntakeId,
        [intakeId]:
          batch,
      },

      cyclesById: {
        ...model.cyclesById,
        [dryingCycleId]:
          cycle,
      },

      dryingCycleIds:
        addUnique(
          model.dryingCycleIds,
          dryingCycleId,
        ),

      dryingBatchIds:
        addUnique(
          model.dryingBatchIds,
          intakeId,
        ),
    },
  });

}

/**
 * Project returned moisture measurement.
 */
function projectReturnedMoisture({
  model,
  event,
} = {}) {

  if (!isReturnedMoistureEvent(event)) {
    return model;
  }

  const payload =
    event.payload ?? {};

  const intakeId =
    payload.intakeId ??
    null;

  if (!intakeId) {
    return model;
  }

  const currentCycle =
    resolveCurrentCycle(
      model,
      intakeId,
    );

  if (!currentCycle) {
    return model;
  }

  const timestamp =
    resolveEventTimestamp(event);

  const moistureAtReturnPercent =
    toFiniteNumber(
      payload.moistureAtReturnPercent ??
      payload.moisturePercentage ??
      payload.moistureAfter,
      null,
    );

  const weightRecorded =
    currentCycle.weightAtReturnKg !== null &&
    currentCycle.weightAtReturnKg !== undefined;

  const cycle = {
    ...currentCycle,

    moistureAtReturnPercent,

    returnedAt:
      payload.returnedAt ??
      payload.dryingEndedAt ??
      currentCycle.returnedAt ??
      timestamp,

    status:
      weightRecorded
        ? NexFarmDryingCustodyStatus
            .ASSESSMENT_PENDING
        : NexFarmDryingCustodyStatus
            .RETURN_MEASUREMENTS_PENDING,

    lastUpdatedAt:
      timestamp,
  };

  const batch =
    model.batchesByIntakeId[intakeId];

  return finalizeProjection({
    event,

    model: {
      ...model,

      batchesByIntakeId: {
        ...model.batchesByIntakeId,

        [intakeId]: {
          ...batch,

          currentStatus:
            cycle.status,

          packagingAllowed:
            false,

          rackAssignmentAllowed:
            false,

          lastUpdatedAt:
            timestamp,
        },
      },

      cyclesById: {
        ...model.cyclesById,

        [cycle.dryingCycleId]:
          cycle,
      },
    },
  });

}

/**
 * Project returned weight measurement.
 */
function projectReturnedWeight({
  model,
  event,
} = {}) {

  if (!isReturnedWeightEvent(event)) {
    return model;
  }

  const payload =
    event.payload ?? {};

  const intakeId =
    payload.intakeId ??
    null;

  if (!intakeId) {
    return model;
  }

  const currentCycle =
    resolveCurrentCycle(
      model,
      intakeId,
    );

  if (!currentCycle) {
    return model;
  }

  const timestamp =
    resolveEventTimestamp(event);

  const weightAtReturnKg =
    toFiniteNumber(
      payload.weightAtReturnKg ??
      payload.weightKg ??
      payload.afterDryingWeightKg,
      null,
    );

  const moistureRecorded =
    currentCycle.moistureAtReturnPercent !== null &&
    currentCycle.moistureAtReturnPercent !== undefined;

  const cycle = {
    ...currentCycle,

    weightAtReturnKg,

    returnedAt:
      payload.returnedAt ??
      payload.dryingEndedAt ??
      currentCycle.returnedAt ??
      timestamp,

    status:
      moistureRecorded
        ? NexFarmDryingCustodyStatus
            .ASSESSMENT_PENDING
        : NexFarmDryingCustodyStatus
            .RETURN_MEASUREMENTS_PENDING,

    lastUpdatedAt:
      timestamp,
  };

  const batch =
    model.batchesByIntakeId[intakeId];

  return finalizeProjection({
    event,

    model: {
      ...model,

      batchesByIntakeId: {
        ...model.batchesByIntakeId,

        [intakeId]: {
          ...batch,

          currentStatus:
            cycle.status,

          packagingAllowed:
            false,

          rackAssignmentAllowed:
            false,

          lastUpdatedAt:
            timestamp,
        },
      },

      cyclesById: {
        ...model.cyclesById,

        [cycle.dryingCycleId]:
          cycle,
      },
    },
  });

}

/**
 * Project INTERNAL_DRYING_ASSESSMENT_RECORDED.
 */
function projectInternalDryingAssessment({
  model,
  event,
} = {}) {

  const payload =
    event.payload ?? {};

  const intakeId =
    payload.intakeId ??
    null;

  if (!intakeId) {
    return model;
  }

  const currentCycle =
    resolveCurrentCycle(
      model,
      intakeId,
    );

  if (!currentCycle) {
    return model;
  }

  const timestamp =
    resolveEventTimestamp(event);

  const assessmentDecision =
    normalizeValue(
      payload.assessmentDecision,
    );

  let status =
    NexFarmDryingCustodyStatus
      .ASSESSMENT_PENDING;

  if (
    assessmentDecision ===
    DryingAssessmentDecision
      .READY_FOR_STORAGE_PREPARATION
  ) {
    status =
      NexFarmDryingCustodyStatus
        .READY_FOR_STORAGE_PREPARATION;
  } else if (
    assessmentDecision ===
    DryingAssessmentDecision
      .RETURN_TO_DRYING
  ) {
    status =
      NexFarmDryingCustodyStatus
        .RETURN_TO_DRYING;
  } else if (
    assessmentDecision ===
    DryingAssessmentDecision
      .LOSS_REVIEW_REQUIRED
  ) {
    status =
      NexFarmDryingCustodyStatus
        .LOSS_REVIEW_REQUIRED;
  } else if (
    assessmentDecision ===
    DryingAssessmentDecision
      .INTERNAL_GRAIN_LOSS
  ) {
    status =
      NexFarmDryingCustodyStatus
        .INTERNAL_GRAIN_LOSS;
  }

  const readyForStorage =
    status ===
    NexFarmDryingCustodyStatus
      .READY_FOR_STORAGE_PREPARATION;

  const reviewRequired =
    status ===
      NexFarmDryingCustodyStatus
        .LOSS_REVIEW_REQUIRED ||
    status ===
      NexFarmDryingCustodyStatus
        .LOSS_REVIEW_PENDING;

  const closedAsLoss =
    status ===
    NexFarmDryingCustodyStatus
      .INTERNAL_GRAIN_LOSS;

  const cycle = {
    ...currentCycle,

    weightAtEntryKg:
      toFiniteNumber(
        payload.weightAtEntryKg ??
        payload.beforeDryingWeightKg,
        currentCycle.weightAtEntryKg,
      ),

    weightAtReturnKg:
      toFiniteNumber(
        payload.weightAtReturnKg ??
        payload.afterDryingWeightKg,
        currentCycle.weightAtReturnKg,
      ),

    moistureAtEntryPercent:
      toFiniteNumber(
        payload.moistureAtEntryPercent ??
        payload.moistureBefore,
        currentCycle.moistureAtEntryPercent,
      ),

    moistureAtReturnPercent:
      toFiniteNumber(
        payload.moistureAtReturnPercent ??
        payload.moistureAfter,
        currentCycle.moistureAtReturnPercent,
      ),

    returnedAt:
      payload.returnedAt ??
      payload.dryingEndedAt ??
      currentCycle.returnedAt ??
      timestamp,

    durationMinutes:
      toFiniteNumber(
        payload.durationMinutes ??
        payload.dryingDurationMinutes,
        currentCycle.durationMinutes,
      ),

    weightLossKg:
      toFiniteNumber(
        payload.weightLossKg,
        currentCycle.weightLossKg,
      ),

    weightLossPercent:
      toFiniteNumber(
        payload.weightLossPercent,
        currentCycle.weightLossPercent,
      ),

    moistureDropPercent:
      toFiniteNumber(
        payload.moistureDropPercent,
        currentCycle.moistureDropPercent,
      ),

    conditionStatus:
      payload.conditionStatus ??
      payload.grainCondition ??
      currentCycle.conditionStatus ??
      null,

    conditionNotes:
      payload.conditionNotes ??
      currentCycle.conditionNotes ??
      null,

    assessmentDecision,

    evidenceReference:
      payload.evidenceReference ??
      currentCycle.evidenceReference ??
      null,

    abnormalLoss:
      payload.abnormalLoss === true,

    reviewRequired,

    packagingAllowed:
      readyForStorage,

    rackAssignmentAllowed:
      readyForStorage,

    closedAsLoss,

    lossQuantityKg:
      closedAsLoss
        ? toFiniteNumber(
            payload.lossQuantityKg,
            payload.afterDryingWeightKg ??
            currentCycle.weightAtReturnKg,
          )
        : currentCycle.lossQuantityKg,

    status,

    lastUpdatedAt:
      timestamp,
  };

  const batch =
    model.batchesByIntakeId[intakeId];

  return finalizeProjection({
    event,

    model: {
      ...model,

      batchesByIntakeId: {
        ...model.batchesByIntakeId,

        [intakeId]: {
          ...batch,

          currentStatus:
            status,

          packagingAllowed:
            readyForStorage,

          rackAssignmentAllowed:
            readyForStorage,

          reviewRequired,

          closedAsLoss,

          lastUpdatedAt:
            timestamp,
        },
      },

      cyclesById: {
        ...model.cyclesById,

        [cycle.dryingCycleId]:
          cycle,
      },
    },
  });

}

/**
 * Project internal loss-review requirement.
 */
function projectInternalLossReview({
  model,
  event,
} = {}) {

  const payload =
    event.payload ?? {};

  const intakeId =
    payload.intakeId ??
    null;

  if (!intakeId) {
    return model;
  }

  const currentCycle =
    resolveCurrentCycle(
      model,
      intakeId,
    );

  if (!currentCycle) {
    return model;
  }

  const timestamp =
    resolveEventTimestamp(event);

  const cycle = {
    ...currentCycle,

    reviewRequired:
      true,

    packagingAllowed:
      false,

    rackAssignmentAllowed:
      false,

    status:
      NexFarmDryingCustodyStatus
        .LOSS_REVIEW_PENDING,

    lastUpdatedAt:
      timestamp,
  };

  const batch =
    model.batchesByIntakeId[intakeId];

  return finalizeProjection({
    event,

    model: {
      ...model,

      batchesByIntakeId: {
        ...model.batchesByIntakeId,

        [intakeId]: {
          ...batch,

          currentStatus:
            NexFarmDryingCustodyStatus
              .LOSS_REVIEW_PENDING,

          packagingAllowed:
            false,

          rackAssignmentAllowed:
            false,

          reviewRequired:
            true,

          lastUpdatedAt:
            timestamp,
        },
      },

      cyclesById: {
        ...model.cyclesById,

        [cycle.dryingCycleId]:
          cycle,
      },
    },
  });

}

/**
 * Project confirmed internal grain loss.
 */
function projectInternalGrainLoss({
  model,
  event,
} = {}) {

  const payload =
    event.payload ?? {};

  const intakeId =
    payload.intakeId ??
    null;

  if (!intakeId) {
    return model;
  }

  const currentCycle =
    resolveCurrentCycle(
      model,
      intakeId,
    );

  if (!currentCycle) {
    return model;
  }

  const timestamp =
    resolveEventTimestamp(event);

  const cycle = {
    ...currentCycle,

    conditionStatus:
      payload.conditionStatus ??
      currentCycle.conditionStatus ??
      "lost",

    conditionNotes:
      payload.conditionNotes ??
      currentCycle.conditionNotes ??
      null,

    evidenceReference:
      payload.evidenceReference ??
      currentCycle.evidenceReference ??
      null,

    assessmentDecision:
      DryingAssessmentDecision
        .INTERNAL_GRAIN_LOSS,

    reviewRequired:
      false,

    packagingAllowed:
      false,

    rackAssignmentAllowed:
      false,

    closedAsLoss:
      true,

    lossQuantityKg:
      toFiniteNumber(
        payload.lossQuantityKg,
        currentCycle.weightAtReturnKg ??
        currentCycle.weightAtEntryKg,
      ),

    lossReason:
      payload.lossReason ??
      null,

    approvalStatus:
      payload.approvalStatus ??
      "pending",

    status:
      NexFarmDryingCustodyStatus
        .INTERNAL_GRAIN_LOSS,

    lastUpdatedAt:
      timestamp,
  };

  const batch =
    model.batchesByIntakeId[intakeId];

  return finalizeProjection({
    event,

    model: {
      ...model,

      batchesByIntakeId: {
        ...model.batchesByIntakeId,

        [intakeId]: {
          ...batch,

          currentStatus:
            NexFarmDryingCustodyStatus
              .INTERNAL_GRAIN_LOSS,

          packagingAllowed:
            false,

          rackAssignmentAllowed:
            false,

          reviewRequired:
            false,

          closedAsLoss:
            true,

          lastUpdatedAt:
            timestamp,
        },
      },

      cyclesById: {
        ...model.cyclesById,

        [cycle.dryingCycleId]:
          cycle,
      },
    },
  });

}

/**
 * Mark drying custody complete when a ready batch
 * proceeds into an accepted downstream storage-
 * preparation activity.
 */
function projectStoragePreparationStarted({
  model,
  event,
} = {}) {

  const payload =
    event.payload ?? {};

  const intakeId =
    payload.intakeId ??
    null;

  if (!intakeId) {
    return model;
  }

  const batch =
    model.batchesByIntakeId?.[intakeId] ??
    null;

  if (
    !batch ||
    batch.currentStatus !==
      NexFarmDryingCustodyStatus
        .READY_FOR_STORAGE_PREPARATION
  ) {
    return model;
  }

  const currentCycle =
    resolveCurrentCycle(
      model,
      intakeId,
    );

  if (!currentCycle) {
    return model;
  }

  const timestamp =
    resolveEventTimestamp(event);

  const cycle = {
    ...currentCycle,

    status:
      NexFarmDryingCustodyStatus
        .DRYING_COMPLETED,

    packagingAllowed:
      true,

    rackAssignmentAllowed:
      true,

    lastUpdatedAt:
      timestamp,
  };

  return finalizeProjection({
    event,

    model: {
      ...model,

      batchesByIntakeId: {
        ...model.batchesByIntakeId,

        [intakeId]: {
          ...batch,

          currentStatus:
            NexFarmDryingCustodyStatus
              .DRYING_COMPLETED,

          lastUpdatedAt:
            timestamp,
        },
      },

      cyclesById: {
        ...model.cyclesById,

        [cycle.dryingCycleId]:
          cycle,
      },
    },
  });

}
/**
 * Project NexFarm events into the drying custody
 * read model.
 */
export function projectNexFarmDryingCustody({
  currentModel,
  event,
} = {}) {

  const model =
    currentModel ??
    createInitialNexFarmDryingReadModel();

  if (!event) {
    return model;
  }

  const eventType =
    resolveEventType(event);

  switch (eventType) {

    case DryingProjectionEventType
      .SOLAR_DRYING_ASSIGNED:

      return projectSolarDryingAssigned({
        model,
        event,
      });

    case DryingProjectionEventType
      .MOISTURE_TEST_RECORDED:

      return projectReturnedMoisture({
        model,
        event,
      });

    case DryingProjectionEventType
      .WEIGHT_CAPTURED:

      return projectReturnedWeight({
        model,
        event,
      });

    case DryingProjectionEventType
      .INTERNAL_DRYING_ASSESSMENT_RECORDED:

      return projectInternalDryingAssessment({
        model,
        event,
      });

    case DryingProjectionEventType
      .INTERNAL_LOSS_REVIEW_REQUIRED:

    case DryingProjectionEventType
      .LOSS_REVIEW_REQUIRED:

      return projectInternalLossReview({
        model,
        event,
      });

    case DryingProjectionEventType
      .INTERNAL_GRAIN_LOSS_RECORDED:

      return projectInternalGrainLoss({
        model,
        event,
      });

    case DryingProjectionEventType
      .PACKAGING_SUGGESTED:

    case DryingProjectionEventType
      .EZONE_ASSIGNED:

    case DryingProjectionEventType
      .BAG_CREATED:

    case DryingProjectionEventType
      .RACK_ASSIGNED:

    case DryingProjectionEventType
      .INTAKE_COMPLETED:

      return projectStoragePreparationStarted({
        model,
        event,
      });

    default:
      return model;

  }

}