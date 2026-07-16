/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: packaging-engine.js
 * Layer: NexFarm Packaging Engine
 * NEES: Business Module Execution Layer
 * Cycle: Cycle 4 — Inventory-Aware Packaging
 * ==========================================================
 *
 * Responsibility:
 * Calculate a rules-aware packaging plan for eligible
 * NexFarm grain using:
 *
 * - Approved packaging rules
 * - Available empty-bag stock
 * - Preliminary compatible rack capacity
 * - E-Zone remainder handling
 *
 * This engine produces a deterministic packaging plan only.
 *
 * It does not reserve or consume empty bags.
 * It does not assign exact rack positions.
 *
 * Future Integration:
 * - Bag-stock reservations will be executed through
 *   bag-stock events and projections.
 * - Final rack admission and exact physical placement will
 *   be executed by the Cycle 7 rack-admission workflow.
 * - NexVox AI L1 may observe packaging decisions, rejected
 *   combinations, shortages and capacity constraints.
 * - NexVox must never approve, reserve, consume, purchase,
 *   package or physically move inventory.
 *
 * Depends On:
 * - packaging-rules.js
 *
 * Used By:
 * - packaging-feasibility-engine.js
 * - nexfarm-service.js
 * - Temporary Cycle 4 integration tests
 *
 * Must Never:
 * - Create business events
 * - Execute Kernel logic
 * - Modify bag inventory
 * - Reserve empty bags
 * - Consume empty bags
 * - Modify E-Zone inventory
 * - Assign exact rack locations
 * - Create QR identities
 * - Approve payments
 * - Approve bag restocking
 */

import {
  DEFAULT_PACKAGING_RULES,
  PackagingConstraintCode,
  PackagingWarningCode,
  calculatePackagingPlanExpiry,
  getPackagingRulesVersion,
  getPreferredBagSizesKg,
  isSupportedBagSizeKg,
  isSupportedPackagingGrainType,
  validatePackagingRules,
} from "./packaging-rules.js";

/**
 * ==========================================================
 * Official NexFarm Bag Sizes
 * ==========================================================
 */

export const NexFarmBagSizeKg =
  Object.freeze({

    LARGE_90KG:
      90,

    MEDIUM_50KG:
      50,

    SMALL_25KG:
      25,

    MINI_10KG:
      10,

  });

/**
 * ==========================================================
 * Internal Utilities
 * ==========================================================
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

function roundQuantity(
  value,
  precision = 3,
) {

  const normalizedValue =
    Number(value);

  if (
    !Number.isFinite(
      normalizedValue,
    )
  ) {
    return 0;
  }

  return Number(
    normalizedValue.toFixed(
      precision,
    ),
  );

}

function normalizePositiveInteger(
  value,
) {

  const normalizedValue =
    Number(value);

  if (
    !Number.isFinite(
      normalizedValue,
    ) ||
    normalizedValue <= 0
  ) {
    return 0;
  }

  return Math.floor(
    normalizedValue,
  );

}

function normalizeNonNegativeInteger(
  value,
) {

  const normalizedValue =
    Number(value);

  if (
    !Number.isFinite(
      normalizedValue,
    ) ||
    normalizedValue < 0
  ) {
    return 0;
  }

  return Math.floor(
    normalizedValue,
  );

}

function normalizeText(
  value,
) {

  return String(
    value ??
    "",
  ).trim();

}

function normalizeGrainType(
  grainType,
) {

  const normalized =
    normalizeText(
      grainType,
    );

  if (!normalized) {
    return null;
  }

  return normalized;

}

function normalizeBagSizeList(
  bagSizes,
  rules,
) {

  const preferredBagSizes =
    getPreferredBagSizesKg(
      rules,
    );

  if (!Array.isArray(bagSizes)) {
    return preferredBagSizes;
  }

  const normalized =
    Array.from(
      new Set(
        bagSizes
          .map(
            (bagSizeKg) =>
              Number(
                bagSizeKg,
              ),
          )
          .filter(
            (bagSizeKg) =>
              Number.isFinite(
                bagSizeKg,
              ) &&
              bagSizeKg > 0 &&
              isSupportedBagSizeKg(
                bagSizeKg,
                rules,
              ),
          ),
      ),
    );

  if (normalized.length === 0) {
    return preferredBagSizes;
  }

  return normalized.sort(
    (firstSize, secondSize) => {

      const firstRank =
        preferredBagSizes.indexOf(
          firstSize,
        );

      const secondRank =
        preferredBagSizes.indexOf(
          secondSize,
        );

      const normalizedFirstRank =
        firstRank >= 0
          ? firstRank
          : Number.MAX_SAFE_INTEGER;

      const normalizedSecondRank =
        secondRank >= 0
          ? secondRank
          : Number.MAX_SAFE_INTEGER;

      return (
        normalizedFirstRank -
        normalizedSecondRank
      );

    },
  );

}

/**
 * Accept supported bag-stock snapshot forms:
 *
 * Array:
 * [
 *   {
 *     bagSizeKg: 90,
 *     availableQuantity: 4
 *   }
 * ]
 *
 * Object:
 * {
 *   90: {
 *     availableQuantity: 4
 *   }
 * }
 *
 * Compact object:
 * {
 *   90: 4
 * }
 */
function normalizeBagStockSnapshot(
  bagStockSnapshot,
) {

  const stockByBagSizeKg = {};

  if (
    Array.isArray(
      bagStockSnapshot,
    )
  ) {

    bagStockSnapshot.forEach(
      (entry) => {

        const bagSizeKg =
          Number(
            entry?.bagSizeKg,
          );

        if (
          !Number.isFinite(
            bagSizeKg,
          ) ||
          bagSizeKg <= 0
        ) {
          return;
        }

        stockByBagSizeKg[
          bagSizeKg
        ] = {
          bagSizeKg,

          availableQuantity:
            normalizeNonNegativeInteger(
              entry
                ?.availableQuantity,
            ),

          reservedQuantity:
            normalizeNonNegativeInteger(
              entry
                ?.reservedQuantity,
            ),

          damagedQuantity:
            normalizeNonNegativeInteger(
              entry
                ?.damagedQuantity,
            ),

          status:
            entry?.status ??
            "available",
        };

      },
    );

    return stockByBagSizeKg;

  }

  if (
    !bagStockSnapshot ||
    typeof bagStockSnapshot !==
      "object"
  ) {
    return stockByBagSizeKg;
  }

  Object.entries(
    bagStockSnapshot,
  ).forEach(
    ([
      rawBagSizeKg,
      rawEntry,
    ]) => {

      const bagSizeKg =
        Number(
          rawBagSizeKg,
        );

      if (
        !Number.isFinite(
          bagSizeKg,
        ) ||
        bagSizeKg <= 0
      ) {
        return;
      }

      if (
        Number.isFinite(
          Number(
            rawEntry,
          ),
        )
      ) {
        stockByBagSizeKg[
          bagSizeKg
        ] = {
          bagSizeKg,

          availableQuantity:
            normalizeNonNegativeInteger(
              rawEntry,
            ),

          reservedQuantity:
            0,

          damagedQuantity:
            0,

          status:
            "available",
        };

        return;
      }

      stockByBagSizeKg[
        bagSizeKg
      ] = {
        bagSizeKg,

        availableQuantity:
          normalizeNonNegativeInteger(
            rawEntry
              ?.availableQuantity,
          ),

        reservedQuantity:
          normalizeNonNegativeInteger(
            rawEntry
              ?.reservedQuantity,
          ),

        damagedQuantity:
          normalizeNonNegativeInteger(
            rawEntry
              ?.damagedQuantity,
          ),

        status:
          rawEntry?.status ??
          "available",
      };

    },
  );

  return stockByBagSizeKg;

}

/**
 * Accept supported rack-capacity snapshot forms:
 *
 * {
 *   capacityByBagSizeKg: {
 *     90: 4,
 *     50: 8
 *   }
 * }
 *
 * {
 *   90: {
 *     availablePositionCount: 4
 *   }
 * }
 *
 * [
 *   {
 *     bagSizeKg: 90,
 *     availablePositionCount: 4
 *   }
 * ]
 */
function normalizeRackCapacitySnapshot(
  rackCapacitySnapshot,
) {

  const capacityByBagSizeKg = {};

  if (
    Array.isArray(
      rackCapacitySnapshot,
    )
  ) {

    rackCapacitySnapshot.forEach(
      (entry) => {

        const bagSizeKg =
          Number(
            entry?.bagSizeKg,
          );

        if (
          !Number.isFinite(
            bagSizeKg,
          ) ||
          bagSizeKg <= 0
        ) {
          return;
        }

        capacityByBagSizeKg[
          bagSizeKg
        ] = {
          bagSizeKg,

          availablePositionCount:
            normalizeNonNegativeInteger(
              entry
                ?.availablePositionCount ??
              entry
                ?.availableQuantity ??
              entry
                ?.availableSlots,
            ),

          compatible:
            entry?.compatible !==
            false,

          status:
            entry?.status ??
            "active",

          rackSectionId:
            entry
              ?.rackSectionId ??
            null,

          grainType:
            entry
              ?.grainType ??
            null,
        };

      },
    );

    return capacityByBagSizeKg;

  }

  if (
    !rackCapacitySnapshot ||
    typeof rackCapacitySnapshot !==
      "object"
  ) {
    return capacityByBagSizeKg;
  }

  const rawCapacity =
    rackCapacitySnapshot
      ?.capacityByBagSizeKg ??
    rackCapacitySnapshot;

  Object.entries(
    rawCapacity,
  ).forEach(
    ([
      rawBagSizeKg,
      rawEntry,
    ]) => {

      const bagSizeKg =
        Number(
          rawBagSizeKg,
        );

      if (
        !Number.isFinite(
          bagSizeKg,
        ) ||
        bagSizeKg <= 0
      ) {
        return;
      }

      if (
        Number.isFinite(
          Number(
            rawEntry,
          ),
        )
      ) {
        capacityByBagSizeKg[
          bagSizeKg
        ] = {
          bagSizeKg,

          availablePositionCount:
            normalizeNonNegativeInteger(
              rawEntry,
            ),

          compatible:
            true,

          status:
            "active",

          rackSectionId:
            null,

          grainType:
            rackCapacitySnapshot
              ?.grainType ??
            null,
        };

        return;
      }

      capacityByBagSizeKg[
        bagSizeKg
      ] = {
        bagSizeKg,

        availablePositionCount:
          normalizeNonNegativeInteger(
            rawEntry
              ?.availablePositionCount ??
            rawEntry
              ?.availableQuantity ??
            rawEntry
              ?.availableSlots,
          ),

        compatible:
          rawEntry?.compatible !==
          false,

        status:
          rawEntry?.status ??
          "active",

        rackSectionId:
          rawEntry
            ?.rackSectionId ??
          null,

        grainType:
          rawEntry
            ?.grainType ??
          rackCapacitySnapshot
            ?.grainType ??
          null,
      };

    },
  );

  return capacityByBagSizeKg;

}

function createRejectedResult({
  reason,
  weightKg,
  grainType,
  sourceType,
  sourceReferences,
  rulesVersion,
  blockingConstraints = [],
  warnings = [],
  decisionTrace = {},
} = {}) {

  return deepFreeze({
    accepted: false,

    reason,

    weightKg,

    grainType,

    sourceType,

    sourceReferences,

    suggestedBags: [],

    bagStockRequirements: [],

    rackCapacityRequirements: [],

    totalPackagedKg: 0,

    eZoneKg:
      roundQuantity(
        weightKg,
      ),

    blockingConstraints,

    warnings,

    rulesVersion,

    decisionTrace,
  });

}

/**
 * ==========================================================
 * Packaging Suggestion
 * ==========================================================
 */

export function suggestPackaging({
  weightKg = 0,
  grainType = null,
  sourceType = "intake",
  sourceReferences = [],
  bagSizes = null,
  bagStockSnapshot = null,
  rackCapacitySnapshot = null,
  eZoneSectionAvailable = true,
  rules = DEFAULT_PACKAGING_RULES,
  createdAt = new Date().toISOString(),
} = {}) {

  const normalizedWeight =
    Number(
      weightKg,
    );

  const normalizedGrainType =
    normalizeGrainType(
      grainType,
    );

  const rulesValidation =
    validatePackagingRules(
      rules,
    );

  const rulesVersion =
    getPackagingRulesVersion(
      rules,
    );

  if (
    rulesValidation.accepted !==
    true
  ) {
    return createRejectedResult({
      reason:
        "INVALID_PACKAGING_RULES",

      weightKg,

      grainType:
        normalizedGrainType,

      sourceType,

      sourceReferences,

      rulesVersion,

      blockingConstraints: [
        {
          code:
            "INVALID_PACKAGING_RULES",

          details:
            rulesValidation.errors,
        },
      ],

      decisionTrace: {
        rulesValidation,
      },
    });
  }

  if (
    !Number.isFinite(
      normalizedWeight,
    ) ||
    normalizedWeight <= 0
  ) {
    return createRejectedResult({
      reason:
        PackagingConstraintCode
          .INVALID_GRAIN_QUANTITY,

      weightKg,

      grainType:
        normalizedGrainType,

      sourceType,

      sourceReferences,

      rulesVersion,

      blockingConstraints: [
        {
          code:
            PackagingConstraintCode
              .INVALID_GRAIN_QUANTITY,

          value:
            weightKg,
        },
      ],
    });
  }

  if (!normalizedGrainType) {
    return createRejectedResult({
      reason:
        PackagingConstraintCode
          .GRAIN_TYPE_REQUIRED,

      weightKg:
        normalizedWeight,

      grainType:
        null,

      sourceType,

      sourceReferences,

      rulesVersion,

      blockingConstraints: [
        {
          code:
            PackagingConstraintCode
              .GRAIN_TYPE_REQUIRED,
        },
      ],
    });
  }

  if (
    !isSupportedPackagingGrainType(
      normalizedGrainType,
      rules,
    )
  ) {
    return createRejectedResult({
      reason:
        PackagingConstraintCode
          .GRAIN_TYPE_UNSUPPORTED,

      weightKg:
        normalizedWeight,

      grainType:
        normalizedGrainType,

      sourceType,

      sourceReferences,

      rulesVersion,

      blockingConstraints: [
        {
          code:
            PackagingConstraintCode
              .GRAIN_TYPE_UNSUPPORTED,

          grainType:
            normalizedGrainType,
        },
      ],
    });
  }

  if (
    !bagStockSnapshot ||
    typeof bagStockSnapshot !==
      "object"
  ) {
    return createRejectedResult({
      reason:
        PackagingConstraintCode
          .BAG_STOCK_SNAPSHOT_REQUIRED,

      weightKg:
        normalizedWeight,

      grainType:
        normalizedGrainType,

      sourceType,

      sourceReferences,

      rulesVersion,

      blockingConstraints: [
        {
          code:
            PackagingConstraintCode
              .BAG_STOCK_SNAPSHOT_REQUIRED,
        },
      ],
    });
  }

  if (
    !rackCapacitySnapshot ||
    typeof rackCapacitySnapshot !==
      "object"
  ) {
    return createRejectedResult({
      reason:
        PackagingConstraintCode
          .RACK_CAPACITY_SNAPSHOT_REQUIRED,

      weightKg:
        normalizedWeight,

      grainType:
        normalizedGrainType,

      sourceType,

      sourceReferences,

      rulesVersion,

      blockingConstraints: [
        {
          code:
            PackagingConstraintCode
              .RACK_CAPACITY_SNAPSHOT_REQUIRED,
        },
      ],
    });
  }

  const normalizedBagSizes =
    normalizeBagSizeList(
      bagSizes,
      rules,
    );

  const normalizedBagStock =
    normalizeBagStockSnapshot(
      bagStockSnapshot,
    );

  const normalizedRackCapacity =
    normalizeRackCapacitySnapshot(
      rackCapacitySnapshot,
    );

  const consideredBagCombinations =
    [];

  const rejectedBagCombinations =
    [];

  const warnings =
    [];

  const blockingConstraints =
    [];

  const suggestedBags =
    [];

  const bagStockRequirements =
    [];

  const rackCapacityRequirements =
    [];

  let remainingKg =
    normalizedWeight;

  normalizedBagSizes.forEach(
    (bagSizeKg) => {

      const stockEntry =
        normalizedBagStock[
          bagSizeKg
        ];

      const rackEntry =
        normalizedRackCapacity[
          bagSizeKg
        ];

      const mathematicallyPossibleQuantity =
        Math.floor(
          remainingKg /
          bagSizeKg,
        );

      const availableBagQuantity =
        stockEntry
          ?.status ===
        "damaged"
          ? 0
          : normalizeNonNegativeInteger(
              stockEntry
                ?.availableQuantity,
            );

      const availableRackQuantity =
        (
          rackEntry
            ?.compatible ===
          false
        )
          ? 0
          : normalizeNonNegativeInteger(
              rackEntry
                ?.availablePositionCount,
            );

      const feasibleQuantity =
        Math.min(
          mathematicallyPossibleQuantity,
          availableBagQuantity,
          availableRackQuantity,
        );

      const decision = {
        bagSizeKg,

        remainingKgBeforeDecision:
          roundQuantity(
            remainingKg,
          ),

        mathematicallyPossibleQuantity,

        availableBagQuantity,

        availableRackQuantity,

        feasibleQuantity,

        selected:
          feasibleQuantity > 0,

        rejectionReasons: [],
      };

      if (
        mathematicallyPossibleQuantity >
        0 &&
        availableBagQuantity === 0
      ) {
        decision.rejectionReasons.push(
          PackagingConstraintCode
            .EMPTY_BAG_STOCK_UNAVAILABLE,
        );

        warnings.push({
          code:
            PackagingWarningCode
              .PREFERRED_BAG_SIZE_UNAVAILABLE,

          bagSizeKg,

          reason:
            PackagingConstraintCode
              .EMPTY_BAG_STOCK_UNAVAILABLE,
        });
      }

      if (
        mathematicallyPossibleQuantity >
        0 &&
        availableRackQuantity === 0
      ) {
        decision.rejectionReasons.push(
          PackagingConstraintCode
            .SAFE_RACK_LEVEL_UNAVAILABLE,
        );

        warnings.push({
          code:
            PackagingWarningCode
              .RACK_CONSTRAINT_CHANGED_PLAN,

          bagSizeKg,

          reason:
            PackagingConstraintCode
              .SAFE_RACK_LEVEL_UNAVAILABLE,
        });
      }

      if (
        mathematicallyPossibleQuantity >
        availableBagQuantity &&
        availableBagQuantity > 0
      ) {
        decision.rejectionReasons.push(
          PackagingConstraintCode
            .EMPTY_BAG_STOCK_INSUFFICIENT,
        );

        warnings.push({
          code:
            PackagingWarningCode
              .BAG_STOCK_CONSTRAINT_CHANGED_PLAN,

          bagSizeKg,

          requestedQuantity:
            mathematicallyPossibleQuantity,

          availableQuantity:
            availableBagQuantity,
        });
      }

      if (
        mathematicallyPossibleQuantity >
        availableRackQuantity &&
        availableRackQuantity > 0
      ) {
        decision.rejectionReasons.push(
          PackagingConstraintCode
            .RACK_CAPACITY_INSUFFICIENT,
        );

        warnings.push({
          code:
            PackagingWarningCode
              .RACK_CONSTRAINT_CHANGED_PLAN,

          bagSizeKg,

          requestedQuantity:
            mathematicallyPossibleQuantity,

          availablePositionCount:
            availableRackQuantity,
        });
      }

      consideredBagCombinations.push(
        decision,
      );

       if (
        decision.rejectionReasons
          .length > 0
      ) {
        rejectedBagCombinations.push({
          bagSizeKg,

          mathematicallyPossibleQuantity,

          availableBagQuantity,

          availableRackQuantity,

          rejectionReasons:
            [
              ...decision
                .rejectionReasons,
            ],
        });
      }
      if (feasibleQuantity <= 0) {
        return;
      }

      const totalKg =
        roundQuantity(
          feasibleQuantity *
          bagSizeKg,
        );

      suggestedBags.push({
        bagSizeKg,

        quantity:
          feasibleQuantity,

        totalKg,
      });

      bagStockRequirements.push({
        bagSizeKg,

        requiredQuantity:
          feasibleQuantity,

        availableQuantityBeforePlan:
          availableBagQuantity,

        availableQuantityAfterReservation:
          availableBagQuantity -
          feasibleQuantity,
      });

      rackCapacityRequirements.push({
        bagSizeKg,

        requiredPositionCount:
          feasibleQuantity,

        availablePositionCountBeforePlan:
          availableRackQuantity,

        availablePositionCountAfterPlan:
          availableRackQuantity -
          feasibleQuantity,

        rackSectionId:
          rackEntry
            ?.rackSectionId ??
          null,
      });

      remainingKg =
        roundQuantity(
          remainingKg -
          totalKg,
        );

    },
  );

  const totalPackagedKg =
    roundQuantity(
      suggestedBags.reduce(
        (total, bag) =>
          total +
          bag.totalKg,
        0,
      ),
    );

  const eZoneKg =
    roundQuantity(
      remainingKg,
    );

  if (
    totalPackagedKg <= 0
  ) {
    blockingConstraints.push({
      code:
        PackagingConstraintCode
          .NO_FEASIBLE_PACKAGING_PLAN,

      requestedWeightKg:
        normalizedWeight,
    });
  }

  if (
    eZoneKg > 0 &&
    eZoneSectionAvailable !==
    true
  ) {
    blockingConstraints.push({
      code:
        PackagingConstraintCode
          .EZONE_SECTION_REQUIRED,

      eZoneKg,
    });
  }

  if (
    eZoneKg > 0
  ) {
    warnings.push({
      code:
        PackagingWarningCode
          .EZONE_REMAINDER_CREATED,

      eZoneKg,
    });
  }

  if (
    eZoneKg > 0 &&
    totalPackagedKg > 0
  ) {
    warnings.push({
      code:
        PackagingWarningCode
          .PARTIAL_PACKAGING,

      totalPackagedKg,

      eZoneKg,
    });
  }

  const reconciledQuantity =
    roundQuantity(
      totalPackagedKg +
      eZoneKg,
    );

  const reconciliationDifferenceKg =
    roundQuantity(
      normalizedWeight -
      reconciledQuantity,
    );

  const reconciliationToleranceKg =
    Number(
      rules
        ?.reconciliation
        ?.defaultToleranceKg ??
      0,
    );

  if (
    Math.abs(
      reconciliationDifferenceKg,
    ) >
    reconciliationToleranceKg
  ) {
    blockingConstraints.push({
      code:
        PackagingConstraintCode
          .QUANTITY_RECONCILIATION_FAILED,

      inputQuantityKg:
        normalizedWeight,

      reconciledQuantityKg:
        reconciledQuantity,

      differenceKg:
        reconciliationDifferenceKg,

      toleranceKg:
        reconciliationToleranceKg,
    });
  }

  const expiryResult =
    calculatePackagingPlanExpiry({
      createdAt,
      rules,
    });

  if (
    expiryResult.accepted !==
    true
  ) {
    blockingConstraints.push({
      code:
        "INVALID_PACKAGING_PLAN_EXPIRY",

      expiryResult,
    });
  }

  const accepted =
    blockingConstraints.length === 0 &&
    totalPackagedKg > 0;

  const decisionTrace = {
    requestedQuantityKg:
      normalizedWeight,

    grainType:
      normalizedGrainType,

    sourceType,

    sourceReferences:
      Array.isArray(
        sourceReferences,
      )
        ? [
            ...sourceReferences,
          ]
        : [],

    rulesVersion,

    bagSizesConsidered:
      normalizedBagSizes,

    bagStockSnapshot:
      normalizedBagStock,

    rackCapacitySnapshot:
      normalizedRackCapacity,

    consideredBagCombinations,

    rejectedBagCombinations,

    selectedBagCombination:
      suggestedBags,

    packagedQuantityKg:
      totalPackagedKg,

    eZoneRemainderKg:
      eZoneKg,

    reconciliationDifferenceKg,

    warnings,

    blockingConstraints,

    createdAt:
      expiryResult
        ?.createdAt ??
      createdAt,

    expiresAt:
      expiryResult
        ?.expiresAt ??
      null,
  };

  if (!accepted) {
    return createRejectedResult({
      reason:
        blockingConstraints[0]
          ?.code ??
        PackagingConstraintCode
          .NO_FEASIBLE_PACKAGING_PLAN,

      weightKg:
        normalizedWeight,

      grainType:
        normalizedGrainType,

      sourceType,

      sourceReferences,

      rulesVersion,

      blockingConstraints,

      warnings,

      decisionTrace,
    });
  }

  return deepFreeze({
    accepted: true,

    reason:
      null,

    planStatus:
      "feasible",

    weightKg:
      normalizedWeight,

    grainType:
      normalizedGrainType,

    sourceType,

    sourceReferences:
      Array.isArray(
        sourceReferences,
      )
        ? [
            ...sourceReferences,
          ]
        : [],

    suggestedBags,

    bagStockRequirements,

    rackCapacityRequirements,

    totalPackagedKg,

    eZoneKg,

    partialPackaging:
      eZoneKg > 0,

    warnings,

    blockingConstraints: [],

    rulesVersion,

    createdAt:
      expiryResult.createdAt,

    expiresAt:
      expiryResult.expiresAt,

    decisionTrace,
  });

}