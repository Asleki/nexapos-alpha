/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: bag-stock-engine.js
 * Layer: NexFarm Packaging / Empty-Bag Stock
 * NEES: Business Module Execution Layer
 * Cycle: Cycle 4 — Inventory-Aware Packaging
 * ==========================================================
 *
 * Responsibility:
 * Perform deterministic calculations for NexFarm empty-bag
 * inventory without creating events or mutating stored state.
 *
 * This engine calculates:
 * - Normalized empty-bag stock snapshots
 * - Available, reserved, consumed and damaged quantities
 * - Packaging-plan stock feasibility
 * - Reservation feasibility
 * - Consumption feasibility
 * - Reservation-release feasibility
 * - Damage-recording feasibility
 * - Physical-count and adjustment differences
 * - Low-stock and reorder states
 * - Proposed post-movement stock balances
 * - NexVox AI L1 observational decision traces
 *
 * Empty bags are physical NexFarm inventory assets.
 *
 * Correct operational sequence:
 *
 * PACKAGING_SUGGESTED
 * ↓
 * Bag-stock feasibility checked
 * ↓
 * BAG_STOCK_RESERVED
 * ↓
 * BAG_CREATED
 * ↓
 * BAG_STOCK_CONSUMED
 *
 * Failure sequence:
 *
 * BAG_STOCK_RESERVED
 * ↓
 * Bag creation fails or packaging is cancelled
 * ↓
 * BAG_STOCK_RELEASED
 *
 * Damaged bags must never silently disappear:
 *
 * Damage detected
 * ↓
 * BAG_STOCK_DAMAGED
 * ↓
 * Usable stock reduced
 * ↓
 * Damage remains visible in history and analytics
 *
 * Future Integration:
 * - nexfarm-service.js will convert accepted calculations
 *   into immutable NexFarm events.
 * - bag-stock-projection.js will derive authoritative
 *   empty-bag balances by replaying those events.
 * - Finance may later approve bag-restock expenditure.
 * - Approved restocking may later use simulated supplier,
 *   Nexa Prime Bank, Nexa Bank, NexaFinance Bank or
 *   NexaGroup Bank adapter contracts.
 * - NexVox AI L1 may observe low stock, damage rates,
 *   consumption trends and projected shortages.
 * - NexVox AI must never reserve, consume, adjust, purchase,
 *   receive or approve empty-bag inventory.
 *
 * Depends On:
 * - packaging-rules.js
 *
 * Used By:
 * - packaging-feasibility-engine.js
 * - nexfarm-service.js
 * - bag-stock-projection.js validation helpers
 * - Temporary Cycle 4 integration tests
 *
 * Must Never:
 * - Create business events
 * - Execute Kernel logic
 * - Update projections
 * - Store inventory
 * - Mutate input snapshots
 * - Approve restocking
 * - Execute purchases
 * - Assign racks
 * - Modify grain inventory
 * - Mix production and simulation stock
 */

import {
  DEFAULT_PACKAGING_RULES,
  PackagingConstraintCode,
  PackagingWarningCode,
  getAllowedBagSizesKg,
  getBagLowStockThreshold,
  getBagReorderLevel,
  getPackagingRulesVersion,
  isSupportedBagSizeKg,
  validatePackagingRules,
} from "./packaging-rules.js";

/**
 * ==========================================================
 * Bag-Stock Movement Types
 * ==========================================================
 */

export const BagStockMovementType =
  Object.freeze({

    OPENING:
      "opening",

    RECEIVED:
      "received",

    RESERVED:
      "reserved",

    CONSUMED:
      "consumed",

    RELEASED:
      "released",

    DAMAGED:
      "damaged",

    ADJUSTED:
      "adjusted",

    COUNTED:
      "counted",

  });

/**
 * ==========================================================
 * Bag-Stock Statuses
 * ==========================================================
 */

export const BagStockStatus =
  Object.freeze({

    UNINITIALIZED:
      "uninitialized",

    AVAILABLE:
      "available",

    LOW:
      "low",

    REORDER_REQUIRED:
      "reorder_required",

    OUT_OF_STOCK:
      "out_of_stock",

    RESERVED_ONLY:
      "reserved_only",

    DISABLED:
      "disabled",

    BLOCKED:
      "blocked",

  });

/**
 * ==========================================================
 * Reservation Statuses
 * ==========================================================
 */

export const BagStockReservationStatus =
  Object.freeze({

    PROPOSED:
      "proposed",

    ACTIVE:
      "active",

    PARTIALLY_CONSUMED:
      "partially_consumed",

    CONSUMED:
      "consumed",

    RELEASED:
      "released",

    EXPIRED:
      "expired",

    CANCELLED:
      "cancelled",

  });

/**
 * ==========================================================
 * Damage Reasons
 * ==========================================================
 */

export const BagStockDamageReason =
  Object.freeze({

    TORN:
      "torn",

    WET:
      "wet",

    CONTAMINATED:
      "contaminated",

    PRINTING_FAILED:
      "printing_failed",

    CLOSURE_FAILED:
      "closure_failed",

    STITCHING_FAILED:
      "stitching_failed",

    HANDLING_DAMAGE:
      "handling_damage",

    STORAGE_DAMAGE:
      "storage_damage",

    PEST_DAMAGE:
      "pest_damage",

    MANUFACTURING_DEFECT:
      "manufacturing_defect",

    OTHER:
      "other",

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

function cloneValue(value) {

  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(
    JSON.stringify(value),
  );

}

function normalizeText(value) {

  const normalized =
    String(
      value ??
      "",
    ).trim();

  return normalized || null;

}

function normalizeTimestamp(
  value,
  fallback =
    new Date().toISOString(),
) {

  const candidate =
    value ??
    fallback;

  const timestamp =
    Date.parse(
      candidate,
    );

  if (
    !Number.isFinite(
      timestamp,
    )
  ) {
    return null;
  }

  return new Date(
    timestamp,
  ).toISOString();

}

function normalizeInteger(
  value,
  {
    minimum = 0,
    allowNull = false,
  } = {},
) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return allowNull
      ? null
      : minimum;
  }

  const normalized =
    Number(value);

  if (
    !Number.isFinite(
      normalized,
    )
  ) {
    return allowNull
      ? null
      : minimum;
  }

  return Math.max(
    minimum,
    Math.floor(
      normalized,
    ),
  );

}

function normalizeSignedInteger(
  value,
) {

  const normalized =
    Number(value);

  if (
    !Number.isFinite(
      normalized,
    )
  ) {
    return null;
  }

  return Math.trunc(
    normalized,
  );

}

function createError({
  code,
  field = null,
  message,
  details = null,
} = {}) {

  return {
    code,
    field,
    message,
    details,
  };

}

function createWarning({
  code,
  field = null,
  message,
  details = null,
} = {}) {

  return {
    code,
    field,
    message,
    details,
  };

}

function resolveBagStockStatus({
  availableQuantity,
  reservedQuantity,
  lowStockThreshold,
  reorderLevel,
  enabled = true,
} = {}) {

  if (enabled !== true) {
    return BagStockStatus.DISABLED;
  }

  if (availableQuantity <= 0) {

    if (
      reservedQuantity > 0
    ) {
      return BagStockStatus
        .RESERVED_ONLY;
    }

    return BagStockStatus
      .OUT_OF_STOCK;
  }

  if (
    availableQuantity <=
    lowStockThreshold
  ) {
    return BagStockStatus.LOW;
  }

  if (
    availableQuantity <=
    reorderLevel
  ) {
    return BagStockStatus
      .REORDER_REQUIRED;
  }

  return BagStockStatus.AVAILABLE;

}

function calculateAvailableQuantity({
  onHandQuantity,
  reservedQuantity,
  damagedQuantity,
  rules,
} = {}) {

  const rawAvailable =
    onHandQuantity -
    reservedQuantity -
    damagedQuantity;

  if (
    rules
      ?.bagStock
      ?.allowNegativeStock ===
    true
  ) {
    return rawAvailable;
  }

  return Math.max(
    0,
    rawAvailable,
  );

}

/**
 * Normalize one bag-stock record.
 */
function normalizeStockEntry({
  bagSizeKg,
  entry = {},
  rules,
} = {}) {

  const normalizedBagSizeKg =
    Number(
      bagSizeKg ??
      entry?.bagSizeKg,
    );

  const openingQuantity =
    normalizeInteger(
      entry?.openingQuantity,
    );

  const receivedQuantity =
    normalizeInteger(
      entry?.receivedQuantity,
    );

  const consumedQuantity =
    normalizeInteger(
      entry?.consumedQuantity,
    );

  const reservedQuantity =
    normalizeInteger(
      entry?.reservedQuantity,
    );

  const releasedQuantity =
    normalizeInteger(
      entry?.releasedQuantity,
    );

  const damagedQuantity =
    normalizeInteger(
      entry?.damagedQuantity,
    );

  const positiveAdjustmentQuantity =
    normalizeInteger(
      entry
        ?.positiveAdjustmentQuantity,
    );

  const negativeAdjustmentQuantity =
    normalizeInteger(
      entry
        ?.negativeAdjustmentQuantity,
    );

  const calculatedOnHandQuantity =
    openingQuantity +
    receivedQuantity +
    releasedQuantity +
    positiveAdjustmentQuantity -
    consumedQuantity -
    negativeAdjustmentQuantity;

  const explicitOnHandQuantity =
    normalizeInteger(
      entry?.onHandQuantity ??
      entry?.physicalQuantity ??
      entry?.totalQuantity,

      {
        allowNull:
          true,
      },
    );

  const onHandQuantity =
    explicitOnHandQuantity ??
    Math.max(
      0,
      calculatedOnHandQuantity,
    );

  const availableQuantity =
    entry?.availableQuantity !==
    undefined
      ? normalizeInteger(
          entry.availableQuantity,
        )
      : calculateAvailableQuantity({
          onHandQuantity,
          reservedQuantity,
          damagedQuantity,
          rules,
        });

  const lowStockThreshold =
    entry?.lowStockThreshold !==
    undefined
      ? normalizeInteger(
          entry.lowStockThreshold,
        )
      : getBagLowStockThreshold(
          normalizedBagSizeKg,
          rules,
        );

  const reorderLevel =
    entry?.reorderLevel !==
    undefined
      ? normalizeInteger(
          entry.reorderLevel,
        )
      : getBagReorderLevel(
          normalizedBagSizeKg,
          rules,
        );

  const enabled =
    entry?.enabled !== false &&
    entry?.status !==
      BagStockStatus.DISABLED;

  const status =
    resolveBagStockStatus({
      availableQuantity,
      reservedQuantity,
      lowStockThreshold,
      reorderLevel,
      enabled,
    });

  return {
    bagSizeKg:
      normalizedBagSizeKg,

    openingQuantity,

    receivedQuantity,

    reservedQuantity,

    consumedQuantity,

    releasedQuantity,

    damagedQuantity,

    positiveAdjustmentQuantity,

    negativeAdjustmentQuantity,

    onHandQuantity,

    availableQuantity,

    lowStockThreshold,

    reorderLevel,

    status,

    enabled,

    stockLocationId:
      normalizeText(
        entry?.stockLocationId,
      ),

    estateId:
      normalizeText(
        entry?.estateId,
      ),

    businessUnitId:
      normalizeText(
        entry?.businessUnitId,
      ),

    runtimeMode:
      normalizeText(
        entry?.runtimeMode,
      ),

    lastMovementAt:
      normalizeTimestamp(
        entry?.lastMovementAt,
        null,
      ),

    lastCountedAt:
      normalizeTimestamp(
        entry?.lastCountedAt,
        null,
      ),

    lastUpdatedAt:
      normalizeTimestamp(
        entry?.lastUpdatedAt,
      ),
  };

}

/**
 * ==========================================================
 * Snapshot Normalization
 * ==========================================================
 */

/**
 * Normalize supported stock-snapshot shapes.
 *
 * Array:
 *
 * [
 *   {
 *     bagSizeKg: 90,
 *     availableQuantity: 4
 *   }
 * ]
 *
 * Object:
 *
 * {
 *   90: {
 *     availableQuantity: 4
 *   }
 * }
 *
 * Compact object:
 *
 * {
 *   90: 4
 * }
 */
export function normalizeBagStockSnapshot({
  snapshot,
  rules =
    DEFAULT_PACKAGING_RULES,
  includeMissingSupportedSizes = true,
} = {}) {

  const rulesValidation =
    validatePackagingRules(
      rules,
    );

  if (
    rulesValidation.accepted !==
    true
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        "INVALID_PACKAGING_RULES",

      stockByBagSizeKg: {},

      entries: [],

      errors:
        rulesValidation.errors,

      warnings:
        rulesValidation.warnings,

      rulesVersion:
        getPackagingRulesVersion(
          rules,
        ),
    });
  }

  if (
    snapshot === null ||
    snapshot === undefined ||
    typeof snapshot !==
      "object"
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        PackagingConstraintCode
          .BAG_STOCK_SNAPSHOT_REQUIRED,

      stockByBagSizeKg: {},

      entries: [],

      errors: [
        createError({
          code:
            PackagingConstraintCode
              .BAG_STOCK_SNAPSHOT_REQUIRED,

          field:
            "snapshot",

          message:
            "An empty-bag stock snapshot is required.",
        }),
      ],

      warnings: [],

      rulesVersion:
        getPackagingRulesVersion(
          rules,
        ),
    });
  }

  const rawEntries = [];

  if (Array.isArray(snapshot)) {

    snapshot.forEach(
      (entry) => {

        rawEntries.push({
          bagSizeKg:
            entry?.bagSizeKg,

          entry:
            entry ?? {},
        });

      },
    );

  } else {

    const stockSource =
      snapshot?.stockByBagSizeKg ??
      snapshot?.inventoryByBagSizeKg ??
      snapshot;

    Object.entries(
      stockSource,
    ).forEach(
      ([
        rawBagSizeKg,
        rawEntry,
      ]) => {

        if (
          Number.isFinite(
            Number(rawEntry),
          )
        ) {
          rawEntries.push({
            bagSizeKg:
              rawBagSizeKg,

            entry: {
              bagSizeKg:
                Number(
                  rawBagSizeKg,
                ),

              availableQuantity:
                Number(
                  rawEntry,
                ),

              onHandQuantity:
                Number(
                  rawEntry,
                ),
            },
          });

          return;
        }

        rawEntries.push({
          bagSizeKg:
            rawEntry?.bagSizeKg ??
            rawBagSizeKg,

          entry:
            rawEntry ?? {},
        });

      },
    );

  }

  const errors = [];
  const warnings = [];
  const stockByBagSizeKg = {};

  rawEntries.forEach(
    ({
      bagSizeKg,
      entry,
    }) => {

      const normalizedBagSizeKg =
        Number(
          bagSizeKg,
        );

      if (
        !Number.isFinite(
          normalizedBagSizeKg,
        ) ||
        normalizedBagSizeKg <= 0
      ) {
        errors.push(
          createError({
            code:
              "INVALID_BAG_SIZE",

            field:
              "bagSizeKg",

            message:
              "Bag-stock entries require a positive bag size.",

            details: {
              bagSizeKg,
            },
          }),
        );

        return;
      }

      if (
        !isSupportedBagSizeKg(
          normalizedBagSizeKg,
          rules,
        )
      ) {
        errors.push(
          createError({
            code:
              PackagingConstraintCode
                .BAG_SIZE_UNSUPPORTED,

            field:
              "bagSizeKg",

            message:
              `${normalizedBagSizeKg} kg is not an approved NexFarm bag size.`,

            details: {
              bagSizeKg:
                normalizedBagSizeKg,
            },
          }),
        );

        return;
      }

      stockByBagSizeKg[
        normalizedBagSizeKg
      ] =
        normalizeStockEntry({
          bagSizeKg:
            normalizedBagSizeKg,

          entry,

          rules,
        });

    },
  );

  if (
    includeMissingSupportedSizes ===
    true
  ) {

    getAllowedBagSizesKg(
      rules,
    ).forEach(
      (bagSizeKg) => {

        if (
          stockByBagSizeKg[
            bagSizeKg
          ]
        ) {
          return;
        }

        stockByBagSizeKg[
          bagSizeKg
        ] =
          normalizeStockEntry({
            bagSizeKg,

            entry: {
              openingQuantity:
                0,

              onHandQuantity:
                0,

              availableQuantity:
                0,

              reservedQuantity:
                0,

              damagedQuantity:
                0,
            },

            rules,
          });

      },
    );

  }

  const entries =
    Object.values(
      stockByBagSizeKg,
    )
      .sort(
        (
          firstEntry,
          secondEntry,
        ) =>
          secondEntry.bagSizeKg -
          firstEntry.bagSizeKg,
      );

  entries.forEach(
    (entry) => {

      if (
        entry.status ===
        BagStockStatus.LOW
      ) {
        warnings.push(
          createWarning({
            code:
              PackagingWarningCode
                .LOW_EMPTY_BAG_STOCK,

            field:
              `stockByBagSizeKg.${entry.bagSizeKg}`,

            message:
              `${entry.bagSizeKg} kg empty-bag stock is at or below its low-stock threshold.`,

            details: {
              bagSizeKg:
                entry.bagSizeKg,

              availableQuantity:
                entry.availableQuantity,

              lowStockThreshold:
                entry.lowStockThreshold,
            },
          }),
        );
      }

    },
  );

  const valid =
    errors.length === 0;

  return deepFreeze({
    accepted:
      valid,

    valid,

    reason:
      valid
        ? null
        : errors[0]?.code ??
          "INVALID_BAG_STOCK_SNAPSHOT",

    stockByBagSizeKg,

    entries,

    errors,

    warnings,

    totals:
      calculateBagStockTotals(
        entries,
      ),

    rulesVersion:
      getPackagingRulesVersion(
        rules,
      ),
  });

}

/**
 * ==========================================================
 * Stock Totals
 * ==========================================================
 */

export function calculateBagStockTotals(
  entries = [],
) {

  const normalizedEntries =
    Array.isArray(entries)
      ? entries
      : [];

  const totals =
    normalizedEntries.reduce(
      (
        currentTotals,
        entry,
      ) => ({

        bagSizeCount:
          currentTotals
            .bagSizeCount +
          1,

        openingQuantity:
          currentTotals
            .openingQuantity +
          normalizeInteger(
            entry
              ?.openingQuantity,
          ),

        receivedQuantity:
          currentTotals
            .receivedQuantity +
          normalizeInteger(
            entry
              ?.receivedQuantity,
          ),

        reservedQuantity:
          currentTotals
            .reservedQuantity +
          normalizeInteger(
            entry
              ?.reservedQuantity,
          ),

        consumedQuantity:
          currentTotals
            .consumedQuantity +
          normalizeInteger(
            entry
              ?.consumedQuantity,
          ),

        releasedQuantity:
          currentTotals
            .releasedQuantity +
          normalizeInteger(
            entry
              ?.releasedQuantity,
          ),

        damagedQuantity:
          currentTotals
            .damagedQuantity +
          normalizeInteger(
            entry
              ?.damagedQuantity,
          ),

        onHandQuantity:
          currentTotals
            .onHandQuantity +
          normalizeInteger(
            entry
              ?.onHandQuantity,
          ),

        availableQuantity:
          currentTotals
            .availableQuantity +
          normalizeInteger(
            entry
              ?.availableQuantity,
          ),

      }),

      {
        bagSizeCount: 0,
        openingQuantity: 0,
        receivedQuantity: 0,
        reservedQuantity: 0,
        consumedQuantity: 0,
        releasedQuantity: 0,
        damagedQuantity: 0,
        onHandQuantity: 0,
        availableQuantity: 0,
      },
    );

  return totals;

}

/**
 * ==========================================================
 * Requirement Normalization
 * ==========================================================
 */

export function normalizeBagStockRequirements({
  requirements = [],
  rules =
    DEFAULT_PACKAGING_RULES,
} = {}) {

  if (!Array.isArray(requirements)) {
    return deepFreeze({
      accepted: false,

      reason:
        "BAG_STOCK_REQUIREMENTS_INVALID",

      requirements: [],

      errors: [
        createError({
          code:
            "BAG_STOCK_REQUIREMENTS_INVALID",

          field:
            "requirements",

          message:
            "Bag-stock requirements must be an array.",
        }),
      ],
    });
  }

  const consolidated = {};
  const errors = [];

  requirements.forEach(
    (requirement) => {

      const bagSizeKg =
        Number(
          requirement?.bagSizeKg,
        );

      const requiredQuantity =
        normalizeInteger(
          requirement
            ?.requiredQuantity ??
          requirement
            ?.quantity,
        );

      if (
        !isSupportedBagSizeKg(
          bagSizeKg,
          rules,
        )
      ) {
        errors.push(
          createError({
            code:
              PackagingConstraintCode
                .BAG_SIZE_UNSUPPORTED,

            field:
              "requirements.bagSizeKg",

            message:
              "Packaging requirements include an unsupported bag size.",

            details: {
              bagSizeKg,
            },
          }),
        );

        return;
      }

      if (
        requiredQuantity <= 0
      ) {
        errors.push(
          createError({
            code:
              "INVALID_REQUIRED_BAG_QUANTITY",

            field:
              "requirements.requiredQuantity",

            message:
              "Required bag quantity must be a positive integer.",

            details: {
              bagSizeKg,
              requiredQuantity,
            },
          }),
        );

        return;
      }

      consolidated[
        bagSizeKg
      ] = {
        bagSizeKg,

        requiredQuantity:
          (
            consolidated[
              bagSizeKg
            ]
              ?.requiredQuantity ??
            0
          ) +
          requiredQuantity,
      };

    },
  );

  const normalizedRequirements =
    Object.values(
      consolidated,
    )
      .sort(
        (
          firstRequirement,
          secondRequirement,
        ) =>
          secondRequirement
            .bagSizeKg -
          firstRequirement
            .bagSizeKg,
      );

  return deepFreeze({
    accepted:
      errors.length === 0,

    reason:
      errors[0]?.code ??
      null,

    requirements:
      normalizedRequirements,

    totalRequiredBags:
      normalizedRequirements.reduce(
        (
          total,
          requirement,
        ) =>
          total +
          requirement
            .requiredQuantity,
        0,
      ),

    errors,
  });

}

/**
 * ==========================================================
 * Packaging Stock Feasibility
 * ==========================================================
 */

/**
 * Check whether an empty-bag stock snapshot can satisfy
 * one packaging plan.
 *
 * This function does not reserve stock.
 */
export function evaluateBagStockFeasibility({
  snapshot,
  requirements = [],
  planId = null,
  estateId = null,
  businessUnitId = null,
  runtimeMode = null,
  rules =
    DEFAULT_PACKAGING_RULES,
  evaluatedAt =
    new Date().toISOString(),
} = {}) {

  const snapshotResult =
    normalizeBagStockSnapshot({
      snapshot,
      rules,
    });

  if (
    snapshotResult.accepted !==
    true
  ) {
    return deepFreeze({
      accepted: false,

      feasible: false,

      reason:
        snapshotResult.reason,

      planId,

      requirements: [],

      satisfiedRequirements: [],

      shortages: [],

      warnings:
        snapshotResult.warnings,

      errors:
        snapshotResult.errors,

      decisionTrace: {
        snapshotResult,
      },
    });
  }

  const requirementsResult =
    normalizeBagStockRequirements({
      requirements,
      rules,
    });

  if (
    requirementsResult.accepted !==
    true
  ) {
    return deepFreeze({
      accepted: false,

      feasible: false,

      reason:
        requirementsResult.reason,

      planId,

      requirements:
        requirementsResult
          .requirements,

      satisfiedRequirements: [],

      shortages: [],

      warnings: [],

      errors:
        requirementsResult.errors,

      decisionTrace: {
        requirementsResult,
      },
    });
  }

  const satisfiedRequirements = [];
  const shortages = [];
  const warnings = [
    ...snapshotResult.warnings,
  ];

  requirementsResult
    .requirements
    .forEach(
      (requirement) => {

        const stockEntry =
          snapshotResult
            .stockByBagSizeKg
            ?.[
              requirement
                .bagSizeKg
            ];

        const availableQuantity =
          stockEntry
            ?.enabled === true
            ? stockEntry
                .availableQuantity
            : 0;

        const shortageQuantity =
          Math.max(
            0,
            requirement
              .requiredQuantity -
            availableQuantity,
          );

        const reservableQuantity =
          Math.min(
            requirement
              .requiredQuantity,
            availableQuantity,
          );

        const postReservationAvailable =
          availableQuantity -
          reservableQuantity;

        const result = {
          bagSizeKg:
            requirement
              .bagSizeKg,

          requiredQuantity:
            requirement
              .requiredQuantity,

          availableQuantity,

          reservableQuantity,

          shortageQuantity,

          availableQuantityAfterReservation:
            postReservationAvailable,

          feasible:
            shortageQuantity ===
            0,

          stockStatus:
            stockEntry
              ?.status ??
            BagStockStatus
              .UNINITIALIZED,
        };

        if (
          shortageQuantity > 0
        ) {
          shortages.push({
            ...result,

            constraintCode:
              availableQuantity <= 0
                ? PackagingConstraintCode
                    .EMPTY_BAG_STOCK_UNAVAILABLE
                : PackagingConstraintCode
                    .EMPTY_BAG_STOCK_INSUFFICIENT,
          });

          return;
        }

        satisfiedRequirements.push(
          result,
        );

        const threshold =
          stockEntry
            ?.lowStockThreshold ??
          getBagLowStockThreshold(
            requirement
              .bagSizeKg,
            rules,
          );

        if (
          postReservationAvailable <=
          threshold
        ) {
          warnings.push(
            createWarning({
              code:
                PackagingWarningCode
                  .LOW_EMPTY_BAG_STOCK,

              field:
                `stockByBagSizeKg.${requirement.bagSizeKg}`,

              message:
                `${requirement.bagSizeKg} kg empty-bag stock will be low after reservation.`,

              details: {
                bagSizeKg:
                  requirement
                    .bagSizeKg,

                availableBefore:
                  availableQuantity,

                requiredQuantity:
                  requirement
                    .requiredQuantity,

                availableAfter:
                  postReservationAvailable,

                lowStockThreshold:
                  threshold,
              },
            }),
          );
        }

      },
    );

  const feasible =
    shortages.length === 0;

  const evaluatedTimestamp =
    normalizeTimestamp(
      evaluatedAt,
    );

  return deepFreeze({
    accepted: true,

    feasible,

    reason:
      feasible
        ? null
        : shortages[0]
            ?.constraintCode ??
          PackagingConstraintCode
            .EMPTY_BAG_STOCK_INSUFFICIENT,

    planId:
      normalizeText(
        planId,
      ),

    requirements:
      requirementsResult
        .requirements,

    satisfiedRequirements,

    shortages,

    warnings,

    errors: [],

    estateId:
      normalizeText(
        estateId,
      ),

    businessUnitId:
      normalizeText(
        businessUnitId,
      ),

    runtimeMode:
      normalizeText(
        runtimeMode,
      ),

    evaluatedAt:
      evaluatedTimestamp,

    rulesVersion:
      getPackagingRulesVersion(
        rules,
      ),

    decisionTrace: {
      planId:
        normalizeText(
          planId,
        ),

      requirements:
        requirementsResult
          .requirements,

      stockSnapshot:
        snapshotResult
          .stockByBagSizeKg,

      satisfiedRequirements,

      shortages,

      warnings,

      estateId:
        normalizeText(
          estateId,
        ),

      businessUnitId:
        normalizeText(
          businessUnitId,
        ),

      runtimeMode:
        normalizeText(
          runtimeMode,
        ),

      evaluatedAt:
        evaluatedTimestamp,

      rulesVersion:
        getPackagingRulesVersion(
          rules,
        ),
    },
  });

}

/**
 * ==========================================================
 * Reservation Calculation
 * ==========================================================
 */

/**
 * Calculate a proposed reservation.
 *
 * No stock is stored or mutated here.
 * The service must create BAG_STOCK_RESERVED events.
 */
export function calculateBagStockReservation({
  snapshot,
  requirements = [],
  reservationId =
    crypto.randomUUID(),
  planId,
  intakeId = null,
  estateId = null,
  businessUnitId = null,
  runtimeMode = null,
  reservedAt =
    new Date().toISOString(),
  expiresAt = null,
  rules =
    DEFAULT_PACKAGING_RULES,
} = {}) {

  const feasibility =
    evaluateBagStockFeasibility({
      snapshot,
      requirements,
      planId,
      estateId,
      businessUnitId,
      runtimeMode,
      rules,
      evaluatedAt:
        reservedAt,
    });

  if (
    feasibility.accepted !==
      true ||
    feasibility.feasible !==
      true
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        feasibility.reason,

      reservationId:
        normalizeText(
          reservationId,
        ),

      planId:
        normalizeText(
          planId,
        ),

      intakeId:
        normalizeText(
          intakeId,
        ),

      reservationStatus:
        null,

      reservationLines: [],

      stockAfterReservation:
        null,

      feasibility,
    });
  }

  const normalizedSnapshot =
    normalizeBagStockSnapshot({
      snapshot,
      rules,
    });

  const stockAfterReservation =
    cloneValue(
      normalizedSnapshot
        .stockByBagSizeKg,
    );

  const reservationLines =
    feasibility
      .satisfiedRequirements
      .map(
        (requirement) => {

          const currentEntry =
            stockAfterReservation[
              requirement
                .bagSizeKg
            ];

          const quantity =
            requirement
              .requiredQuantity;

          currentEntry
            .reservedQuantity +=
            quantity;

          currentEntry
            .availableQuantity =
            Math.max(
              0,
              currentEntry
                .availableQuantity -
              quantity,
            );

          currentEntry.status =
            resolveBagStockStatus({
              availableQuantity:
                currentEntry
                  .availableQuantity,

              reservedQuantity:
                currentEntry
                  .reservedQuantity,

              lowStockThreshold:
                currentEntry
                  .lowStockThreshold,

              reorderLevel:
                currentEntry
                  .reorderLevel,

              enabled:
                currentEntry
                  .enabled,
            });

          currentEntry.lastMovementAt =
            normalizeTimestamp(
              reservedAt,
            );

          currentEntry.lastUpdatedAt =
            normalizeTimestamp(
              reservedAt,
            );

          return {
            reservationId:
              normalizeText(
                reservationId,
              ),

            planId:
              normalizeText(
                planId,
              ),

            intakeId:
              normalizeText(
                intakeId,
              ),

            bagSizeKg:
              requirement
                .bagSizeKg,

            reservedQuantity:
              quantity,

            availableQuantityBefore:
              requirement
                .availableQuantity,

            availableQuantityAfter:
              currentEntry
                .availableQuantity,

            status:
              BagStockReservationStatus
                .ACTIVE,
          };

        },
      );

  return deepFreeze({
    accepted: true,

    reason:
      null,

    reservationId:
      normalizeText(
        reservationId,
      ),

    planId:
      normalizeText(
        planId,
      ),

    intakeId:
      normalizeText(
        intakeId,
      ),

    reservationStatus:
      BagStockReservationStatus
        .ACTIVE,

    reservationLines,

    totalReservedBags:
      reservationLines.reduce(
        (
          total,
          line,
        ) =>
          total +
          line.reservedQuantity,
        0,
      ),

    reservedAt:
      normalizeTimestamp(
        reservedAt,
      ),

    expiresAt:
      normalizeTimestamp(
        expiresAt,
        null,
      ),

    estateId:
      normalizeText(
        estateId,
      ),

    businessUnitId:
      normalizeText(
        businessUnitId,
      ),

    runtimeMode:
      normalizeText(
        runtimeMode,
      ),

    stockAfterReservation,

    feasibility,

    rulesVersion:
      getPackagingRulesVersion(
        rules,
      ),

    nexVoxObservation: {
      advisoryOnly:
        true,

      reservationId:
        normalizeText(
          reservationId,
        ),

      planId:
        normalizeText(
          planId,
        ),

      totalReservedBags:
        reservationLines.reduce(
          (
            total,
            line,
          ) =>
            total +
            line.reservedQuantity,
          0,
        ),

      reservationLines,

      shortages:
        [],

      createdAt:
        normalizeTimestamp(
          reservedAt,
        ),
    },
  });

}
/**
 * ==========================================================
 * Consumption Calculation
 * ==========================================================
 */

/**
 * Calculate consumption of previously reserved empty bags.
 *
 * BAG_STOCK_CONSUMED should occur only after the official
 * NexFarm bag has been successfully created.
 */
export function calculateBagStockConsumption({
  snapshot,
  bagSizeKg,
  quantity = 1,
  reservationId,
  planId = null,
  intakeId = null,
  bagIds = [],
  consumedAt =
    new Date().toISOString(),
  rules =
    DEFAULT_PACKAGING_RULES,
} = {}) {

  const normalizedBagSizeKg =
    Number(
      bagSizeKg,
    );

  const normalizedQuantity =
    normalizeInteger(
      quantity,
    );

  if (
    !isSupportedBagSizeKg(
      normalizedBagSizeKg,
      rules,
    )
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        PackagingConstraintCode
          .BAG_SIZE_UNSUPPORTED,

      bagSizeKg:
        normalizedBagSizeKg,

      quantity:
        normalizedQuantity,
    });
  }

  if (
    normalizedQuantity <= 0
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        "INVALID_CONSUMPTION_QUANTITY",

      bagSizeKg:
        normalizedBagSizeKg,

      quantity:
        normalizedQuantity,
    });
  }

  if (
    !normalizeText(
      reservationId,
    ) &&
    rules
      ?.bagStock
      ?.reservationRequiredBeforeBagCreation ===
    true
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        PackagingConstraintCode
          .BAG_STOCK_RESERVATION_REQUIRED,

      bagSizeKg:
        normalizedBagSizeKg,

      quantity:
        normalizedQuantity,
    });
  }

  const snapshotResult =
    normalizeBagStockSnapshot({
      snapshot,
      rules,
    });

  if (
    snapshotResult.accepted !==
    true
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        snapshotResult.reason,

      snapshot:
        snapshotResult,
    });
  }

  const stockEntry =
    snapshotResult
      .stockByBagSizeKg
      ?.[normalizedBagSizeKg];

  const reservedQuantity =
    normalizeInteger(
      stockEntry
        ?.reservedQuantity,
    );

  if (
    reservedQuantity <
    normalizedQuantity
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        PackagingConstraintCode
          .BAG_STOCK_RESERVATION_INSUFFICIENT,

      bagSizeKg:
        normalizedBagSizeKg,

      requestedQuantity:
        normalizedQuantity,

      reservedQuantity,

      shortageQuantity:
        normalizedQuantity -
        reservedQuantity,
    });
  }

  const stockAfterConsumption =
    cloneValue(
      snapshotResult
        .stockByBagSizeKg,
    );

  const updatedEntry =
    stockAfterConsumption[
      normalizedBagSizeKg
    ];

  updatedEntry.reservedQuantity =
    Math.max(
      0,
      updatedEntry
        .reservedQuantity -
      normalizedQuantity,
    );

  updatedEntry.onHandQuantity =
    Math.max(
      0,
      updatedEntry
        .onHandQuantity -
      normalizedQuantity,
    );

  updatedEntry.consumedQuantity +=
    normalizedQuantity;

  updatedEntry.status =
    resolveBagStockStatus({
      availableQuantity:
        updatedEntry
          .availableQuantity,

      reservedQuantity:
        updatedEntry
          .reservedQuantity,

      lowStockThreshold:
        updatedEntry
          .lowStockThreshold,

      reorderLevel:
        updatedEntry
          .reorderLevel,

      enabled:
        updatedEntry.enabled,
    });

  updatedEntry.lastMovementAt =
    normalizeTimestamp(
      consumedAt,
    );

  updatedEntry.lastUpdatedAt =
    normalizeTimestamp(
      consumedAt,
    );

  return deepFreeze({
    accepted: true,

    reason:
      null,

    movementType:
      BagStockMovementType
        .CONSUMED,

    reservationId:
      normalizeText(
        reservationId,
      ),

    planId:
      normalizeText(
        planId,
      ),

    intakeId:
      normalizeText(
        intakeId,
      ),

    bagSizeKg:
      normalizedBagSizeKg,

    consumedQuantity:
      normalizedQuantity,

    reservedQuantityBefore:
      reservedQuantity,

    reservedQuantityAfter:
      updatedEntry
        .reservedQuantity,

    onHandQuantityBefore:
      stockEntry
        .onHandQuantity,

    onHandQuantityAfter:
      updatedEntry
        .onHandQuantity,

    availableQuantityAfter:
      updatedEntry
        .availableQuantity,

    bagIds:
      Array.isArray(
        bagIds,
      )
        ? [
            ...bagIds,
          ]
        : [],

    consumedAt:
      normalizeTimestamp(
        consumedAt,
      ),

    stockAfterConsumption,

    rulesVersion:
      getPackagingRulesVersion(
        rules,
      ),
  });

}

/**
 * ==========================================================
 * Reservation Release Calculation
 * ==========================================================
 */

export function calculateBagStockRelease({
  snapshot,
  bagSizeKg,
  quantity,
  reservationId,
  planId = null,
  intakeId = null,
  releaseReason =
    "packaging_cancelled",
  releasedAt =
    new Date().toISOString(),
  rules =
    DEFAULT_PACKAGING_RULES,
} = {}) {

  const normalizedBagSizeKg =
    Number(
      bagSizeKg,
    );

  const normalizedQuantity =
    normalizeInteger(
      quantity,
    );

  if (
    !isSupportedBagSizeKg(
      normalizedBagSizeKg,
      rules,
    )
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        PackagingConstraintCode
          .BAG_SIZE_UNSUPPORTED,
    });
  }

  if (
    normalizedQuantity <= 0
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        "INVALID_RELEASE_QUANTITY",
    });
  }

  const snapshotResult =
    normalizeBagStockSnapshot({
      snapshot,
      rules,
    });

  if (
    snapshotResult.accepted !==
    true
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        snapshotResult.reason,

      snapshot:
        snapshotResult,
    });
  }

  const stockEntry =
    snapshotResult
      .stockByBagSizeKg
      ?.[normalizedBagSizeKg];

  const reservedQuantity =
    stockEntry
      ?.reservedQuantity ??
    0;

  if (
    reservedQuantity <
    normalizedQuantity
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        PackagingConstraintCode
          .BAG_STOCK_RESERVATION_INSUFFICIENT,

      requestedReleaseQuantity:
        normalizedQuantity,

      reservedQuantity,
    });
  }

  const stockAfterRelease =
    cloneValue(
      snapshotResult
        .stockByBagSizeKg,
    );

  const updatedEntry =
    stockAfterRelease[
      normalizedBagSizeKg
    ];

  updatedEntry.reservedQuantity -=
    normalizedQuantity;

  updatedEntry.availableQuantity +=
    normalizedQuantity;

  updatedEntry.releasedQuantity +=
    normalizedQuantity;

  updatedEntry.status =
    resolveBagStockStatus({
      availableQuantity:
        updatedEntry
          .availableQuantity,

      reservedQuantity:
        updatedEntry
          .reservedQuantity,

      lowStockThreshold:
        updatedEntry
          .lowStockThreshold,

      reorderLevel:
        updatedEntry
          .reorderLevel,

      enabled:
        updatedEntry.enabled,
    });

  updatedEntry.lastMovementAt =
    normalizeTimestamp(
      releasedAt,
    );

  updatedEntry.lastUpdatedAt =
    normalizeTimestamp(
      releasedAt,
    );

  return deepFreeze({
    accepted: true,

    reason:
      null,

    movementType:
      BagStockMovementType
        .RELEASED,

    reservationId:
      normalizeText(
        reservationId,
      ),

    planId:
      normalizeText(
        planId,
      ),

    intakeId:
      normalizeText(
        intakeId,
      ),

    bagSizeKg:
      normalizedBagSizeKg,

    releasedQuantity:
      normalizedQuantity,

    releaseReason:
      normalizeText(
        releaseReason,
      ),

    reservedQuantityBefore:
      reservedQuantity,

    reservedQuantityAfter:
      updatedEntry
        .reservedQuantity,

    availableQuantityBefore:
      stockEntry
        .availableQuantity,

    availableQuantityAfter:
      updatedEntry
        .availableQuantity,

    releasedAt:
      normalizeTimestamp(
        releasedAt,
      ),

    stockAfterRelease,

    rulesVersion:
      getPackagingRulesVersion(
        rules,
      ),
  });

}
/**
 * ==========================================================
 * Damage Calculation
 * ==========================================================
 */

/**
 * Calculate the effect of confirmed empty-bag damage.
 *
 * Damage may affect available or reserved bags.
 * It must never disappear as an undocumented adjustment.
 */
export function calculateBagStockDamage({
  snapshot,
  bagSizeKg,
  quantity,
  damageReason,
  damageStage = null,
  reservationId = null,
  planId = null,
  intakeId = null,
  bagId = null,
  evidenceReference = null,
  damagedFrom =
    "available",
  recordedAt =
    new Date().toISOString(),
  rules =
    DEFAULT_PACKAGING_RULES,
} = {}) {

  const normalizedBagSizeKg =
    Number(
      bagSizeKg,
    );

  const normalizedQuantity =
    normalizeInteger(
      quantity,
    );

  const normalizedDamageReason =
    normalizeText(
      damageReason,
    );

  if (
    !isSupportedBagSizeKg(
      normalizedBagSizeKg,
      rules,
    )
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        PackagingConstraintCode
          .BAG_SIZE_UNSUPPORTED,
    });
  }

  if (
    normalizedQuantity <= 0
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        "INVALID_DAMAGE_QUANTITY",
    });
  }

  if (!normalizedDamageReason) {
    return deepFreeze({
      accepted: false,

      reason:
        "BAG_DAMAGE_REASON_REQUIRED",
    });
  }

  const validDamageReasons =
    new Set(
      Object.values(
        BagStockDamageReason,
      ),
    );

  if (
    !validDamageReasons.has(
      normalizedDamageReason,
    )
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        "BAG_DAMAGE_REASON_UNSUPPORTED",

      damageReason:
        normalizedDamageReason,
    });
  }

  const snapshotResult =
    normalizeBagStockSnapshot({
      snapshot,
      rules,
    });

  if (
    snapshotResult.accepted !==
    true
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        snapshotResult.reason,
    });
  }

  const stockEntry =
    snapshotResult
      .stockByBagSizeKg
      ?.[normalizedBagSizeKg];

  const normalizedDamageSource =
    damagedFrom ===
    "reserved"
      ? "reserved"
      : "available";

  const sourceQuantity =
    normalizedDamageSource ===
    "reserved"
      ? stockEntry
          .reservedQuantity
      : stockEntry
          .availableQuantity;

  if (
    sourceQuantity <
    normalizedQuantity
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        PackagingConstraintCode
          .EMPTY_BAG_STOCK_INSUFFICIENT,

      bagSizeKg:
        normalizedBagSizeKg,

      damageSource:
        normalizedDamageSource,

      requestedDamageQuantity:
        normalizedQuantity,

      sourceQuantity,
    });
  }

  const stockAfterDamage =
    cloneValue(
      snapshotResult
        .stockByBagSizeKg,
    );

  const updatedEntry =
    stockAfterDamage[
      normalizedBagSizeKg
    ];

  if (
    normalizedDamageSource ===
    "reserved"
  ) {
    updatedEntry.reservedQuantity -=
      normalizedQuantity;
  } else {
    updatedEntry.availableQuantity -=
      normalizedQuantity;
  }

  updatedEntry.onHandQuantity =
    Math.max(
      0,
      updatedEntry
        .onHandQuantity -
      normalizedQuantity,
    );

  updatedEntry.damagedQuantity +=
    normalizedQuantity;

  updatedEntry.status =
    resolveBagStockStatus({
      availableQuantity:
        updatedEntry
          .availableQuantity,

      reservedQuantity:
        updatedEntry
          .reservedQuantity,

      lowStockThreshold:
        updatedEntry
          .lowStockThreshold,

      reorderLevel:
        updatedEntry
          .reorderLevel,

      enabled:
        updatedEntry.enabled,
    });

  updatedEntry.lastMovementAt =
    normalizeTimestamp(
      recordedAt,
    );

  updatedEntry.lastUpdatedAt =
    normalizeTimestamp(
      recordedAt,
    );

  return deepFreeze({
    accepted: true,

    reason:
      null,

    movementType:
      BagStockMovementType
        .DAMAGED,

    bagSizeKg:
      normalizedBagSizeKg,

    damagedQuantity:
      normalizedQuantity,

    damageReason:
      normalizedDamageReason,

    damageStage:
      normalizeText(
        damageStage,
      ),

    damagedFrom:
      normalizedDamageSource,

    reservationId:
      normalizeText(
        reservationId,
      ),

    planId:
      normalizeText(
        planId,
      ),

    intakeId:
      normalizeText(
        intakeId,
      ),

    bagId:
      normalizeText(
        bagId,
      ),

    evidenceReference:
      normalizeText(
        evidenceReference,
      ),

    onHandQuantityBefore:
      stockEntry
        .onHandQuantity,

    onHandQuantityAfter:
      updatedEntry
        .onHandQuantity,

    availableQuantityAfter:
      updatedEntry
        .availableQuantity,

    reservedQuantityAfter:
      updatedEntry
        .reservedQuantity,

    damagedQuantityAfter:
      updatedEntry
        .damagedQuantity,

    recordedAt:
      normalizeTimestamp(
        recordedAt,
      ),

    stockAfterDamage,

    rulesVersion:
      getPackagingRulesVersion(
        rules,
      ),

    nexVoxObservation: {
      advisoryOnly:
        true,

      bagSizeKg:
        normalizedBagSizeKg,

      damagedQuantity:
        normalizedQuantity,

      damageReason:
        normalizedDamageReason,

      damageStage:
        normalizeText(
          damageStage,
        ),

      recordedAt:
        normalizeTimestamp(
          recordedAt,
        ),
    },
  });

}

/**
 * ==========================================================
 * Physical Count and Adjustment
 * ==========================================================
 */

export function calculateBagStockCountDifference({
  snapshot,
  bagSizeKg,
  countedOnHandQuantity,
  countReference = null,
  countedAt =
    new Date().toISOString(),
  rules =
    DEFAULT_PACKAGING_RULES,
} = {}) {

  const normalizedBagSizeKg =
    Number(
      bagSizeKg,
    );

  const normalizedCountedQuantity =
    normalizeInteger(
      countedOnHandQuantity,
    );

  if (
    !isSupportedBagSizeKg(
      normalizedBagSizeKg,
      rules,
    )
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        PackagingConstraintCode
          .BAG_SIZE_UNSUPPORTED,
    });
  }

  const snapshotResult =
    normalizeBagStockSnapshot({
      snapshot,
      rules,
    });

  if (
    snapshotResult.accepted !==
    true
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        snapshotResult.reason,
    });
  }

  const stockEntry =
    snapshotResult
      .stockByBagSizeKg
      ?.[normalizedBagSizeKg];

  const expectedOnHandQuantity =
    stockEntry
      .onHandQuantity;

  const differenceQuantity =
    normalizedCountedQuantity -
    expectedOnHandQuantity;

  return deepFreeze({
    accepted: true,

    reason:
      null,

    movementType:
      BagStockMovementType
        .COUNTED,

    bagSizeKg:
      normalizedBagSizeKg,

    expectedOnHandQuantity,

    countedOnHandQuantity:
      normalizedCountedQuantity,

    differenceQuantity,

    adjustmentRequired:
      differenceQuantity !== 0,

    adjustmentDirection:
      differenceQuantity > 0
        ? "increase"
        : differenceQuantity < 0
          ? "decrease"
          : "none",

    unexplainedShortage:
      differenceQuantity < 0,

    countReference:
      normalizeText(
        countReference,
      ),

    countedAt:
      normalizeTimestamp(
        countedAt,
      ),

    rulesVersion:
      getPackagingRulesVersion(
        rules,
      ),

    nexVoxObservation: {
      advisoryOnly:
        true,

      bagSizeKg:
        normalizedBagSizeKg,

      expectedOnHandQuantity,

      countedOnHandQuantity:
        normalizedCountedQuantity,

      differenceQuantity,

      unexplainedShortage:
        differenceQuantity < 0,

      countedAt:
        normalizeTimestamp(
          countedAt,
        ),
    },
  });

}

export function calculateBagStockAdjustment({
  snapshot,
  bagSizeKg,
  adjustmentQuantity,
  adjustmentReason,
  countReference = null,
  evidenceReference = null,
  adjustedAt =
    new Date().toISOString(),
  rules =
    DEFAULT_PACKAGING_RULES,
} = {}) {

  const normalizedBagSizeKg =
    Number(
      bagSizeKg,
    );

  const normalizedAdjustment =
    normalizeSignedInteger(
      adjustmentQuantity,
    );

  if (
    !isSupportedBagSizeKg(
      normalizedBagSizeKg,
      rules,
    )
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        PackagingConstraintCode
          .BAG_SIZE_UNSUPPORTED,
    });
  }

  if (
    normalizedAdjustment ===
      null ||
    normalizedAdjustment ===
      0
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        "INVALID_ADJUSTMENT_QUANTITY",
    });
  }

  if (
    !normalizeText(
      adjustmentReason,
    )
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        "ADJUSTMENT_REASON_REQUIRED",
    });
  }

  const snapshotResult =
    normalizeBagStockSnapshot({
      snapshot,
      rules,
    });

  if (
    snapshotResult.accepted !==
    true
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        snapshotResult.reason,
    });
  }

  const stockEntry =
    snapshotResult
      .stockByBagSizeKg
      ?.[normalizedBagSizeKg];

  const proposedOnHandQuantity =
    stockEntry
      .onHandQuantity +
    normalizedAdjustment;

  if (
    proposedOnHandQuantity < 0 &&
    rules
      ?.bagStock
      ?.allowNegativeStock !==
    true
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        PackagingConstraintCode
          .BAG_STOCK_NEGATIVE_BLOCKED,

      bagSizeKg:
        normalizedBagSizeKg,

      onHandQuantityBefore:
        stockEntry
          .onHandQuantity,

      adjustmentQuantity:
        normalizedAdjustment,

      proposedOnHandQuantity,
    });
  }

  const stockAfterAdjustment =
    cloneValue(
      snapshotResult
        .stockByBagSizeKg,
    );

  const updatedEntry =
    stockAfterAdjustment[
      normalizedBagSizeKg
    ];

  updatedEntry.onHandQuantity =
    Math.max(
      0,
      proposedOnHandQuantity,
    );

  if (
    normalizedAdjustment > 0
  ) {
    updatedEntry
      .positiveAdjustmentQuantity +=
      normalizedAdjustment;

    updatedEntry.availableQuantity +=
      normalizedAdjustment;
  } else {

    const reduction =
      Math.abs(
        normalizedAdjustment,
      );

    updatedEntry
      .negativeAdjustmentQuantity +=
      reduction;

    updatedEntry.availableQuantity =
      Math.max(
        0,
        updatedEntry
          .availableQuantity -
        reduction,
      );
  }

  updatedEntry.status =
    resolveBagStockStatus({
      availableQuantity:
        updatedEntry
          .availableQuantity,

      reservedQuantity:
        updatedEntry
          .reservedQuantity,

      lowStockThreshold:
        updatedEntry
          .lowStockThreshold,

      reorderLevel:
        updatedEntry
          .reorderLevel,

      enabled:
        updatedEntry.enabled,
    });

  updatedEntry.lastMovementAt =
    normalizeTimestamp(
      adjustedAt,
    );

  updatedEntry.lastUpdatedAt =
    normalizeTimestamp(
      adjustedAt,
    );

  return deepFreeze({
    accepted: true,

    reason:
      null,

    movementType:
      BagStockMovementType
        .ADJUSTED,

    bagSizeKg:
      normalizedBagSizeKg,

    adjustmentQuantity:
      normalizedAdjustment,

    adjustmentDirection:
      normalizedAdjustment > 0
        ? "increase"
        : "decrease",

    adjustmentReason:
      normalizeText(
        adjustmentReason,
      ),

    countReference:
      normalizeText(
        countReference,
      ),

    evidenceReference:
      normalizeText(
        evidenceReference,
      ),

    onHandQuantityBefore:
      stockEntry
        .onHandQuantity,

    onHandQuantityAfter:
      updatedEntry
        .onHandQuantity,

    availableQuantityBefore:
      stockEntry
        .availableQuantity,

    availableQuantityAfter:
      updatedEntry
        .availableQuantity,

    adjustedAt:
      normalizeTimestamp(
        adjustedAt,
      ),

    stockAfterAdjustment,

    rulesVersion:
      getPackagingRulesVersion(
        rules,
      ),
  });

}

/**
 * ==========================================================
 * Low-Stock Detection
 * ==========================================================
 */

export function detectBagStockLevels({
  snapshot,
  rules =
    DEFAULT_PACKAGING_RULES,
  evaluatedAt =
    new Date().toISOString(),
} = {}) {

  const snapshotResult =
    normalizeBagStockSnapshot({
      snapshot,
      rules,
    });

  if (
    snapshotResult.accepted !==
    true
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        snapshotResult.reason,

      lowStock: [],

      reorderRequired: [],

      outOfStock: [],

      healthy: [],
    });
  }

  const lowStock = [];
  const reorderRequired = [];
  const outOfStock = [];
  const healthy = [];

  snapshotResult.entries.forEach(
    (entry) => {

      const summary = {
        bagSizeKg:
          entry.bagSizeKg,

        availableQuantity:
          entry.availableQuantity,

        reservedQuantity:
          entry.reservedQuantity,

        damagedQuantity:
          entry.damagedQuantity,

        lowStockThreshold:
          entry.lowStockThreshold,

        reorderLevel:
          entry.reorderLevel,

        status:
          entry.status,
      };

      if (
        entry.status ===
        BagStockStatus
          .OUT_OF_STOCK ||
        entry.status ===
        BagStockStatus
          .RESERVED_ONLY
      ) {
        outOfStock.push(
          summary,
        );

        return;
      }

      if (
        entry.status ===
        BagStockStatus.LOW
      ) {
        lowStock.push(
          summary,
        );

        return;
      }

      if (
        entry.status ===
        BagStockStatus
          .REORDER_REQUIRED
      ) {
        reorderRequired.push(
          summary,
        );

        return;
      }

      healthy.push(
        summary,
      );

    },
  );

  return deepFreeze({
    accepted: true,

    reason:
      null,

    lowStockDetected:
      lowStock.length > 0,

    reorderRequiredDetected:
      reorderRequired.length > 0,

    outOfStockDetected:
      outOfStock.length > 0,

    lowStock,

    reorderRequired,

    outOfStock,

    healthy,

    totals:
      snapshotResult.totals,

    evaluatedAt:
      normalizeTimestamp(
        evaluatedAt,
      ),

    rulesVersion:
      getPackagingRulesVersion(
        rules,
      ),

    nexVoxObservation: {
      advisoryOnly:
        true,

      notificationCandidates: [
        ...outOfStock.map(
          (entry) => ({
            severity:
              "critical",

            recommendationType:
              "bag_restock_review",

            ...entry,
          }),
        ),

        ...lowStock.map(
          (entry) => ({
            severity:
              "high",

            recommendationType:
              "bag_restock_review",

            ...entry,
          }),
        ),

        ...reorderRequired.map(
          (entry) => ({
            severity:
              "medium",

            recommendationType:
              "bag_stock_monitoring",

            ...entry,
          }),
        ),
      ],

      mayApproveRestock:
        false,

      mayExecutePurchase:
        false,

      evaluatedAt:
        normalizeTimestamp(
          evaluatedAt,
        ),
    },
  });

}