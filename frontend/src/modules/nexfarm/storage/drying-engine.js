/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: drying-engine.js
 * Layer: NexFarm Storage Engine
 * NEES: Business Module Execution Layer
 * ==========================================================
 *
 * Responsibility:
 * Analyze solar drying movement, drying duration,
 * moisture change, and weight-loss reasonability for
 * NexFarm grain assigned to the drying zone.
 *
 * Must Never:
 * - Create business events
 * - Execute Kernel logic
 * - Process supplier payments
 * - Assign racks
 * - Generate QR codes
 * - Synchronize external systems
 */

export const NexFarmDryingDecision = Object.freeze({
  DRYING_REQUIRED:
    "drying_required",

  READY_FOR_PACKAGING:
    "ready_for_packaging",

  RETEST_REQUIRED:
    "retest_required",

  ABNORMAL_LOSS_REVIEW:
    "abnormal_loss_review",
});

export function calculateDryingDurationMinutes({
  dryingStartedAt,
  dryingEndedAt,
} = {}) {

  if (!dryingStartedAt || !dryingEndedAt) {
    return null;
  }

  const startedAt =
    new Date(dryingStartedAt).getTime();

  const endedAt =
    new Date(dryingEndedAt).getTime();

  if (
    Number.isNaN(startedAt) ||
    Number.isNaN(endedAt) ||
    endedAt < startedAt
  ) {
    return null;
  }

  return Math.round(
    (endedAt - startedAt) / 60000,
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
} = {}) {

  const beforeWeight =
    Number(beforeDryingWeightKg);

  const afterWeight =
    Number(afterDryingWeightKg);

  const beforeMoisture =
    Number(moistureBefore);

  const afterMoisture =
    Number(moistureAfter);

  if (
    Number.isNaN(beforeWeight) ||
    beforeWeight <= 0
  ) {
    return Object.freeze({
      accepted: false,
      reason: "INVALID_BEFORE_DRYING_WEIGHT",
      analysis: null,
    });
  }

  if (
    Number.isNaN(afterWeight) ||
    afterWeight <= 0
  ) {
    return Object.freeze({
      accepted: false,
      reason: "INVALID_AFTER_DRYING_WEIGHT",
      analysis: null,
    });
  }

  if (afterWeight > beforeWeight) {
    return Object.freeze({
      accepted: false,
      reason: "AFTER_WEIGHT_EXCEEDS_BEFORE_WEIGHT",
      analysis: null,
    });
  }

  if (Number.isNaN(beforeMoisture)) {
    return Object.freeze({
      accepted: false,
      reason: "INVALID_MOISTURE_BEFORE",
      analysis: null,
    });
  }

  if (Number.isNaN(afterMoisture)) {
    return Object.freeze({
      accepted: false,
      reason: "INVALID_MOISTURE_AFTER",
      analysis: null,
    });
  }

  const weightLossKg =
    Number(
      (beforeWeight - afterWeight).toFixed(3),
    );

  const weightLossPercent =
    Number(
      (
        (weightLossKg / beforeWeight) *
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

  const dryingDurationMinutes =
    calculateDryingDurationMinutes({
      dryingStartedAt,
      dryingEndedAt,
    });

  const abnormalLoss =
    weightLossPercent < acceptableLossPercentMin ||
    weightLossPercent > acceptableLossPercentMax;

  let recommendedNextAction =
    NexFarmDryingDecision.READY_FOR_PACKAGING;

  if (abnormalLoss) {
    recommendedNextAction =
      NexFarmDryingDecision.ABNORMAL_LOSS_REVIEW;
  } else if (afterMoisture > targetMoisturePercent) {
    recommendedNextAction =
      NexFarmDryingDecision.DRYING_REQUIRED;
  } else if (dryingDurationMinutes === null) {
    recommendedNextAction =
      NexFarmDryingDecision.RETEST_REQUIRED;
  }

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
        dryingStartedAt ?? null,

      dryingEndedAt:
        dryingEndedAt ?? null,

      dryingDurationMinutes,

      weightLossKg,

      weightLossPercent,

      moistureDropPercent,

      acceptableLossRange:
        Object.freeze({
          minPercent:
            acceptableLossPercentMin,

          maxPercent:
            acceptableLossPercentMax,
        }),

      targetMoisturePercent,

      abnormalLoss,

      recommendedNextAction,
    }),
  });

}