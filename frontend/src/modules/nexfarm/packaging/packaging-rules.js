/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: packaging-rules.js
 * Layer: NexFarm Packaging
 * NEES: Business Module Execution Layer / Configuration Data
 * Cycle: Cycle 4 — Inventory-Aware Packaging
 * ==========================================================
 *
 * Responsibility:
 * Define the default, versioned and configurable rules used
 * by NexFarm packaging, bag-stock feasibility and preliminary
 * rack-capacity feasibility engines.
 *
 * This file defines policy only.
 *
 * It does not:
 * - Create business events
 * - Read or modify bag-stock projections
 * - Reserve or consume empty bags
 * - Modify E-Zone quantities
 * - Assign exact rack locations
 * - Approve packaging overrides
 * - Approve purchases or restocking
 * - Complete NexFarm inventory
 *
 * Future Integration:
 * - Administration may later provide approved, versioned
 *   packaging-rule configuration.
 * - Finance may later approve capital expenditure related
 *   to bag restocking, but Finance does not modify these rules.
 * - NexVox AI L1 may observe rule outcomes, constraints and
 *   decision traces, but must never modify production rules.
 * - Rack admission in Cycle 7 will consume compatible outputs
 *   from these rules without moving bags automatically.
 *
 * Used By:
 * - packaging-engine.js
 * - packaging-feasibility-engine.js
 * - bag-stock-engine.js
 * - rack-capacity-engine.js
 * - Temporary Cycle 4 integration tests
 *
 * Must Never:
 * - Execute Kernel logic
 * - Publish events
 * - Mutate inventory
 * - Contain secrets or external API credentials
 * - Mix simulation and production configuration
 */

/**
 * ==========================================================
 * Internal Utilities
 * ==========================================================
 */

/**
 * Recursively freeze a plain configuration structure.
 *
 * This prevents an engine from accidentally mutating the
 * active policy while calculating a packaging plan.
 */
function deepFreeze(value) {

  if (
    value === null ||
    typeof value !== "object" ||
    Object.isFrozen(value)
  ) {
    return value;
  }

  Object.freeze(value);

  Object.values(value).forEach(
    (childValue) => {
      deepFreeze(childValue);
    },
  );

  return value;

}

/**
 * Create a safe plain-object copy.
 *
 * Packaging rules contain only JSON-compatible values.
 */
function cloneValue(value) {

  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(
    JSON.stringify(value),
  );

}

/**
 * Determine whether a value is a finite positive number.
 */
function isPositiveNumber(value) {

  return (
    Number.isFinite(
      Number(value),
    ) &&
    Number(value) > 0
  );

}

/**
 * Determine whether a value is a finite non-negative number.
 */
function isNonNegativeNumber(value) {

  return (
    Number.isFinite(
      Number(value),
    ) &&
    Number(value) >= 0
  );

}

/**
 * Return a normalized unique array of positive bag sizes.
 */
function normalizeBagSizes(
  values = [],
) {

  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map(
          (value) =>
            Number(value),
        )
        .filter(
          (value) =>
            Number.isFinite(value) &&
            value > 0,
        ),
    ),
  );

}

/**
 * Return a normalized unique string array.
 */
function normalizeStringList(
  values = [],
) {

  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map(
          (value) =>
            String(value ?? "")
              .trim(),
        )
        .filter(Boolean),
    ),
  );

}

/**
 * Merge two rule objects while preserving nested sections.
 *
 * This is intentionally limited to configuration merging.
 * It is not a general business-state merge.
 */
function mergeRules(
  baseRules,
  overrides,
) {

  if (
    overrides === null ||
    typeof overrides !== "object" ||
    Array.isArray(overrides)
  ) {
    return cloneValue(baseRules);
  }

  const result =
    cloneValue(baseRules);

  Object.entries(
    overrides,
  ).forEach(
    ([
      key,
      overrideValue,
    ]) => {

      const baseValue =
        result[key];

      if (
        overrideValue &&
        typeof overrideValue === "object" &&
        !Array.isArray(overrideValue) &&
        baseValue &&
        typeof baseValue === "object" &&
        !Array.isArray(baseValue)
      ) {
        result[key] =
          mergeRules(
            baseValue,
            overrideValue,
          );

        return;
      }

      result[key] =
        cloneValue(
          overrideValue,
        );

    },
  );

  return result;

}

/**
 * ==========================================================
 * Packaging Rule Identity
 * ==========================================================
 */

export const PACKAGING_RULES_SCHEMA_VERSION =
  "1.0.0";

export const DEFAULT_PACKAGING_RULES_VERSION =
  "NEXFARM-PACKAGING-RULES-ALPHA-1";

/**
 * ==========================================================
 * Supported Source Types
 * ==========================================================
 */

export const PackagingSourceType =
  deepFreeze({

    /**
     * Grain entering packaging directly from an
     * eligible intake flow.
     */
    INTAKE:
      "intake",

    /**
     * Grain approved after internal drying and
     * custody assessment.
     */
    DRYING_RETURN:
      "drying_return",

    /**
     * Grain formally released from an E-Zone section.
     */
    EZONE_RELEASE:
      "ezone_release",

    /**
     * Eligible grain assembled from multiple traceable
     * sources of the same grain type.
     */
    COMBINED_PACKAGING_ORDER:
      "combined_packaging_order",

  });

/**
 * ==========================================================
 * Packaging Plan Statuses
 * ==========================================================
 */

export const PackagingPlanStatus =
  deepFreeze({

    DRAFT:
      "draft",

    FEASIBILITY_PENDING:
      "feasibility_pending",

    FEASIBLE:
      "feasible",

    RESERVED:
      "reserved",

    IN_PROGRESS:
      "in_progress",

    COMPLETED:
      "completed",

    RELEASED:
      "released",

    EXPIRED:
      "expired",

    REJECTED:
      "rejected",

    CANCELLED:
      "cancelled",

  });

/**
 * ==========================================================
 * Packaging Constraint Codes
 * ==========================================================
 *
 * These stable codes are intended for:
 * - Engine results
 * - Audit records
 * - Dashboard explanations
 * - NexVox L1 observation
 * - Future reporting
 */

export const PackagingConstraintCode =
  deepFreeze({

    /**
     * Grain eligibility constraints.
     */
    GRAIN_TYPE_REQUIRED:
      "GRAIN_TYPE_REQUIRED",

    GRAIN_TYPE_UNSUPPORTED:
      "GRAIN_TYPE_UNSUPPORTED",

    INVALID_GRAIN_QUANTITY:
      "INVALID_GRAIN_QUANTITY",

    GRAIN_NOT_PACKAGING_ELIGIBLE:
      "GRAIN_NOT_PACKAGING_ELIGIBLE",

    MOISTURE_UNSAFE:
      "MOISTURE_UNSAFE",

    RETURNED_WEIGHT_REQUIRED:
      "RETURNED_WEIGHT_REQUIRED",

    DRYING_ASSESSMENT_REQUIRED:
      "DRYING_ASSESSMENT_REQUIRED",

    RETURN_TO_DRYING_REQUIRED:
      "RETURN_TO_DRYING_REQUIRED",

    LOSS_REVIEW_PENDING:
      "LOSS_REVIEW_PENDING",

    INTERNAL_GRAIN_LOSS_RECORDED:
      "INTERNAL_GRAIN_LOSS_RECORDED",

    GRAIN_CONDITION_UNSAFE:
      "GRAIN_CONDITION_UNSAFE",

    SOURCE_SCOPE_MISMATCH:
      "SOURCE_SCOPE_MISMATCH",

    RUNTIME_MODE_MISMATCH:
      "RUNTIME_MODE_MISMATCH",

    /**
     * Bag-stock constraints.
     */
    BAG_SIZE_UNSUPPORTED:
      "BAG_SIZE_UNSUPPORTED",

    EMPTY_BAG_STOCK_UNAVAILABLE:
      "EMPTY_BAG_STOCK_UNAVAILABLE",

    EMPTY_BAG_STOCK_INSUFFICIENT:
      "EMPTY_BAG_STOCK_INSUFFICIENT",

    BAG_STOCK_NEGATIVE_BLOCKED:
      "BAG_STOCK_NEGATIVE_BLOCKED",

    BAG_STOCK_RESERVATION_REQUIRED:
      "BAG_STOCK_RESERVATION_REQUIRED",

    BAG_STOCK_RESERVATION_INSUFFICIENT:
      "BAG_STOCK_RESERVATION_INSUFFICIENT",

    BAG_STOCK_DAMAGED:
      "BAG_STOCK_DAMAGED",

    BAG_STOCK_SNAPSHOT_REQUIRED:
      "BAG_STOCK_SNAPSHOT_REQUIRED",

    /**
     * E-Zone constraints.
     */
    EZONE_SECTION_REQUIRED:
      "EZONE_SECTION_REQUIRED",

    EZONE_SECTION_DISABLED:
      "EZONE_SECTION_DISABLED",

    EZONE_GRAIN_TYPE_MISMATCH:
      "EZONE_GRAIN_TYPE_MISMATCH",

    EZONE_CAPACITY_EXCEEDED:
      "EZONE_CAPACITY_EXCEEDED",

    EZONE_QUANTITY_INSUFFICIENT:
      "EZONE_QUANTITY_INSUFFICIENT",

    EZONE_RELEASE_REQUIRED:
      "EZONE_RELEASE_REQUIRED",

    EZONE_MOISTURE_UNSAFE:
      "EZONE_MOISTURE_UNSAFE",

    /**
     * Rack-capacity constraints.
     */
    RACK_CAPACITY_SNAPSHOT_REQUIRED:
      "RACK_CAPACITY_SNAPSHOT_REQUIRED",

    COMPATIBLE_RACK_SECTION_REQUIRED:
      "COMPATIBLE_RACK_SECTION_REQUIRED",

    RACK_SECTION_DISABLED:
      "RACK_SECTION_DISABLED",

    RACK_SECTION_FULL:
      "RACK_SECTION_FULL",

    RACK_SECTION_MAINTENANCE:
      "RACK_SECTION_MAINTENANCE",

    RACK_SECTION_GRAIN_TYPE_MISMATCH:
      "RACK_SECTION_GRAIN_TYPE_MISMATCH",

    RACK_CAPACITY_INSUFFICIENT:
      "RACK_CAPACITY_INSUFFICIENT",

    SAFE_RACK_LEVEL_UNAVAILABLE:
      "SAFE_RACK_LEVEL_UNAVAILABLE",

    HEAVY_BAG_LOWER_LEVEL_REQUIRED:
      "HEAVY_BAG_LOWER_LEVEL_REQUIRED",

    /**
     * Planning and reconciliation constraints.
     */
    NO_FEASIBLE_PACKAGING_PLAN:
      "NO_FEASIBLE_PACKAGING_PLAN",

    PARTIAL_PACKAGING_REQUIRED:
      "PARTIAL_PACKAGING_REQUIRED",

    PACKAGING_PLAN_EXPIRED:
      "PACKAGING_PLAN_EXPIRED",

    PACKAGING_PLAN_STALE:
      "PACKAGING_PLAN_STALE",

    QUANTITY_RECONCILIATION_FAILED:
      "QUANTITY_RECONCILIATION_FAILED",

    UNACCOUNTED_QUANTITY_DETECTED:
      "UNACCOUNTED_QUANTITY_DETECTED",

    OVERRIDE_NOT_PERMITTED:
      "OVERRIDE_NOT_PERMITTED",

  });

/**
 * ==========================================================
 * Packaging Warning Codes
 * ==========================================================
 */

export const PackagingWarningCode =
  deepFreeze({

    PARTIAL_PACKAGING:
      "PARTIAL_PACKAGING",

    EZONE_REMAINDER_CREATED:
      "EZONE_REMAINDER_CREATED",

    LOW_EMPTY_BAG_STOCK:
      "LOW_EMPTY_BAG_STOCK",

    NEAR_RACK_CAPACITY:
      "NEAR_RACK_CAPACITY",

    ALTERNATIVE_BAG_COMBINATION_USED:
      "ALTERNATIVE_BAG_COMBINATION_USED",

    PREFERRED_BAG_SIZE_UNAVAILABLE:
      "PREFERRED_BAG_SIZE_UNAVAILABLE",

    RACK_CONSTRAINT_CHANGED_PLAN:
      "RACK_CONSTRAINT_CHANGED_PLAN",

    BAG_STOCK_CONSTRAINT_CHANGED_PLAN:
      "BAG_STOCK_CONSTRAINT_CHANGED_PLAN",

    PACKAGING_PLAN_REQUIRES_REVIEW:
      "PACKAGING_PLAN_REQUIRES_REVIEW",

    PROVISIONAL_QUANTITY_VARIANCE:
      "PROVISIONAL_QUANTITY_VARIANCE",

  });

/**
 * ==========================================================
 * Packaging Source Eligibility Status
 * ==========================================================
 */

export const PackagingEligibilityStatus =
  deepFreeze({

    ELIGIBLE:
      "eligible",

    BLOCKED:
      "blocked",

    REVIEW_REQUIRED:
      "review_required",

    UNKNOWN:
      "unknown",

  });

/**
 * ==========================================================
 * Default Packaging Rules
 * ==========================================================
 */

const DEFAULT_RULES = {

  /**
   * ------------------------------------------
   * Rule metadata
   * ------------------------------------------
   */

  metadata: {
    schemaVersion:
      PACKAGING_RULES_SCHEMA_VERSION,

    rulesVersion:
      DEFAULT_PACKAGING_RULES_VERSION,

    status:
      "active",

    runtimeModeScope:
      "all",

    businessUnitId:
      "NEXFARM",

    description:
      "NexFarm Alpha Cycle 4 inventory-aware packaging defaults.",

    createdFor:
      "NexaPOS Alpha 1.0",

    futureAdministrationManaged:
      true,

    nexVoxObservationAllowed:
      true,

    nexVoxModificationAllowed:
      false,
  },

  /**
   * ------------------------------------------
   * Supported grains
   * ------------------------------------------
   *
   * Alpha actively tests Maize and Beans.
   * The configuration remains extensible so
   * Administration can later activate more grains.
   */

  grains: {
    supportedGrainTypes: [
      "Maize",
      "Beans",
    ],

    caseSensitive:
      false,

    allowUnconfiguredGrainType:
      false,

    requireSingleGrainTypePerPlan:
      true,

    preventCrossGrainCombination:
      true,

    preventCrossGrainEZoneUse:
      true,

    preventCrossGrainRackUse:
      true,
  },

  /**
   * ------------------------------------------
   * Official NexFarm bag sizes
   * ------------------------------------------
   */

  bagSizes: {
    allowedBagSizesKg: [
      90,
      50,
      25,
      10,
    ],

    preferredOrderKg: [
      90,
      50,
      25,
      10,
    ],

    allowUnsupportedBagSize:
      false,

    preferLargestFeasibleBagFirst:
      true,

    requireIntegerBagQuantity:
      true,

    minimumBagQuantity:
      1,

    requireExactBagSizeMatch:
      true,
  },

  /**
   * ------------------------------------------
   * Grain eligibility
   * ------------------------------------------
   */

  eligibility: {
    allowedSourceTypes: [
      PackagingSourceType.INTAKE,
      PackagingSourceType.DRYING_RETURN,
      PackagingSourceType.EZONE_RELEASE,
      PackagingSourceType
        .COMBINED_PACKAGING_ORDER,
    ],

    requirePositiveQuantity:
      true,

    requireGrainType:
      true,

    requireEstateScope:
      true,

    requireBusinessUnitScope:
      true,

    requireRuntimeModeScope:
      true,

    requireSafeMoisture:
      true,

    defaultMaximumStorageMoisturePercent:
      14,

    requireReturnedWeightAfterDrying:
      true,

    requireDryingAssessmentAfterDrying:
      true,

    allowPackagingWhenReturnToDrying:
      false,

    allowPackagingWhenLossReviewPending:
      false,

    allowPackagingAfterInternalLoss:
      false,

    allowUnsafeGrainCondition:
      false,

    safeAssessmentDecisions: [
      "ready_for_storage_preparation",
    ],

    unsafeGrainConditions: [
      "rain_damaged",
      "mouldy",
      "mould_or_rot",
      "contaminated",
      "pest_damaged",
      "spoiled",
      "rotten",
      "unsafe",
    ],
  },

  /**
   * ------------------------------------------
   * Partial packaging
   * ------------------------------------------
   */

  partialPackaging: {
    allowed:
      true,

    requireExplicitReason:
      true,

    preserveUnpackagedQuantity:
      true,

    directUnaccountedDiscardAllowed:
      false,

    allowedReasons: [
      "EMPTY_BAG_STOCK_LIMIT",
      "RACK_CAPACITY_LIMIT",
      "EZONE_REMAINDER",
      "OPERATIONAL_HOLD",
      "PACKAGING_RULE_CONSTRAINT",
    ],
  },

  /**
   * ------------------------------------------
   * E-Zone remainder handling
   * ------------------------------------------
   */

  eZone: {
    remainderAllowed:
      true,

    requireCompatibleSection:
      true,

    requireActiveSection:
      true,

    requireSameEstate:
      true,

    requireSameRuntimeMode:
      true,

    requireSameGrainType:
      true,

    requireCapacity:
      true,

    requireSafeMoisture:
      true,

    allowSectionStatuses: [
      "active",
      "available",
      "packaging_ready",
    ],

    blockedSectionStatuses: [
      "disabled",
      "maintenance",
      "cleaning",
      "inspection_required",
      "full",
      "archived",
    ],

    minimumRemainderKg:
      0,

    maximumRemainderKg:
      null,

    allowCombinedSameGrainSources:
      true,

    requireSourceTraceability:
      true,

    requireFormalReleaseForPackaging:
      true,

    quantityWeightedMoistureRequired:
      true,
  },

  /**
   * ------------------------------------------
   * Empty bag-stock controls
   * ------------------------------------------
   */

  bagStock: {
    inventorySnapshotRequired:
      true,

    allowNegativeStock:
      false,

    excludeZeroStockBagSizes:
      true,

    excludeDamagedBags:
      true,

    reservationRequiredBeforeBagCreation:
      true,

    consumptionRequiredAfterBagCreation:
      true,

    releaseReservationOnFailure:
      true,

    requireMatchingBagSizeReservation:
      true,

    requireMatchingReservedQuantity:
      true,

    allowPartialReservation:
      false,

    allowOverReservation:
      false,

    minimumAvailableQuantity:
      1,

    lowStockThresholdsByBagSizeKg: {
      90: 5,
      50: 5,
      25: 10,
      10: 10,
    },

    reorderLevelsByBagSizeKg: {
      90: 10,
      50: 10,
      25: 20,
      10: 20,
    },

    recognizedMovementTypes: [
      "opening",
      "received",
      "reserved",
      "consumed",
      "released",
      "damaged",
      "adjusted",
      "counted",
    ],
  },

  /**
   * ------------------------------------------
   * Rack-capacity feasibility
   * ------------------------------------------
   *
   * Cycle 4 checks whether a packaging plan can
   * be stored safely in principle.
   *
   * Exact physical rack admission and location
   * assignment remain Cycle 7 responsibilities.
   */

  rackCapacity: {
    feasibilitySnapshotRequired:
      true,

    requireCompatibleGrainSection:
      true,

    requireActiveRack:
      true,

    requireActiveSection:
      true,

    requireSameEstate:
      true,

    requireSameRuntimeMode:
      true,

    requireAvailablePosition:
      true,

    requireBagSizeCompatiblePosition:
      true,

    requireWeightCapacity:
      true,

    allowPackagingWithoutRackCapacity:
      false,

    allowPartialPackagingToCapacity:
      true,

    excludeRackStatuses: [
      "disabled",
      "maintenance",
      "cleaning",
      "inspection_required",
      "full",
      "archived",
    ],

    nearCapacityThresholdPercent:
      80,

    fullCapacityThresholdPercent:
      100,

    initialBagLevelPreferences: {
      90: {
        allowedLevels: [
          1,
        ],

        placementPriority:
          "lowest_first",

        heavyBag:
          true,
      },

      50: {
        allowedLevels: [
          1,
          2,
        ],

        placementPriority:
          "lowest_first",

        heavyBag:
          true,
      },

      25: {
        allowedLevels: [
          2,
          3,
        ],

        placementPriority:
          "ascending",

        heavyBag:
          false,
      },

      10: {
        allowedLevels: [
          3,
        ],

        placementPriority:
          "upper_first",

        heavyBag:
          false,
      },
    },
  },

  /**
   * ------------------------------------------
   * Quantity conservation
   * ------------------------------------------
   */

  reconciliation: {
    requireQuantityConservation:
      true,

    allowUnaccountedQuantity:
      false,

    allowProvisionalVariance:
      true,

    requireVarianceReason:
      true,

    defaultToleranceKg:
      0.01,

    formula:
      "inputQuantityKg = packagedQuantityKg + eZoneRemainderKg + approvedVarianceKg",
  },

  /**
   * ------------------------------------------
   * Packaging plan lifecycle
   * ------------------------------------------
   */

  plan: {
    expiryEnabled:
      true,

    defaultExpiryMinutes:
      30,

    expireWhenBagStockChanges:
      true,

    expireWhenRackCapacityChanges:
      true,

    expireWhenGrainQuantityChanges:
      true,

    expireWhenSafetyStatusChanges:
      true,

    expireWhenEZoneQuantityChanges:
      true,

    preserveSupersededPlans:
      true,

    silentOverwriteAllowed:
      false,

    requireDecisionTrace:
      true,

    requireRulesVersion:
      true,

    requireCreatedAt:
      true,

    requireExpiresAt:
      true,
  },

/**
   * ------------------------------------------
   * Override policy
   * ------------------------------------------
   */

  overrides: {
    enabled:
      false,

    requireAuthorizedAdmin:
      true,

    requireReason:
      true,

    requireApprovalReference:
      true,

    preserveOriginalDecision:
      true,

    permanentlyNonOverridableRules: [
      "NEGATIVE_BAG_STOCK",
      "DAMAGED_BAG_USE",
      "UNSAFE_GRAIN_PACKAGING",
      "CROSS_GRAIN_MIXING",
      "CROSS_ESTATE_USE",
      "CROSS_RUNTIME_MODE_USE",
      "HEAVY_BAG_UNSAFE_LEVEL",
      "UNACCOUNTED_QUANTITY",
    ],
  },

  /**
   * ------------------------------------------
   * Context and audit
   * ------------------------------------------
   */

  context: {
    requireIdentityId:
      true,

    requireActorType:
      true,

    requireDeviceId:
      true,

    requireEstateId:
      true,

    requireBusinessUnitId:
      true,

    requireRuntimeMode:
      true,

    requireTimestamp:
      true,

    requireSourceReference:
      true,
  },

  /**
   * ------------------------------------------
   * NexVox observation data
   * ------------------------------------------
   */

  nexVox: {
    observationEnabled:
      true,

    advisoryOnly:
      true,

    allowProductionMutation:
      false,

    allowReservation:
      false,

    allowStockConsumption:
      false,

    allowStockAdjustment:
      false,

    allowRestockApproval:
      false,

    allowPurchaseExecution:
      false,

    allowRackRuleModification:
      false,

    allowPackagingOverride:
      false,

    preserveDecisionInputs: [
      "requestedQuantityKg",
      "grainType",
      "sourceType",
      "sourceReferences",
      "bagStockSnapshot",
      "rackCapacitySnapshot",
      "rulesVersion",
      "consideredBagCombinations",
      "rejectedBagCombinations",
      "rejectionReasons",
      "selectedBagCombination",
      "packagedQuantityKg",
      "eZoneRemainderKg",
      "warnings",
      "actor",
      "device",
      "estate",
      "runtimeMode",
      "createdAt",
    ],
  },

};

export const DEFAULT_PACKAGING_RULES =
  deepFreeze(
    DEFAULT_RULES,
  );

/**
 * ==========================================================
 * Rule Creation
 * ==========================================================
 */

/**
 * Create one immutable packaging-rule configuration.
 *
 * Overrides are intended for approved configuration or
 * simulation scenarios. Passing overrides does not itself
 * authorize or publish a configuration change.
 */
export function createPackagingRules({
  overrides = {},
  rulesVersion = null,
} = {}) {

  const mergedRules =
    mergeRules(
      DEFAULT_PACKAGING_RULES,
      overrides,
    );

  if (
    typeof rulesVersion === "string" &&
    rulesVersion.trim()
  ) {
    mergedRules.metadata.rulesVersion =
      rulesVersion.trim();
  }

  const normalizedBagSizes =
    normalizeBagSizes(
      mergedRules
        ?.bagSizes
        ?.allowedBagSizesKg,
    );

  const normalizedPreferenceOrder =
    normalizeBagSizes(
      mergedRules
        ?.bagSizes
        ?.preferredOrderKg,
    )
      .filter(
        (bagSizeKg) =>
          normalizedBagSizes.includes(
            bagSizeKg,
          ),
      );

  mergedRules.bagSizes.allowedBagSizesKg =
    normalizedBagSizes;

  mergedRules.bagSizes.preferredOrderKg =
    normalizedPreferenceOrder;

  mergedRules.grains.supportedGrainTypes =
    normalizeStringList(
      mergedRules
        ?.grains
        ?.supportedGrainTypes,
    );

  mergedRules.eligibility.allowedSourceTypes =
    normalizeStringList(
      mergedRules
        ?.eligibility
        ?.allowedSourceTypes,
    );

  return deepFreeze(
    mergedRules,
  );

}

/**
 * ==========================================================
 * Rule Validation
 * ==========================================================
 */

/**
 * Validate one packaging-rule configuration.
 *
 * This validates rule structure only. It does not validate
 * grain, stock, rack or packaging operations.
 */
export function validatePackagingRules(
  rules = DEFAULT_PACKAGING_RULES,
) {

  const errors = [];
  const warnings = [];

  if (
    !rules ||
    typeof rules !== "object" ||
    Array.isArray(rules)
  ) {
    return {
      accepted: false,

      valid: false,

      errors: [
        {
          code:
            "PACKAGING_RULES_REQUIRED",

          field:
            "rules",

          message:
            "Packaging rules must be a configuration object.",
        },
      ],

      warnings,
    };
  }

  const rulesVersion =
    rules
      ?.metadata
      ?.rulesVersion;

  if (
    typeof rulesVersion !== "string" ||
    !rulesVersion.trim()
  ) {
    errors.push({
      code:
        "PACKAGING_RULES_VERSION_REQUIRED",

      field:
        "metadata.rulesVersion",

      message:
        "A packaging rules version is required.",
    });
  }

  const allowedBagSizes =
    normalizeBagSizes(
      rules
        ?.bagSizes
        ?.allowedBagSizesKg,
    );

  if (
    allowedBagSizes.length === 0
  ) {
    errors.push({
      code:
        "PACKAGING_BAG_SIZES_REQUIRED",

      field:
        "bagSizes.allowedBagSizesKg",

      message:
        "At least one valid bag size is required.",
    });
  }

  const preferredOrder =
    normalizeBagSizes(
      rules
        ?.bagSizes
        ?.preferredOrderKg,
    );

  const unsupportedPreferredSizes =
    preferredOrder.filter(
      (bagSizeKg) =>
        !allowedBagSizes.includes(
          bagSizeKg,
        ),
    );

  if (
    unsupportedPreferredSizes.length > 0
  ) {
    errors.push({
      code:
        "PACKAGING_PREFERENCE_SIZE_UNSUPPORTED",

      field:
        "bagSizes.preferredOrderKg",

      message:
        "Every preferred bag size must also be an allowed bag size.",

      unsupportedBagSizesKg:
        unsupportedPreferredSizes,
    });
  }

  const supportedGrains =
    normalizeStringList(
      rules
        ?.grains
        ?.supportedGrainTypes,
    );

  if (
    supportedGrains.length === 0
  ) {
    errors.push({
      code:
        "PACKAGING_GRAIN_TYPES_REQUIRED",

      field:
        "grains.supportedGrainTypes",

      message:
        "At least one supported grain type is required.",
    });
  }

  const maximumMoisture =
    rules
      ?.eligibility
      ?.defaultMaximumStorageMoisturePercent;

  if (
    !isPositiveNumber(
      maximumMoisture,
    )
  ) {
    errors.push({
      code:
        "PACKAGING_MAXIMUM_MOISTURE_INVALID",

      field:
        "eligibility.defaultMaximumStorageMoisturePercent",

      message:
        "Maximum storage moisture must be a positive number.",
    });
  }

  const toleranceKg =
    rules
      ?.reconciliation
      ?.defaultToleranceKg;

  if (
    !isNonNegativeNumber(
      toleranceKg,
    )
  ) {
    errors.push({
      code:
        "PACKAGING_TOLERANCE_INVALID",

      field:
        "reconciliation.defaultToleranceKg",

      message:
        "Quantity tolerance must be a non-negative number.",
    });
  }

  const expiryMinutes =
    rules
      ?.plan
      ?.defaultExpiryMinutes;

  if (
    rules
      ?.plan
      ?.expiryEnabled === true &&
    !isPositiveNumber(
      expiryMinutes,
    )
  ) {
    errors.push({
      code:
        "PACKAGING_PLAN_EXPIRY_INVALID",

      field:
        "plan.defaultExpiryMinutes",

      message:
        "Plan expiry must be a positive number of minutes.",
    });
  }

  const nearCapacityThreshold =
    Number(
      rules
        ?.rackCapacity
        ?.nearCapacityThresholdPercent,
    );

  const fullCapacityThreshold =
    Number(
      rules
        ?.rackCapacity
        ?.fullCapacityThresholdPercent,
    );

  if (
    !Number.isFinite(
      nearCapacityThreshold,
    ) ||
    nearCapacityThreshold < 0 ||
    nearCapacityThreshold > 100
  ) {
    errors.push({
      code:
        "RACK_NEAR_CAPACITY_THRESHOLD_INVALID",

      field:
        "rackCapacity.nearCapacityThresholdPercent",

      message:
        "Near-capacity threshold must be between 0 and 100.",
    });
  }

  if (
    !Number.isFinite(
      fullCapacityThreshold,
    ) ||
    fullCapacityThreshold <= 0 ||
    fullCapacityThreshold > 100
  ) {
    errors.push({
      code:
        "RACK_FULL_CAPACITY_THRESHOLD_INVALID",

      field:
        "rackCapacity.fullCapacityThresholdPercent",

      message:
        "Full-capacity threshold must be greater than 0 and no more than 100.",
    });
  }

  if (
    Number.isFinite(
      nearCapacityThreshold,
    ) &&
    Number.isFinite(
      fullCapacityThreshold,
    ) &&
    nearCapacityThreshold >
      fullCapacityThreshold
  ) {
    errors.push({
      code:
        "RACK_CAPACITY_THRESHOLDS_OUT_OF_ORDER",

      field:
        "rackCapacity",

      message:
        "Near-capacity threshold cannot exceed the full-capacity threshold.",
    });
  }

  const levelPreferences =
    rules
      ?.rackCapacity
      ?.initialBagLevelPreferences ??
    {};

  allowedBagSizes.forEach(
    (bagSizeKg) => {

      const preference =
        levelPreferences[
          bagSizeKg
        ];

      if (!preference) {
        warnings.push({
          code:
            "RACK_LEVEL_PREFERENCE_MISSING",

          field:
            `rackCapacity.initialBagLevelPreferences.${bagSizeKg}`,

          message:
            `No preliminary rack-level preference exists for ${bagSizeKg} kg bags.`,
        });

        return;
      }

      if (
        !Array.isArray(
          preference.allowedLevels,
        ) ||
        preference.allowedLevels.length === 0
      ) {
        errors.push({
          code:
            "RACK_ALLOWED_LEVELS_REQUIRED",

          field:
            `rackCapacity.initialBagLevelPreferences.${bagSizeKg}.allowedLevels`,

          message:
            `At least one allowed rack level is required for ${bagSizeKg} kg bags.`,
        });
      }

    },
  );

  const valid =
    errors.length === 0;

  return {
    accepted:
      valid,

    valid,

    rulesVersion:
      rulesVersion ??
      null,

    errors,

    warnings,

    summary: {
      supportedGrainTypes:
        supportedGrains,

      allowedBagSizesKg:
        allowedBagSizes,

      preferredOrderKg:
        preferredOrder,

      partialPackagingAllowed:
        rules
          ?.partialPackaging
          ?.allowed === true,

      bagReservationRequired:
        rules
          ?.bagStock
          ?.reservationRequiredBeforeBagCreation ===
        true,

      rackFeasibilityRequired:
        rules
          ?.rackCapacity
          ?.feasibilitySnapshotRequired ===
        true,

      nexVoxAdvisoryOnly:
        rules
          ?.nexVox
          ?.advisoryOnly ===
        true,
    },
  };

}

/**
 * ==========================================================
 * Rule Access Helpers
 * ==========================================================
 */

/**
 * Return the active rule version.
 */
export function getPackagingRulesVersion(
  rules = DEFAULT_PACKAGING_RULES,
) {

  return (
    rules
      ?.metadata
      ?.rulesVersion ??
    null
  );

}

/**
 * Return official allowed bag sizes.
 */
export function getAllowedBagSizesKg(
  rules = DEFAULT_PACKAGING_RULES,
) {

  return [
    ...normalizeBagSizes(
      rules
        ?.bagSizes
        ?.allowedBagSizesKg,
    ),
  ];

}

/**
 * Return bag sizes in packaging preference order.
 */
export function getPreferredBagSizesKg(
  rules = DEFAULT_PACKAGING_RULES,
) {

  const allowedBagSizes =
    getAllowedBagSizesKg(
      rules,
    );

  const preferredBagSizes =
    normalizeBagSizes(
      rules
        ?.bagSizes
        ?.preferredOrderKg,
    )
      .filter(
        (bagSizeKg) =>
          allowedBagSizes.includes(
            bagSizeKg,
          ),
      );

  const unlistedBagSizes =
    allowedBagSizes.filter(
      (bagSizeKg) =>
        !preferredBagSizes.includes(
          bagSizeKg,
        ),
    );

  return [
    ...preferredBagSizes,
    ...unlistedBagSizes,
  ];

}

/**
 * Determine whether a bag size is officially supported.
 */
export function isSupportedBagSizeKg(
  bagSizeKg,
  rules = DEFAULT_PACKAGING_RULES,
) {

  const normalizedBagSize =
    Number(
      bagSizeKg,
    );

  return getAllowedBagSizesKg(
    rules,
  ).includes(
    normalizedBagSize,
  );

}

/**
 * Return the preference rank for one bag size.
 *
 * Zero is the highest preference.
 * Null means the bag size is unsupported.
 */
export function getBagSizePreferenceRank(
  bagSizeKg,
  rules = DEFAULT_PACKAGING_RULES,
) {

  const normalizedBagSize =
    Number(
      bagSizeKg,
    );

  const preferredSizes =
    getPreferredBagSizesKg(
      rules,
    );

  const index =
    preferredSizes.indexOf(
      normalizedBagSize,
    );

  return (
    index >= 0
      ? index
      : null
  );

}

/**
 * Return supported grain types.
 */
export function getSupportedPackagingGrainTypes(
  rules = DEFAULT_PACKAGING_RULES,
) {

  return [
    ...normalizeStringList(
      rules
        ?.grains
        ?.supportedGrainTypes,
    ),
  ];

}

/**
 * Determine whether a grain type is supported.
 */
export function isSupportedPackagingGrainType(
  grainType,
  rules = DEFAULT_PACKAGING_RULES,
) {

  const candidate =
    String(
      grainType ??
      "",
    ).trim();

  if (!candidate) {
    return false;
  }

  const supportedGrains =
    getSupportedPackagingGrainTypes(
      rules,
    );

  const caseSensitive =
    rules
      ?.grains
      ?.caseSensitive ===
    true;

  if (caseSensitive) {
    return supportedGrains.includes(
      candidate,
    );
  }

  const normalizedCandidate =
    candidate.toLowerCase();

  return supportedGrains.some(
    (supportedGrain) =>
      supportedGrain.toLowerCase() ===
      normalizedCandidate,
  );

}

/**
 * Return the low-stock threshold for one bag size.
 */
export function getBagLowStockThreshold(
  bagSizeKg,
  rules = DEFAULT_PACKAGING_RULES,
) {

  const normalizedBagSize =
    Number(
      bagSizeKg,
    );

  const value =
    rules
      ?.bagStock
      ?.lowStockThresholdsByBagSizeKg
      ?.[normalizedBagSize];

  return (
    isNonNegativeNumber(value)
      ? Number(value)
      : 0
  );

}

/**
 * Return the reorder level for one bag size.
 */
export function getBagReorderLevel(
  bagSizeKg,
  rules = DEFAULT_PACKAGING_RULES,
) {

  const normalizedBagSize =
    Number(
      bagSizeKg,
    );

  const value =
    rules
      ?.bagStock
      ?.reorderLevelsByBagSizeKg
      ?.[normalizedBagSize];

  return (
    isNonNegativeNumber(value)
      ? Number(value)
      : 0
  );

}

/**
 * Return preliminary allowed rack levels for a bag size.
 *
 * Final rack-admission enforcement belongs to Cycle 7.
 */
export function getPreliminaryAllowedRackLevels(
  bagSizeKg,
  rules = DEFAULT_PACKAGING_RULES,
) {

  const normalizedBagSize =
    Number(
      bagSizeKg,
    );

  const levels =
    rules
      ?.rackCapacity
      ?.initialBagLevelPreferences
      ?.[normalizedBagSize]
      ?.allowedLevels;

  if (!Array.isArray(levels)) {
    return [];
  }

  return Array.from(
    new Set(
      levels
        .map(
          (level) =>
            Number(level),
        )
        .filter(
          (level) =>
            Number.isInteger(level) &&
            level > 0,
        ),
    ),
  );
}

/**
 * Determine whether one rack level is preliminarily
 * allowed for a bag size.
 */
export function isPreliminaryRackLevelAllowed({
  bagSizeKg,
  rackLevel,
  rules = DEFAULT_PACKAGING_RULES,
} = {}) {

  const normalizedLevel =
    Number(
      rackLevel,
    );

  return getPreliminaryAllowedRackLevels(
    bagSizeKg,
    rules,
  ).includes(
    normalizedLevel,
  );

}

/**
 * Calculate packaging-plan expiry.
 */
export function calculatePackagingPlanExpiry({
  createdAt =
    new Date().toISOString(),

  rules =
    DEFAULT_PACKAGING_RULES,
} = {}) {

  const expiryEnabled =
    rules
      ?.plan
      ?.expiryEnabled ===
    true;

  if (!expiryEnabled) {
    return {
      accepted: true,

      expiryEnabled:
        false,

      createdAt,

      expiresAt:
        null,

      expiryMinutes:
        null,
    };
  }

  const createdTimestamp =
    Date.parse(
      createdAt,
    );

  const expiryMinutes =
    Number(
      rules
        ?.plan
        ?.defaultExpiryMinutes,
    );

  if (
    !Number.isFinite(
      createdTimestamp,
    ) ||
    !isPositiveNumber(
      expiryMinutes,
    )
  ) {
    return {
      accepted: false,

      expiryEnabled:
        true,

      createdAt,

      expiresAt:
        null,

      expiryMinutes:
        null,

      reason:
        "INVALID_PACKAGING_PLAN_EXPIRY_INPUT",
    };
  }

  const expiresAt =
    new Date(
      createdTimestamp +
      expiryMinutes *
      60 *
      1000,
    ).toISOString();

  return {
    accepted: true,

    expiryEnabled:
      true,

    createdAt:
      new Date(
        createdTimestamp,
      ).toISOString(),

    expiresAt,

    expiryMinutes,
  };
}

/**
 * ==========================================================
 * Default Rule Validation
 * ==========================================================
 */

/**
 * Export the validation result for the bundled defaults.
 *
 * This makes startup and temporary tests able to confirm
 * that the source configuration is internally consistent.
 */
export const DEFAULT_PACKAGING_RULES_VALIDATION =
  deepFreeze(
    validatePackagingRules(
      DEFAULT_PACKAGING_RULES,
    ),
  );