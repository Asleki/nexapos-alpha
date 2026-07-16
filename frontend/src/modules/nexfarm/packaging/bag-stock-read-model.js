/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: bag-stock-read-model.js
 * Layer: NexFarm Packaging / Empty-Bag Stock Read Model
 * NEES: Read Model / Business Module Execution Layer
 * Cycle: Cycle 4 — Inventory-Aware Packaging
 * ==========================================================
 *
 * Responsibility:
 * Define the derived read-model structure and read-only
 * selectors used to represent NexFarm empty-bag inventory.
 *
 * The read model exposes:
 * - Empty-bag stock by approved bag size
 * - Available, reserved, consumed and damaged quantities
 * - Active reservation summaries
 * - Movement history
 * - Damage history
 * - Physical-count differences
 * - Low-stock and reorder indicators
 * - Dashboard summaries
 * - NexVox AI L1 observational summaries
 * - Estate, business-unit and runtime scope
 *
 * This file defines read-model structure and queries only.
 *
 * It does not apply events. Event application belongs to:
 *
 * bag-stock-projection.js
 *
 * Future Integration:
 * - NexFarm employee dashboards may consume operational
 *   stock and alert selectors.
 * - Authorized Administration dashboards may consume
 *   detailed estate-scoped stock summaries.
 * - NexVox AI L1 may observe aggregated stock, damage,
 *   reservation and consumption trends.
 * - Future admin analytics may publish privacy-safe,
 *   aggregated metrics through nexadata.live.
 * - Public projections must never expose reservation IDs,
 *   actor identities, device IDs, evidence references,
 *   transaction-level timestamps or internal movement data.
 *
 * NexVox AI L1 may:
 * - Observe stock levels
 * - Detect sinking stock
 * - Compare consumption and damage trends
 * - Recommend restock review
 * - Prepare dashboard metrics
 *
 * NexVox AI L1 must never:
 * - Reserve bags
 * - Consume bags
 * - Release reservations
 * - Adjust stock
 * - Record physical counts
 * - Approve restocking
 * - Execute purchases
 * - Modify this read model directly
 *
 * Depends On:
 * - packaging-rules.js
 * - bag-stock-engine.js
 *
 * Used By:
 * - bag-stock-projection.js
 * - packaging-feasibility-engine.js
 * - nexfarm-service.js
 * - NexFarm operational dashboards
 * - Temporary Cycle 4 integration tests
 *
 * Must Never:
 * - Create business events
 * - Execute Kernel logic
 * - Publish events
 * - Mutate source events
 * - Mutate an existing read model
 * - Approve inventory movements
 * - Contain supplier or payment information
 */

import {
  DEFAULT_PACKAGING_RULES,
  getAllowedBagSizesKg,
  getBagLowStockThreshold,
  getBagReorderLevel,
  getPackagingRulesVersion,
} from "./packaging-rules.js";

import {
  BagStockStatus,
  BagStockReservationStatus,
} from "./bag-stock-engine.js";

/**
 * ==========================================================
 * Read-Model Identity
 * ==========================================================
 */

export const NEXFARM_BAG_STOCK_READ_MODEL =
  "NEXFARM_BAG_STOCK";

/**
 * ==========================================================
 * Read-Model Schema
 * ==========================================================
 */

export const BAG_STOCK_READ_MODEL_SCHEMA_VERSION =
  "1.0.0";

/**
 * ==========================================================
 * Read-Model Limits
 * ==========================================================
 *
 * The event stream remains the permanent source of truth.
 *
 * These limits only prevent operational read models from
 * growing indefinitely in browser memory.
 */

export const DEFAULT_BAG_STOCK_MOVEMENT_HISTORY_LIMIT =
  500;

export const DEFAULT_BAG_STOCK_DAMAGE_HISTORY_LIMIT =
  250;

export const DEFAULT_BAG_STOCK_COUNT_HISTORY_LIMIT =
  250;

export const DEFAULT_BAG_STOCK_ALERT_HISTORY_LIMIT =
  250;

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

function normalizeText(
  value,
) {

  const normalized =
    String(
      value ??
      "",
    ).trim();

  return normalized || null;

}

function normalizeInteger(
  value,
  minimum = 0,
) {

  const normalized =
    Number(value);

  if (
    !Number.isFinite(
      normalized,
    )
  ) {
    return minimum;
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
    return 0;
  }

  return Math.trunc(
    normalized,
  );

}

function normalizeTimestamp(
  value,
  fallback = null,
) {

  const candidate =
    value ??
    fallback;

  if (!candidate) {
    return null;
  }

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

function normalizeBoolean(
  value,
  fallback = false,
) {

  if (
    value === true ||
    value === false
  ) {
    return value;
  }

  return fallback;

}

function cloneValue(
  value,
) {

  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(
    JSON.stringify(value),
  );

}

function limitHistory(
  history,
  limit,
) {

  const normalizedHistory =
    Array.isArray(history)
      ? history
      : [];

  const normalizedLimit =
    normalizeInteger(
      limit,
      1,
    );

  if (
    normalizedHistory.length <=
    normalizedLimit
  ) {
    return normalizedHistory;
  }

  return normalizedHistory.slice(
    normalizedHistory.length -
    normalizedLimit,
  );

}

function calculateStockStatus({
  availableQuantity,
  reservedQuantity,
  lowStockThreshold,
  reorderLevel,
  enabled,
} = {}) {

  if (enabled !== true) {
    return BagStockStatus.DISABLED;
  }

  if (availableQuantity <= 0) {

    if (reservedQuantity > 0) {
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

function createEmptyStockEntry({
  bagSizeKg,
  rules,
  estateId = null,
  businessUnitId = null,
  runtimeMode = null,
  createdAt = null,
} = {}) {

  const lowStockThreshold =
    getBagLowStockThreshold(
      bagSizeKg,
      rules,
    );

  const reorderLevel =
    getBagReorderLevel(
      bagSizeKg,
      rules,
    );

  return {
    bagSizeKg,

    openingQuantity:
      0,

    receivedQuantity:
      0,

    reservedQuantity:
      0,

    consumedQuantity:
      0,

    releasedQuantity:
      0,

    damagedQuantity:
      0,

    positiveAdjustmentQuantity:
      0,

    negativeAdjustmentQuantity:
      0,

    countedQuantity:
      0,

    countDifferenceQuantity:
      0,

    onHandQuantity:
      0,

    availableQuantity:
      0,

    lowStockThreshold,

    reorderLevel,

    status:
      BagStockStatus
        .OUT_OF_STOCK,

    enabled:
      true,

    stockLocationId:
      null,

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

    lastMovementType:
      null,

    lastMovementId:
      null,

    lastMovementAt:
      null,

    lastCountedAt:
      null,

    createdAt:
      normalizeTimestamp(
        createdAt,
      ),

    lastUpdatedAt:
      normalizeTimestamp(
        createdAt,
      ),
  };

}

function normalizeStockEntry({
  entry,
  bagSizeKg,
  rules,
  estateId = null,
  businessUnitId = null,
  runtimeMode = null,
} = {}) {

  const emptyEntry =
    createEmptyStockEntry({
      bagSizeKg,
      rules,
      estateId,
      businessUnitId,
      runtimeMode,
    });

  const normalizedEntry = {
    ...emptyEntry,
    ...(entry ?? {}),
  };

  normalizedEntry.bagSizeKg =
    Number(
      bagSizeKg,
    );

  normalizedEntry.openingQuantity =
    normalizeInteger(
      normalizedEntry
        .openingQuantity,
    );

  normalizedEntry.receivedQuantity =
    normalizeInteger(
      normalizedEntry
        .receivedQuantity,
    );

  normalizedEntry.reservedQuantity =
    normalizeInteger(
      normalizedEntry
        .reservedQuantity,
    );

  normalizedEntry.consumedQuantity =
    normalizeInteger(
      normalizedEntry
        .consumedQuantity,
    );

  normalizedEntry.releasedQuantity =
    normalizeInteger(
      normalizedEntry
        .releasedQuantity,
    );

  normalizedEntry.damagedQuantity =
    normalizeInteger(
      normalizedEntry
        .damagedQuantity,
    );

  normalizedEntry
    .positiveAdjustmentQuantity =
    normalizeInteger(
      normalizedEntry
        .positiveAdjustmentQuantity,
    );

  normalizedEntry
    .negativeAdjustmentQuantity =
    normalizeInteger(
      normalizedEntry
        .negativeAdjustmentQuantity,
    );

  normalizedEntry.countedQuantity =
    normalizeInteger(
      normalizedEntry
        .countedQuantity,
    );

  normalizedEntry
    .countDifferenceQuantity =
    normalizeSignedInteger(
      normalizedEntry
        .countDifferenceQuantity,
    );

  normalizedEntry.onHandQuantity =
    normalizeInteger(
      normalizedEntry
        .onHandQuantity,
    );

  normalizedEntry.availableQuantity =
    normalizeInteger(
      normalizedEntry
        .availableQuantity,
    );

  normalizedEntry.lowStockThreshold =
    normalizeInteger(
      normalizedEntry
        .lowStockThreshold ??
      getBagLowStockThreshold(
        bagSizeKg,
        rules,
      ),
    );

  normalizedEntry.reorderLevel =
    normalizeInteger(
      normalizedEntry
        .reorderLevel ??
      getBagReorderLevel(
        bagSizeKg,
        rules,
      ),
    );

  normalizedEntry.enabled =
    normalizeBoolean(
      normalizedEntry.enabled,
      true,
    );

  normalizedEntry.status =
    calculateStockStatus({
      availableQuantity:
        normalizedEntry
          .availableQuantity,

      reservedQuantity:
        normalizedEntry
          .reservedQuantity,

      lowStockThreshold:
        normalizedEntry
          .lowStockThreshold,

      reorderLevel:
        normalizedEntry
          .reorderLevel,

      enabled:
        normalizedEntry
          .enabled,
    });

  normalizedEntry.stockLocationId =
    normalizeText(
      normalizedEntry
        .stockLocationId,
    );

  normalizedEntry.estateId =
    normalizeText(
      normalizedEntry
        .estateId ??
      estateId,
    );

  normalizedEntry.businessUnitId =
    normalizeText(
      normalizedEntry
        .businessUnitId ??
      businessUnitId,
    );

  normalizedEntry.runtimeMode =
    normalizeText(
      normalizedEntry
        .runtimeMode ??
      runtimeMode,
    );

  normalizedEntry.lastMovementType =
    normalizeText(
      normalizedEntry
        .lastMovementType,
    );

  normalizedEntry.lastMovementId =
    normalizeText(
      normalizedEntry
        .lastMovementId,
    );

  normalizedEntry.lastMovementAt =
    normalizeTimestamp(
      normalizedEntry
        .lastMovementAt,
    );

  normalizedEntry.lastCountedAt =
    normalizeTimestamp(
      normalizedEntry
        .lastCountedAt,
    );

  normalizedEntry.createdAt =
    normalizeTimestamp(
      normalizedEntry
        .createdAt,
    );

  normalizedEntry.lastUpdatedAt =
    normalizeTimestamp(
      normalizedEntry
        .lastUpdatedAt,
    );

  return normalizedEntry;

}

function createTotals(
  entries = [],
) {

  return entries.reduce(
    (
      totals,
      entry,
    ) => {

      totals.bagSizeCount +=
        1;

      totals.openingQuantity +=
        normalizeInteger(
          entry
            ?.openingQuantity,
        );

      totals.receivedQuantity +=
        normalizeInteger(
          entry
            ?.receivedQuantity,
        );

      totals.reservedQuantity +=
        normalizeInteger(
          entry
            ?.reservedQuantity,
        );

      totals.consumedQuantity +=
        normalizeInteger(
          entry
            ?.consumedQuantity,
        );

      totals.releasedQuantity +=
        normalizeInteger(
          entry
            ?.releasedQuantity,
        );

      totals.damagedQuantity +=
        normalizeInteger(
          entry
            ?.damagedQuantity,
        );

      totals
        .positiveAdjustmentQuantity +=
        normalizeInteger(
          entry
            ?.positiveAdjustmentQuantity,
        );

      totals
        .negativeAdjustmentQuantity +=
        normalizeInteger(
          entry
            ?.negativeAdjustmentQuantity,
        );

      totals.onHandQuantity +=
        normalizeInteger(
          entry
            ?.onHandQuantity,
        );

      totals.availableQuantity +=
        normalizeInteger(
          entry
            ?.availableQuantity,
        );

      if (
        entry?.status ===
        BagStockStatus.LOW
      ) {
        totals.lowStockBagSizeCount +=
          1;
      }

      if (
        entry?.status ===
        BagStockStatus
          .REORDER_REQUIRED
      ) {
        totals
          .reorderRequiredBagSizeCount +=
          1;
      }

      if (
        entry?.status ===
          BagStockStatus
            .OUT_OF_STOCK ||
        entry?.status ===
          BagStockStatus
            .RESERVED_ONLY
      ) {
        totals.outOfStockBagSizeCount +=
          1;
      }

      if (
        entry?.status ===
        BagStockStatus.DISABLED
      ) {
        totals.disabledBagSizeCount +=
          1;
      }

      return totals;

    },
    {
      bagSizeCount:
        0,

      openingQuantity:
        0,

      receivedQuantity:
        0,

      reservedQuantity:
        0,

      consumedQuantity:
        0,

      releasedQuantity:
        0,

      damagedQuantity:
        0,

      positiveAdjustmentQuantity:
        0,

      negativeAdjustmentQuantity:
        0,

      onHandQuantity:
        0,

      availableQuantity:
        0,

      lowStockBagSizeCount:
        0,

      reorderRequiredBagSizeCount:
        0,

      outOfStockBagSizeCount:
        0,

      disabledBagSizeCount:
        0,
    },
  );

}

function createStatusSummary(
  entries = [],
) {

  const summary = {
    available: [],
    lowStock: [],
    reorderRequired: [],
    outOfStock: [],
    reservedOnly: [],
    disabled: [],
    blocked: [],
  };

  entries.forEach(
    (entry) => {

      const item = {
        bagSizeKg:
          entry.bagSizeKg,

        availableQuantity:
          entry.availableQuantity,

        reservedQuantity:
          entry.reservedQuantity,

        damagedQuantity:
          entry.damagedQuantity,

        onHandQuantity:
          entry.onHandQuantity,

        lowStockThreshold:
          entry.lowStockThreshold,

        reorderLevel:
          entry.reorderLevel,

        status:
          entry.status,
      };

      switch (entry.status) {

        case BagStockStatus
          .AVAILABLE:

          summary.available.push(
            item,
          );

          break;

        case BagStockStatus.LOW:

          summary.lowStock.push(
            item,
          );

          break;

        case BagStockStatus
          .REORDER_REQUIRED:

          summary
            .reorderRequired
            .push(
              item,
            );

          break;

        case BagStockStatus
          .OUT_OF_STOCK:

          summary.outOfStock.push(
            item,
          );

          break;

        case BagStockStatus
          .RESERVED_ONLY:

          summary.reservedOnly.push(
            item,
          );

          break;

        case BagStockStatus.DISABLED:

          summary.disabled.push(
            item,
          );

          break;

        case BagStockStatus.BLOCKED:

          summary.blocked.push(
            item,
          );

          break;

        default:

          summary.outOfStock.push(
            item,
          );

      }

    },
  );

  return summary;

}

function createNexVoxSummary({
  entries,
  totals,
  statusSummary,
  reservations,
  movementHistory,
  damageHistory,
  countHistory,
  generatedAt,
} = {}) {

  const totalMovementCount =
    movementHistory.length;

  const totalDamageRecordCount =
    damageHistory.length;

  const totalCountRecordCount =
    countHistory.length;

  const activeReservations =
    Object.values(
      reservations,
    )
      .filter(
        (reservation) =>
          reservation?.status ===
            BagStockReservationStatus
              .ACTIVE ||
          reservation?.status ===
            BagStockReservationStatus
              .PARTIALLY_CONSUMED,
      );

  const sinkingBagSizes =
    entries
      .filter(
        (entry) =>
          entry.status ===
            BagStockStatus.LOW ||
          entry.status ===
            BagStockStatus
              .REORDER_REQUIRED ||
          entry.status ===
            BagStockStatus
              .OUT_OF_STOCK ||
          entry.status ===
            BagStockStatus
              .RESERVED_ONLY,
      )
      .map(
        (entry) => ({
          bagSizeKg:
            entry.bagSizeKg,

          availableQuantity:
            entry.availableQuantity,

          reservedQuantity:
            entry.reservedQuantity,

          lowStockThreshold:
            entry.lowStockThreshold,

          reorderLevel:
            entry.reorderLevel,

          status:
            entry.status,
        }),
      );

  return {
    advisoryOnly:
      true,

    mayReserveStock:
      false,

    mayConsumeStock:
      false,

    mayAdjustStock:
      false,

    mayApproveRestock:
      false,

    mayExecutePurchase:
      false,

    totalAvailableEmptyBags:
      totals.availableQuantity,

    totalOnHandEmptyBags:
      totals.onHandQuantity,

    totalReservedEmptyBags:
      totals.reservedQuantity,

    totalConsumedEmptyBags:
      totals.consumedQuantity,

    totalDamagedEmptyBags:
      totals.damagedQuantity,

    totalActiveReservations:
      activeReservations.length,

    totalMovementCount,

    totalDamageRecordCount,

    totalCountRecordCount,

    lowStockBagSizeCount:
      statusSummary
        .lowStock
        .length,

    reorderRequiredBagSizeCount:
      statusSummary
        .reorderRequired
        .length,

    outOfStockBagSizeCount:
      statusSummary
        .outOfStock
        .length +
      statusSummary
        .reservedOnly
        .length,

    sinkingStockDetected:
      sinkingBagSizes.length >
      0,

    sinkingBagSizes,

    notificationCandidates: [
      ...statusSummary
        .outOfStock
        .map(
          (entry) => ({
            severity:
              "critical",

            recommendationType:
              "bag_restock_review",

            ...entry,
          }),
        ),

      ...statusSummary
        .reservedOnly
        .map(
          (entry) => ({
            severity:
              "critical",

            recommendationType:
              "bag_restock_review",

            ...entry,
          }),
        ),

      ...statusSummary
        .lowStock
        .map(
          (entry) => ({
            severity:
              "high",

            recommendationType:
              "bag_restock_review",

            ...entry,
          }),
        ),

      ...statusSummary
        .reorderRequired
        .map(
          (entry) => ({
            severity:
              "medium",

            recommendationType:
              "bag_stock_monitoring",

            ...entry,
          }),
        ),
    ],

    generatedAt:
      normalizeTimestamp(
        generatedAt,
      ),
  };

}

/**
 * ==========================================================
 * Empty Read-Model Creation
 * ==========================================================
 */

/**
 * Create one empty, fully structured bag-stock read model.
 *
 * This is the initial state supplied to updateReadModel().
 */
export function createEmptyBagStockReadModel({
  estateId = null,
  businessUnitId = "NEXFARM",
  runtimeMode = null,
  stockLocationId = null,
  rules = DEFAULT_PACKAGING_RULES,
  createdAt =
    new Date().toISOString(),
} = {}) {

  const supportedBagSizes =
    getAllowedBagSizesKg(
      rules,
    );

  const normalizedCreatedAt =
    normalizeTimestamp(
      createdAt,
      new Date().toISOString(),
    );

  const stockByBagSizeKg = {};

  supportedBagSizes.forEach(
    (bagSizeKg) => {

      stockByBagSizeKg[
        bagSizeKg
      ] =
        createEmptyStockEntry({
          bagSizeKg,
          rules,
          estateId,
          businessUnitId,
          runtimeMode,
          createdAt:
            normalizedCreatedAt,
        });

      stockByBagSizeKg[
        bagSizeKg
      ].stockLocationId =
        normalizeText(
          stockLocationId,
        );

    },
  );

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

  const totals =
    createTotals(
      entries,
    );

  const statusSummary =
    createStatusSummary(
      entries,
    );

  const readModel = {
    readModelName:
      NEXFARM_BAG_STOCK_READ_MODEL,

    schemaVersion:
      BAG_STOCK_READ_MODEL_SCHEMA_VERSION,

    rulesVersion:
      getPackagingRulesVersion(
        rules,
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

    stockLocationId:
      normalizeText(
        stockLocationId,
      ),

    stockByBagSizeKg,

    reservationsById: {},

    activeReservationIds: [],

    movementHistory: [],

    damageHistory: [],

    countHistory: [],

    adjustmentHistory: [],

    alertHistory: [],

    processedEventIds: [],

    totals,

    statusSummary,

    alerts: {
      lowStockDetected:
        false,

      reorderRequiredDetected:
        false,

      outOfStockDetected:
        entries.length > 0,

      damagedStockDetected:
        false,

      unexplainedCountDifferenceDetected:
        false,

      activeAlertCount:
        entries.length,

      lastEvaluatedAt:
        normalizedCreatedAt,
    },

    nexVoxObservation:
      createNexVoxSummary({
        entries,
        totals,
        statusSummary,
        reservations: {},
        movementHistory: [],
        damageHistory: [],
        countHistory: [],
        generatedAt:
          normalizedCreatedAt,
      }),

    createdAt:
      normalizedCreatedAt,

    lastMovementAt:
      null,

    lastProjectedEventId:
      null,

    lastProjectedEventType:
      null,

    lastUpdatedAt:
      normalizedCreatedAt,
  };

  return deepFreeze(
    readModel,
  );

}

/**
 * ==========================================================
 * Read-Model Normalization
 * ==========================================================
 */

/**
 * Normalize an existing read model while preserving its
 * immutable event-derived state.
 *
 * This is useful for:
 * - Projection initialization
 * - Replay compatibility
 * - Schema-safe test fixtures
 * - Future migrations
 */
export function normalizeBagStockReadModel({
  readModel,
  rules =
    DEFAULT_PACKAGING_RULES,
} = {}) {

  const sourceModel =
    readModel &&
    typeof readModel ===
      "object" &&
    !Array.isArray(
      readModel,
    )
      ? cloneValue(
          readModel,
        )
      : {};

  const baseModel =
    createEmptyBagStockReadModel({
      estateId:
        sourceModel
          ?.estateId,

      businessUnitId:
        sourceModel
          ?.businessUnitId ??
        "NEXFARM",

      runtimeMode:
        sourceModel
          ?.runtimeMode,

      stockLocationId:
        sourceModel
          ?.stockLocationId,

      rules,

      createdAt:
        sourceModel
          ?.createdAt ??
        new Date().toISOString(),
    });

  const normalizedModel = {
    ...cloneValue(
      baseModel,
    ),
    ...sourceModel,
  };

  const stockByBagSizeKg = {};

  getAllowedBagSizesKg(
    rules,
  ).forEach(
    (bagSizeKg) => {

      stockByBagSizeKg[
        bagSizeKg
      ] =
        normalizeStockEntry({
          entry:
            sourceModel
              ?.stockByBagSizeKg
              ?.[bagSizeKg],

          bagSizeKg,

          rules,

          estateId:
            normalizedModel
              .estateId,

          businessUnitId:
            normalizedModel
              .businessUnitId,

          runtimeMode:
            normalizedModel
              .runtimeMode,
        });

    },
  );

  normalizedModel.stockByBagSizeKg =
    stockByBagSizeKg;

  normalizedModel.reservationsById =
    sourceModel
      ?.reservationsById &&
    typeof sourceModel
      .reservationsById ===
      "object" &&
    !Array.isArray(
      sourceModel
        .reservationsById,
    )
      ? sourceModel
          .reservationsById
      : {};

  normalizedModel.activeReservationIds =
    Array.isArray(
      sourceModel
        ?.activeReservationIds,
    )
      ? [
          ...new Set(
            sourceModel
              .activeReservationIds
              .filter(Boolean),
          ),
        ]
      : [];

  normalizedModel.movementHistory =
    limitHistory(
      sourceModel
        ?.movementHistory,
      DEFAULT_BAG_STOCK_MOVEMENT_HISTORY_LIMIT,
    );

  normalizedModel.damageHistory =
    limitHistory(
      sourceModel
        ?.damageHistory,
      DEFAULT_BAG_STOCK_DAMAGE_HISTORY_LIMIT,
    );

  normalizedModel.countHistory =
    limitHistory(
      sourceModel
        ?.countHistory,
      DEFAULT_BAG_STOCK_COUNT_HISTORY_LIMIT,
    );

  normalizedModel.adjustmentHistory =
    limitHistory(
      sourceModel
        ?.adjustmentHistory,
      DEFAULT_BAG_STOCK_COUNT_HISTORY_LIMIT,
    );

  normalizedModel.alertHistory =
    limitHistory(
      sourceModel
        ?.alertHistory,
      DEFAULT_BAG_STOCK_ALERT_HISTORY_LIMIT,
    );

  normalizedModel.processedEventIds =
    Array.isArray(
      sourceModel
        ?.processedEventIds,
    )
      ? [
          ...new Set(
            sourceModel
              .processedEventIds
              .filter(Boolean),
          ),
        ]
      : [];

  return rebuildBagStockReadModel({
    readModel:
      normalizedModel,

    rules,
  });

}

/**
 * ==========================================================
 * Derived State Rebuild
 * ==========================================================
 */

/**
 * Recalculate totals, status groups, alerts and NexVox
 * observation summaries after a projection update.
 *
 * This function returns a new immutable read model.
 */
export function rebuildBagStockReadModel({
  readModel,
  rules =
    DEFAULT_PACKAGING_RULES,
  updatedAt =
    new Date().toISOString(),
} = {}) {

  const sourceModel =
    readModel &&
    typeof readModel ===
      "object"
      ? cloneValue(
          readModel,
        )
      : cloneValue(
          createEmptyBagStockReadModel({
            rules,
          }),
        );

  const stockByBagSizeKg = {};

  getAllowedBagSizesKg(
    rules,
  ).forEach(
    (bagSizeKg) => {

      stockByBagSizeKg[
        bagSizeKg
      ] =
        normalizeStockEntry({
          entry:
            sourceModel
              ?.stockByBagSizeKg
              ?.[bagSizeKg],

          bagSizeKg,

          rules,

          estateId:
            sourceModel
              ?.estateId,

          businessUnitId:
            sourceModel
              ?.businessUnitId,

          runtimeMode:
            sourceModel
              ?.runtimeMode,
        });

    },
  );

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

  const totals =
    createTotals(
      entries,
    );

  const statusSummary =
    createStatusSummary(
      entries,
    );

  const damageHistory =
    limitHistory(
      sourceModel
        ?.damageHistory,
      DEFAULT_BAG_STOCK_DAMAGE_HISTORY_LIMIT,
    );

  const countHistory =
    limitHistory(
      sourceModel
        ?.countHistory,
      DEFAULT_BAG_STOCK_COUNT_HISTORY_LIMIT,
    );

  const movementHistory =
    limitHistory(
      sourceModel
        ?.movementHistory,
      DEFAULT_BAG_STOCK_MOVEMENT_HISTORY_LIMIT,
    );

  const adjustmentHistory =
    limitHistory(
      sourceModel
        ?.adjustmentHistory,
      DEFAULT_BAG_STOCK_COUNT_HISTORY_LIMIT,
    );

  const alertHistory =
    limitHistory(
      sourceModel
        ?.alertHistory,
      DEFAULT_BAG_STOCK_ALERT_HISTORY_LIMIT,
    );

  const unexplainedCountDifferenceDetected =
    countHistory.some(
      (countRecord) =>
        Number(
          countRecord
            ?.differenceQuantity,
        ) < 0 &&
        countRecord
          ?.resolved !==
        true,
    );

  const damagedStockDetected =
    totals.damagedQuantity >
    0;

  const activeAlertCount =
    statusSummary.lowStock.length +
    statusSummary
      .reorderRequired
      .length +
    statusSummary
      .outOfStock
      .length +
    statusSummary
      .reservedOnly
      .length +
    (
      damagedStockDetected
        ? 1
        : 0
    ) +
    (
      unexplainedCountDifferenceDetected
        ? 1
        : 0
    );

  const normalizedUpdatedAt =
    normalizeTimestamp(
      updatedAt,
      new Date().toISOString(),
    );

  const rebuiltModel = {
    ...sourceModel,

    readModelName:
      NEXFARM_BAG_STOCK_READ_MODEL,

    schemaVersion:
      BAG_STOCK_READ_MODEL_SCHEMA_VERSION,

    rulesVersion:
      getPackagingRulesVersion(
        rules,
      ),

    stockByBagSizeKg,

    movementHistory,

    damageHistory,

    countHistory,

    adjustmentHistory,

    alertHistory,

    totals,

    statusSummary,

    alerts: {
      lowStockDetected:
        statusSummary
          .lowStock
          .length > 0,

      reorderRequiredDetected:
        statusSummary
          .reorderRequired
          .length > 0,

      outOfStockDetected:
        (
          statusSummary
            .outOfStock
            .length +
          statusSummary
            .reservedOnly
            .length
        ) > 0,

      damagedStockDetected,

      unexplainedCountDifferenceDetected,

      activeAlertCount,

      lastEvaluatedAt:
        normalizedUpdatedAt,
    },

    nexVoxObservation:
      createNexVoxSummary({
        entries,
        totals,
        statusSummary,

        reservations:
          sourceModel
            ?.reservationsById ??
          {},

        movementHistory,
        damageHistory,
        countHistory,

        generatedAt:
          normalizedUpdatedAt,
      }),

    lastUpdatedAt:
      normalizedUpdatedAt,
  };

  return deepFreeze(
    rebuiltModel,
  );

}

/**
 * ==========================================================
 * Core Selectors
 * ==========================================================
 */

export function getBagStockEntry(
  readModel,
  bagSizeKg,
) {

  const normalizedBagSizeKg =
    Number(
      bagSizeKg,
    );

  return (
    readModel
      ?.stockByBagSizeKg
      ?.[normalizedBagSizeKg] ??
    null
  );

}

export function getBagStockEntries(
  readModel,
) {

  return Object.values(
    readModel
      ?.stockByBagSizeKg ??
    {},
  )
    .sort(
      (
        firstEntry,
        secondEntry,
      ) =>
        secondEntry.bagSizeKg -
        firstEntry.bagSizeKg,
    );

}

export function getBagStockTotals(
  readModel,
) {

  return (
    readModel?.totals ??
    createTotals(
      getBagStockEntries(
        readModel,
      ),
    )
  );

}

export function getAvailableBagQuantity(
  readModel,
  bagSizeKg,
) {

  return normalizeInteger(
    getBagStockEntry(
      readModel,
      bagSizeKg,
    )?.availableQuantity,
  );

}

export function getReservedBagQuantity(
  readModel,
  bagSizeKg,
) {

  return normalizeInteger(
    getBagStockEntry(
      readModel,
      bagSizeKg,
    )?.reservedQuantity,
  );

}

export function getConsumedBagQuantity(
  readModel,
  bagSizeKg,
) {

  return normalizeInteger(
    getBagStockEntry(
      readModel,
      bagSizeKg,
    )?.consumedQuantity,
  );

}

export function getDamagedBagQuantity(
  readModel,
  bagSizeKg,
) {

  return normalizeInteger(
    getBagStockEntry(
      readModel,
      bagSizeKg,
    )?.damagedQuantity,
  );

}

export function hasAvailableBagStock(
  readModel,
  bagSizeKg,
  requiredQuantity = 1,
) {

  const normalizedRequiredQuantity =
    normalizeInteger(
      requiredQuantity,
      1,
    );

  return (
    getAvailableBagQuantity(
      readModel,
      bagSizeKg,
    ) >=
    normalizedRequiredQuantity
  );

}
/**
 * ==========================================================
 * Status Selectors
 * ==========================================================
 */

export function getLowBagStockEntries(
  readModel,
) {

  return [
    ...(
      readModel
        ?.statusSummary
        ?.lowStock ??
      []
    ),
  ];

}

export function getBagReorderCandidates(
  readModel,
) {

  return [
    ...(
      readModel
        ?.statusSummary
        ?.reorderRequired ??
      []
    ),
  ];

}

export function getOutOfStockBagEntries(
  readModel,
) {

  return [
    ...(
      readModel
        ?.statusSummary
        ?.outOfStock ??
      []
    ),

    ...(
      readModel
        ?.statusSummary
        ?.reservedOnly ??
      []
    ),
  ];

}

export function getSinkingBagStockEntries(
  readModel,
) {

  const entries = [
    ...getOutOfStockBagEntries(
      readModel,
    ),

    ...getLowBagStockEntries(
      readModel,
    ),

    ...getBagReorderCandidates(
      readModel,
    ),
  ];

  const uniqueByBagSize =
    new Map();

  entries.forEach(
    (entry) => {

      uniqueByBagSize.set(
        entry.bagSizeKg,
        entry,
      );

    },
  );

  return Array.from(
    uniqueByBagSize.values(),
  )
    .sort(
      (
        firstEntry,
        secondEntry,
      ) =>
        secondEntry.bagSizeKg -
        firstEntry.bagSizeKg,
    );

}

export function isBagStockLow(
  readModel,
  bagSizeKg,
) {

  const entry =
    getBagStockEntry(
      readModel,
      bagSizeKg,
    );

  return (
    entry?.status ===
      BagStockStatus.LOW ||
    entry?.status ===
      BagStockStatus
        .REORDER_REQUIRED ||
    entry?.status ===
      BagStockStatus
        .OUT_OF_STOCK ||
    entry?.status ===
      BagStockStatus
        .RESERVED_ONLY
  );

}

/**
 * ==========================================================
 * Reservation Selectors
 * ==========================================================
 */

export function getBagStockReservation(
  readModel,
  reservationId,
) {

  const normalizedReservationId =
    normalizeText(
      reservationId,
    );

  if (!normalizedReservationId) {
    return null;
  }

  return (
    readModel
      ?.reservationsById
      ?.[normalizedReservationId] ??
    null
  );

}

export function getAllBagStockReservations(
  readModel,
) {

  return Object.values(
    readModel
      ?.reservationsById ??
    {},
  );

}

export function getActiveBagStockReservations(
  readModel,
) {

  return getAllBagStockReservations(
    readModel,
  )
    .filter(
      (reservation) =>
        reservation?.status ===
          BagStockReservationStatus
            .ACTIVE ||
        reservation?.status ===
          BagStockReservationStatus
            .PARTIALLY_CONSUMED,
    );

}

export function getReservationsForPlan(
  readModel,
  planId,
) {

  const normalizedPlanId =
    normalizeText(
      planId,
    );

  if (!normalizedPlanId) {
    return [];
  }

  return getAllBagStockReservations(
    readModel,
  )
    .filter(
      (reservation) =>
        reservation?.planId ===
        normalizedPlanId,
    );

}

export function getReservationsForIntake(
  readModel,
  intakeId,
) {

  const normalizedIntakeId =
    normalizeText(
      intakeId,
    );

  if (!normalizedIntakeId) {
    return [];
  }

  return getAllBagStockReservations(
    readModel,
  )
    .filter(
      (reservation) =>
        reservation?.intakeId ===
        normalizedIntakeId,
    );

}

/**
 * ==========================================================
 * History Selectors
 * ==========================================================
 */

export function getBagStockMovementHistory(
  readModel,
) {

  return [
    ...(
      readModel
        ?.movementHistory ??
      []
    ),
  ];

}

export function getBagStockDamageHistory(
  readModel,
) {

  return [
    ...(
      readModel
        ?.damageHistory ??
      []
    ),
  ];

}

export function getBagStockCountHistory(
  readModel,
) {

  return [
    ...(
      readModel
        ?.countHistory ??
      []
    ),
  ];

}

export function getBagStockAdjustmentHistory(
  readModel,
) {

  return [
    ...(
      readModel
        ?.adjustmentHistory ??
      []
    ),
  ];

}

export function getBagStockAlertHistory(
  readModel,
) {

  return [
    ...(
      readModel
        ?.alertHistory ??
      []
    ),
  ];

}

/**
 * ==========================================================
 * Dashboard Selectors
 * ==========================================================
 */

/**
 * Build an employee-facing operational dashboard summary.
 *
 * This summary intentionally excludes:
 * - Actor identity
 * - Device identity
 * - Evidence references
 * - Internal approval references
 * - Finance information
 */
export function createBagStockEmployeeDashboard(
  readModel,
) {

  const entries =
    getBagStockEntries(
      readModel,
    );

  const totals =
    getBagStockTotals(
      readModel,
    );

  return deepFreeze({
    estateId:
      readModel?.estateId ??
      null,

    businessUnitId:
      readModel
        ?.businessUnitId ??
      null,

    runtimeMode:
      readModel?.runtimeMode ??
      null,

    stockByBagSize:
      entries.map(
        (entry) => ({
          bagSizeKg:
            entry.bagSizeKg,

          availableQuantity:
            entry
              .availableQuantity,

          reservedQuantity:
            entry
              .reservedQuantity,

          onHandQuantity:
            entry
              .onHandQuantity,

          status:
            entry.status,
        }),
      ),

    totals: {
      availableQuantity:
        totals.availableQuantity,

      reservedQuantity:
        totals.reservedQuantity,

      onHandQuantity:
        totals.onHandQuantity,
    },

    alerts: {
      lowStockDetected:
        readModel
          ?.alerts
          ?.lowStockDetected ??
        false,

      reorderRequiredDetected:
        readModel
          ?.alerts
          ?.reorderRequiredDetected ??
        false,

      outOfStockDetected:
        readModel
          ?.alerts
          ?.outOfStockDetected ??
        false,

      activeAlertCount:
        readModel
          ?.alerts
          ?.activeAlertCount ??
        0,
    },

    lastUpdatedAt:
      readModel
        ?.lastUpdatedAt ??
      null,
  });

}

/**
 * Build an authorized admin-facing summary.
 *
 * This remains operationally detailed but does not expose
 * supplier, payment or QR information because such data does
 * not belong to the empty-bag stock model.
 */
export function createBagStockAdminDashboard(
  readModel,
) {

  const entries =
    getBagStockEntries(
      readModel,
    );

  return deepFreeze({
    readModelName:
      readModel
        ?.readModelName ??
      NEXFARM_BAG_STOCK_READ_MODEL,

    schemaVersion:
      readModel
        ?.schemaVersion ??
      BAG_STOCK_READ_MODEL_SCHEMA_VERSION,

    rulesVersion:
      readModel
        ?.rulesVersion ??
      null,

    estateId:
      readModel?.estateId ??
      null,

    businessUnitId:
      readModel
        ?.businessUnitId ??
      null,

    runtimeMode:
      readModel?.runtimeMode ??
      null,

    stockLocationId:
      readModel
        ?.stockLocationId ??
      null,

    stockByBagSize:
      entries,

    totals:
      getBagStockTotals(
        readModel,
      ),

    statusSummary:
      cloneValue(
        readModel
          ?.statusSummary ??
        {},
      ),

    alerts:
      cloneValue(
        readModel?.alerts ??
        {},
      ),

    activeReservations:
      getActiveBagStockReservations(
        readModel,
      ),

    recentMovements:
      getBagStockMovementHistory(
        readModel,
      ).slice(-25),

    recentDamageRecords:
      getBagStockDamageHistory(
        readModel,
      ).slice(-25),

    recentCountRecords:
      getBagStockCountHistory(
        readModel,
      ).slice(-25),

    nexVoxObservation:
      cloneValue(
        readModel
          ?.nexVoxObservation ??
        {},
      ),

    lastMovementAt:
      readModel
        ?.lastMovementAt ??
      null,

    lastUpdatedAt:
      readModel
        ?.lastUpdatedAt ??
      null,
  });

}

/**
 * ==========================================================
 * Privacy-Safe Analytics Selector
 * ==========================================================
 */

/**
 * Build a privacy-safe aggregate that may later feed a
 * secured admin analytics projection.
 *
 * This is not yet the public nexadata.live projection.
 */
export function createBagStockAnalyticsSummary(
  readModel,
) {

  const entries =
    getBagStockEntries(
      readModel,
    );

  const totals =
    getBagStockTotals(
      readModel,
    );

  return deepFreeze({
    estateId:
      readModel?.estateId ??
      null,

    businessUnitId:
      readModel
        ?.businessUnitId ??
      null,

    runtimeMode:
      readModel?.runtimeMode ??
      null,

    metricType:
      "empty_bag_inventory",

    quantitiesByBagSizeKg:
      entries.reduce(
        (
          result,
          entry,
        ) => {

          result[
            entry.bagSizeKg
          ] = {
            availableQuantity:
              entry
                .availableQuantity,

            reservedQuantity:
              entry
                .reservedQuantity,

            consumedQuantity:
              entry
                .consumedQuantity,

            damagedQuantity:
              entry
                .damagedQuantity,

            onHandQuantity:
              entry
                .onHandQuantity,

            status:
              entry.status,
          };

          return result;

        },
        {},
      ),

    totals: {
      availableQuantity:
        totals.availableQuantity,

      reservedQuantity:
        totals.reservedQuantity,

      consumedQuantity:
        totals.consumedQuantity,

      damagedQuantity:
        totals.damagedQuantity,

      onHandQuantity:
        totals.onHandQuantity,
    },

    lowStockBagSizeCount:
      totals
        .lowStockBagSizeCount,

    reorderRequiredBagSizeCount:
      totals
        .reorderRequiredBagSizeCount,

    outOfStockBagSizeCount:
      totals
        .outOfStockBagSizeCount,

    generatedAt:
      readModel
        ?.lastUpdatedAt ??
      null,
  });

}

/**
 * ==========================================================
 * Public Projection Preparation
 * ==========================================================
 */

/**
 * Build a highly restricted aggregate suitable only as an
 * input to a future public-metrics projection.
 *
 * It intentionally excludes:
 * - Estate-specific stock locations
 * - Reservation information
 * - Movement history
 * - Damage reasons
 * - Count discrepancies
 * - Actors and devices
 * - Event IDs
 * - Exact movement timestamps
 *
 * Publication policy, aggregation across estates, delay,
 * anonymization and access control remain future work.
 */
export function createPublicBagStockMetricPreparation(
  readModel,
) {

  const totals =
    getBagStockTotals(
      readModel,
    );

  return deepFreeze({
    metricType:
      "packaging_material_capacity",

    totalAvailablePackagingUnits:
      totals.availableQuantity,

    totalPackagingUnitsInUse:
      totals.consumedQuantity,

    overallAvailabilityStatus:
      readModel
        ?.alerts
        ?.outOfStockDetected ===
      true
        ? "constrained"
        : readModel
            ?.alerts
            ?.lowStockDetected ===
          true
          ? "limited"
          : "available",

    containsDirectIdentifiers:
      false,

    containsQrValues:
      false,

    containsSupplierDetails:
      false,

    containsPaymentDetails:
      false,

    containsExactLocations:
      false,

    requiresFurtherAggregation:
      true,

    requiresPublicationApproval:
      true,
  });

}
