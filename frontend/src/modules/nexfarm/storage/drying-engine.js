/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: drying-engine.js
 * Layer: NexFarm Storage Engine
 * NEES: Business Module Execution Layer
 * ==========================================================
 *
 * Responsibility:
 * Analyze NexFarm solar-drying results using
 * moisture, weight, duration, and grain-condition data.
 *
 * The engine supports internal storage safety,
 * custody monitoring, abnormal-loss detection,
 * and post-drying routing decisions.
 *
 * Must Never:
 * - Create business events
 * - Execute Kernel logic
 * - Process supplier payments
 * - Recalculate supplier prices
 * - Assign racks
 * - Generate QR codes
 * - Modify inventory directly
 * - Synchronize external systems
 */

export const NexFarmDryingDecision = Object.freeze({

  READY_FOR_STORAGE_PREPARATION:
    "ready_for_storage_preparation",

  RETURN_TO_DRYING:
    "return_to_drying",

  RETEST_REQUIRED:
    "retest_required",

  LOSS_REVIEW_REQUIRED:
    "loss_review_required",

  INTERNAL_GRAIN_LOSS:
    "internal_grain_loss",

});

export const NexFarmGrainCondition = Object.freeze({

  ACCEPTABLE:
    "acceptable",

  RAIN_DAMAGED:
    "rain_damaged",

  MOULD_OR_ROT:
    "mould_or_rot",

  CONTAMINATED:
    "contaminated",

  PEST_DAMAGED:
    "pest_damaged",

  SPOILED:
    "spoiled",

  HANDLING_DAMAGED:
    "handling_damaged",

  UNSAFE:
    "unsafe",

});

const SUPPORTED_GRAIN_CONDITIONS =
  Object.freeze(
    Object.values(
      NexFarmGrainCondition,
    ),
  );

const INTERNAL_LOSS_CONDITIONS =
  Object.freeze([
    NexFarmGrainCondition.RAIN_DAMAGED,
    NexFarmGrainCondition.MOULD_OR_ROT,
    NexFarmGrainCondition.CONTAMINATED,
    NexFarmGrainCondition.PEST_DAMAGED,
    NexFarmGrainCondition.SPOILED,
    NexFarmGrainCondition.UNSAFE,
  ]);

export function normalizeGrainCondition(
  grainCondition,
) {

  return String(
    grainCondition ??
    NexFarmGrainCondition.ACCEPTABLE,
  )
    .trim()
    .toLowerCase();

}

export function isSupportedGrainCondition(
  grainCondition,
) {

  const normalizedCondition =
    normalizeGrainCondition(
      grainCondition,
    );

  return SUPPORTED_GRAIN_CONDITIONS.includes(
    normalizedCondition,
  );

}

export function isInternalLossCondition(
  grainCondition,
) {

  const normalizedCondition =
    normalizeGrainCondition(
      grainCondition,
    );

  return INTERNAL_LOSS_CONDITIONS.includes(
    normalizedCondition,
  );

}

export function calculateDryingDurationMinutes({
  dryingStartedAt,
  dryingEndedAt,
} = {}) {

  if (
    !dryingStartedAt ||
    !dryingEndedAt
  ) {
    return null;
  }

  const startedAt =
    new Date(
      dryingStartedAt,
    ).getTime();

  const endedAt =
    new Date(
      dryingEndedAt,
    ).getTime();

  if (
    Number.isNaN(startedAt) ||
    Number.isNaN(endedAt) ||
    endedAt < startedAt
  ) {
    return null;
  }

  return Math.round(
    (
      endedAt -
      startedAt
    ) /
    60000,
  );

}

export function analyzeDryingResult({
  beforeDryingWeightKg,
  afterDryingWeightKg,
  moistureBefore,
  moistureAfter,
  dryingStartedAt,
  dryingEndedAt,
  acceptableLossPercentMin = 0,
  acceptableLossPercentMax = 5,
  targetMoisturePercent = 14,
  grainCondition =
    NexFarmGrainCondition.ACCEPTABLE,
} = {}) {

  const beforeWeight =
    Number(
      beforeDryingWeightKg,
    );

  const afterWeight =
    Number(
      afterDryingWeightKg,
    );

  const beforeMoisture =
    Number(
      moistureBefore,
    );

  const afterMoisture =
    Number(
      moistureAfter,
    );

  const minimumLossPercent =
    Number(
      acceptableLossPercentMin,
    );

  const maximumLossPercent =
    Number(
      acceptableLossPercentMax,
    );

  const targetMoisture =
    Number(
      targetMoisturePercent,
    );

  const normalizedGrainCondition =
    normalizeGrainCondition(
      grainCondition,
    );

  if (
    Number.isNaN(beforeWeight) ||
    beforeWeight <= 0
  ) {
    return Object.freeze({
      accepted: false,
      reason:
        "INVALID_BEFORE_DRYING_WEIGHT",
      analysis: null,
    });
  }

  if (
    Number.isNaN(afterWeight) ||
    afterWeight <= 0
  ) {
    return Object.freeze({
      accepted: false,
      reason:
        "INVALID_AFTER_DRYING_WEIGHT",
      analysis: null,
    });
  }

  if (
    afterWeight >
    beforeWeight
  ) {
    return Object.freeze({
      accepted: false,
      reason:
        "AFTER_WEIGHT_EXCEEDS_BEFORE_WEIGHT",
      analysis: null,
    });
  }

  if (
    Number.isNaN(beforeMoisture) ||
    beforeMoisture < 0
  ) {
    return Object.freeze({
      accepted: false,
      reason:
        "INVALID_MOISTURE_BEFORE",
      analysis: null,
    });
  }

  if (
    Number.isNaN(afterMoisture) ||
    afterMoisture < 0
  ) {
    return Object.freeze({
      accepted: false,
      reason:
        "INVALID_MOISTURE_AFTER",
      analysis: null,
    });
  }

  if (
    Number.isNaN(minimumLossPercent) ||
    minimumLossPercent < 0
  ) {
    return Object.freeze({
      accepted: false,
      reason:
        "INVALID_ACCEPTABLE_LOSS_MINIMUM",
      analysis: null,
    });
  }

  if (
    Number.isNaN(maximumLossPercent) ||
    maximumLossPercent < 0
  ) {
    return Object.freeze({
      accepted: false,
      reason:
        "INVALID_ACCEPTABLE_LOSS_MAXIMUM",
      analysis: null,
    });
  }

  if (
    maximumLossPercent <
    minimumLossPercent
  ) {
    return Object.freeze({
      accepted: false,
      reason:
        "INVALID_ACCEPTABLE_LOSS_RANGE",
      analysis: null,
    });
  }

  if (
    Number.isNaN(targetMoisture) ||
    targetMoisture < 0
  ) {
    return Object.freeze({
      accepted: false,
      reason:
        "INVALID_TARGET_MOISTURE",
      analysis: null,
    });
  }

  if (
    !isSupportedGrainCondition(
      normalizedGrainCondition,
    )
  ) {
    return Object.freeze({
      accepted: false,
      reason:
        "UNSUPPORTED_GRAIN_CONDITION",
      analysis: null,
    });
  }

  const dryingDurationMinutes =
    calculateDryingDurationMinutes({
      dryingStartedAt,
      dryingEndedAt,
    });

  const weightLossKg =
    Number(
      (
        beforeWeight -
        afterWeight
      ).toFixed(3),
    );

  const weightLossPercent =
    Number(
      (
        (
          weightLossKg /
          beforeWeight
        ) *
        100
      ).toFixed(3),
    );

  const moistureDropPercent =
    Number(
      (
        beforeMoisture -
        afterMoisture
      ).toFixed(3),
    );

  const abnormalLoss =
    weightLossPercent <
      minimumLossPercent ||
    weightLossPercent >
      maximumLossPercent;

  const moistureSafe =
    afterMoisture <=
    targetMoisture;

  const grainConditionAcceptable =
    normalizedGrainCondition ===
      NexFarmGrainCondition.ACCEPTABLE ||
    normalizedGrainCondition ===
      NexFarmGrainCondition.HANDLING_DAMAGED;

  const internalLossCondition =
    isInternalLossCondition(
      normalizedGrainCondition,
    );

  let recommendedNextAction =
    NexFarmDryingDecision
      .READY_FOR_STORAGE_PREPARATION;

  if (
    internalLossCondition
  ) {
    recommendedNextAction =
      NexFarmDryingDecision
        .INTERNAL_GRAIN_LOSS;
  } else if (
    abnormalLoss
  ) {
    recommendedNextAction =
      NexFarmDryingDecision
        .LOSS_REVIEW_REQUIRED;
  } else if (
    dryingDurationMinutes ===
    null
  ) {
    recommendedNextAction =
      NexFarmDryingDecision
        .RETEST_REQUIRED;
  } else if (
    !moistureSafe
  ) {
    recommendedNextAction =
      NexFarmDryingDecision
        .RETURN_TO_DRYING;
  }

  const storagePreparationReady =
    recommendedNextAction ===
    NexFarmDryingDecision
      .READY_FOR_STORAGE_PREPARATION;

  return Object.freeze({
    accepted: true,
    reason: null,

    analysis: Object.freeze({

      beforeDryingWeightKg:
        beforeWeight,

      afterDryingWeightKg:
        afterWeight,

      moistureBefore:
        beforeMoisture,

      moistureAfter:
        afterMoisture,

      dryingStartedAt:
        dryingStartedAt ??
        null,

      dryingEndedAt:
        dryingEndedAt ??
        null,

      dryingDurationMinutes,

      weightLossKg,

      weightLossPercent,

      moistureDropPercent,

      acceptableLossRange:
        Object.freeze({

          minPercent:
            minimumLossPercent,

          maxPercent:
            maximumLossPercent,

        }),

      targetMoisturePercent:
        targetMoisture,

      moistureSafe,

      abnormalLoss,

      grainCondition:
        normalizedGrainCondition,

      grainConditionAcceptable,

      internalLossCondition,

      storagePreparationReady,

      packagingBlocked:
        !storagePreparationReady,

      rackAssignmentBlocked:
        !storagePreparationReady,

      recommendedNextAction,

    }),
  });

}