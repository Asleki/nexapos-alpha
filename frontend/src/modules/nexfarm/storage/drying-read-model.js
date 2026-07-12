/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: drying-read-model.js
 * Layer: NexFarm Storage Read Model
 * NEES: Business Module Read Model Layer
 * ==========================================================
 *
 * Responsibility:
 * Define the initial derived read-model structure used
 * to track NexFarm grain batches and drying cycles while
 * they are under internal quality, custody, safety, and
 * loss-control operations.
 *
 * This read model is derived entirely from immutable
 * NexFarm events.
 *
 * It provides operational visibility into:
 * - Batches currently assigned to solar drying
 * - Individual drying cycles
 * - Entry and return measurements
 * - Time spent in the drying zone
 * - Moisture and weight changes
 * - Internal assessment decisions
 * - Packaging and rack-admission controls
 * - Loss-review and internal-loss states
 * - Runtime, estate, device, and actor scope
 *
 * Future Use:
 * - NexFarm drying operations dashboard
 * - Storage admission controls
 * - Manager loss-review dashboard
 * - NexVox AI L1 observational analytics
 * - Drying-duration and moisture trend analysis
 * - Custody and abnormal-loss monitoring
 *
 * NexVox AI may observe this read model but must never:
 * - Approve a drying assessment
 * - Authorize packaging
 * - Authorize rack assignment
 * - Confirm internal loss
 * - Modify source events
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - drying-projection.js
 * - read-model-engine.js
 * - Future NexFarm UI
 * - Future NexVox AI L1 observer
 *
 * Must Never:
 * - Create business events
 * - Modify source events
 * - Execute Kernel logic
 * - Perform drying analysis
 * - Approve operational decisions
 * - Process supplier pricing or payments
 * - Assign grain to packaging
 * - Assign grain to racks
 * - Synchronize external systems
 */

/**
 * Stable name used when publishing the drying
 * custody model into application read-model state.
 */
export const NEXFARM_DRYING_CUSTODY_READ_MODEL =
  "NEXFARM_DRYING_CUSTODY";

/**
 * Derived operational states for one drying cycle.
 *
 * These values describe custody visibility only.
 * They do not independently approve or execute
 * any operational action.
 */
export const NexFarmDryingCustodyStatus =
  Object.freeze({

    /**
     * The grain has been assigned to a drying zone
     * and has not yet been recorded as returned.
     */
    ACTIVE_IN_DRYING:
      "active_in_drying",

    /**
     * The grain has returned from the drying zone,
     * but one or more return measurements are missing.
     */
    RETURN_MEASUREMENTS_PENDING:
      "return_measurements_pending",

    /**
     * Returned moisture and weight are available,
     * but the internal assessment is pending.
     */
    ASSESSMENT_PENDING:
      "assessment_pending",

    /**
     * Internal assessment confirmed that the batch
     * may continue to storage preparation.
     */
    READY_FOR_STORAGE_PREPARATION:
      "ready_for_storage_preparation",

    /**
     * The batch must enter another drying cycle.
     */
    RETURN_TO_DRYING:
      "return_to_drying",

    /**
     * Abnormal weight loss or another custody issue
     * requires authorized internal review.
     */
    LOSS_REVIEW_REQUIRED:
      "loss_review_required",

    /**
     * A review has started but has not yet produced
     * a final operational result.
     */
    LOSS_REVIEW_PENDING:
      "loss_review_pending",

    /**
     * The batch has been permanently recorded as
     * an internal NexFarm grain loss.
     */
    INTERNAL_GRAIN_LOSS:
      "internal_grain_loss",

    /**
     * The drying cycle has ended and the batch has
     * proceeded beyond drying custody.
     */
    DRYING_COMPLETED:
      "drying_completed",

  });

/**
 * Create the initial NexFarm drying custody read model.
 *
 * The model separates:
 *
 * batches
 *   The current accumulated drying state for each intake.
 *
 * cycles
 *   The immutable-event-derived history of each distinct
 *   drying cycle performed for a batch.
 *
 * Index arrays
 *   Fast operational groupings for dashboards, controls,
 *   alerts, and future observational analytics.
 */
export function createInitialNexFarmDryingReadModel() {

  return {

    /**
     * Read-model identity and schema metadata.
     */
    readModelName:
      NEXFARM_DRYING_CUSTODY_READ_MODEL,

    schemaVersion:
      "1.0.0",

    /**
     * Current drying custody state indexed by intake ID.
     *
     * Shape:
     *
     * batchesByIntakeId[intakeId] = {
     *   intakeId,
     *   grainType,
     *   currentDryingCycleId,
     *   currentDryingCycleNumber,
     *   dryingCycleIds,
     *   currentStatus,
     *   packagingAllowed,
     *   rackAssignmentAllowed,
     *   reviewRequired,
     *   closedAsLoss,
     *   estateId,
     *   businessUnitId,
     *   runtimeMode,
     *   createdAt,
     *   lastUpdatedAt
     * }
     */
    batchesByIntakeId: {},

    /**
     * Drying-cycle history indexed by drying cycle ID.
     *
     * Shape:
     *
     * cyclesById[dryingCycleId] = {
     *   dryingCycleId,
     *   intakeId,
     *   dryingCycleNumber,
     *   grainType,
     *   dryingZoneId,
     *
     *   weightAtEntryKg,
     *   moistureAtEntryPercent,
     *   enteredAt,
     *   expectedReviewAt,
     *
     *   returnedAt,
     *   weightAtReturnKg,
     *   moistureAtReturnPercent,
     *
     *   durationMinutes,
     *   weightLossKg,
     *   weightLossPercent,
     *   moistureDropPercent,
     *
     *   conditionStatus,
     *   conditionNotes,
     *   assessmentDecision,
     *   evidenceReference,
     *
     *   abnormalLoss,
     *   reviewRequired,
     *   packagingAllowed,
     *   rackAssignmentAllowed,
     *   closedAsLoss,
     *
     *   actorIdentityId,
     *   actorType,
     *   deviceId,
     *   estateId,
     *   businessUnitId,
     *   runtimeMode,
     *
     *   status,
     *   createdAt,
     *   lastUpdatedAt
     * }
     */
    cyclesById: {},

    /**
     * Ordered IDs of all drying cycles known to the
     * read model.
     */
    dryingCycleIds: [],

    /**
     * Intake IDs that have participated in at least
     * one drying cycle.
     */
    dryingBatchIds: [],

    /**
     * Cycles whose grain is physically recorded as
     * being inside a drying zone.
     */
    activeDryingCycleIds: [],

    /**
     * Cycles that have returned but still lack either
     * returned moisture or returned weight.
     */
    returnMeasurementsPendingCycleIds: [],

    /**
     * Cycles with complete return measurements that
     * are awaiting an internal drying assessment.
     */
    assessmentPendingCycleIds: [],

    /**
     * Batches approved by the recorded internal
     * assessment for storage preparation.
     */
    readyForStoragePreparationIntakeIds: [],

    /**
     * Batches whose latest assessment requires another
     * drying cycle.
     */
    returnToDryingIntakeIds: [],

    /**
     * Batches blocked pending authorized loss review.
     */
    lossReviewIntakeIds: [],

    /**
     * Batches permanently closed as internal grain loss.
     */
    internalGrainLossIntakeIds: [],

    /**
     * Cycles that have completed drying custody and
     * proceeded to the next internal process.
     */
    completedDryingCycleIds: [],

    /**
     * Aggregate operational counts.
     */
    totals: {

      totalBatches:
        0,

      totalDryingCycles:
        0,

      activeDryingCycles:
        0,

      returnMeasurementsPending:
        0,

      assessmentsPending:
        0,

      readyForStoragePreparation:
        0,

      returnToDrying:
        0,

      lossReviewsRequired:
        0,

      internalGrainLosses:
        0,

      completedDryingCycles:
        0,

    },

    /**
     * Aggregate weights derived from drying events.
     *
     * These values are operational quantities and are
     * not financial valuations.
     */
    weights: {

      totalWeightEnteredKg:
        0,

      totalWeightReturnedKg:
        0,

      totalRecordedWeightLossKg:
        0,

      activeDryingWeightKg:
        0,

      internalGrainLossWeightKg:
        0,

    },

    /**
     * Derived moisture observations for future dashboards
     * and NexVox AI L1 analysis.
     *
     * The projection will calculate these values from
     * recorded events. This file defines only their shape.
     */
    moisture: {

      totalEntryMoistureObservations:
        0,

      totalReturnMoistureObservations:
        0,

      averageEntryMoisturePercent:
        null,

      averageReturnMoisturePercent:
        null,

      averageMoistureDropPercent:
        null,

    },

    /**
     * Derived duration observations.
     */
    duration: {

      completedDurationObservations:
        0,

      totalCompletedDurationMinutes:
        0,

      averageDryingDurationMinutes:
        null,

      longestDryingDurationMinutes:
        null,

      shortestDryingDurationMinutes:
        null,

    },

    /**
     * Read-model update metadata.
     */
    lastProcessedEventId:
      null,

    lastProcessedEventType:
      null,

    lastUpdatedAt:
      null,

  };

}