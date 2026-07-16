/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: bag-stock-projection.js
 * Layer: NexFarm Packaging / Empty-Bag Stock Projection
 * NEES: Read Model / Business Module Execution Layer
 * Cycle: Cycle 4 — Inventory-Aware Packaging
 * ==========================================================
 *
 * Responsibility:
 * Project immutable NexFarm empty-bag stock events into the
 * derived NexFarm bag-stock read model.
 *
 * This projection derives:
 * - Opening empty-bag balances
 * - Empty bags received
 * - Empty bags reserved for packaging plans
 * - Reserved bags consumed after successful bag creation
 * - Reservations released after failure or cancellation
 * - Damaged empty bags
 * - Physical stock counts
 * - Authorized stock adjustments
 * - Low-stock alerts
 * - Reservation states
 * - Movement, damage, count, adjustment and alert histories
 * - Stock totals and sinking-stock indicators
 * - NexVox AI L1 observational summaries
 *
 * Event flow:
 *
 * BAG_STOCK_OPENING_RECORDED
 * ↓
 * BAG_STOCK_RECEIVED
 * ↓
 * BAG_STOCK_RESERVED
 * ↓
 * BAG_CREATED
 * ↓
 * BAG_STOCK_CONSUMED
 *
 * Failure or cancellation:
 *
 * BAG_STOCK_RESERVED
 * ↓
 * BAG_STOCK_RELEASED
 *
 * Damage:
 *
 * BAG_STOCK_DAMAGED
 * ↓
 * Usable stock reduced
 * ↓
 * Damage remains permanently traceable
 *
 * Source of Truth:
 * - Immutable events remain the source of truth.
 * - This read model is derived and may be rebuilt by replay.
 *
 * Future Integration:
 * - NexFarm employee dashboards may consume operational
 *   bag-stock balances and warnings.
 * - Authorized Administration dashboards may consume
 *   detailed estate-scoped movement and damage summaries.
 * - NexVox AI L1 may observe stock depletion, damage rates,
 *   reservation pressure and restock indicators.
 * - Future nexadata.live public projections must consume
 *   separate anonymized and aggregated metrics only.
 *
 * NexVox AI L1 must never:
 * - Create bag-stock events
 * - Reserve empty bags
 * - Consume empty bags
 * - Release reservations
 * - Record damage
 * - Adjust inventory
 * - Approve restocking
 * - Execute purchases
 *
 * Depends On:
 * - bag-stock-read-model.js
 * - bag-stock-engine.js
 * - packaging-rules.js
 *
 * Used By:
 * - read-model-engine.js
 * - nexfarm-bootstrap.js
 * - packaging-feasibility-engine.js
 * - NexFarm dashboards
 * - Temporary Cycle 4 integration tests
 *
 * Must Never:
 * - Modify source events
 * - Execute Kernel logic
 * - Publish events
 * - Synchronize events
 * - Store source events
 * - Approve inventory movements
 * - Permit negative bag stock
 * - Mix estate or runtime scopes
 */

/**
 * ==========================================================
 * Dependencies
 * ==========================================================
 */

import {
  DEFAULT_PACKAGING_RULES,
  getAllowedBagSizesKg,
  getPackagingRulesVersion,
  isSupportedBagSizeKg,
} from "./packaging-rules.js";

import {
  BagStockMovementType,
  BagStockStatus,
  BagStockReservationStatus,
} from "./bag-stock-engine.js";

import {
  NEXFARM_BAG_STOCK_READ_MODEL,
  createEmptyBagStockReadModel,
  normalizeBagStockReadModel,
  rebuildBagStockReadModel,
  DEFAULT_BAG_STOCK_MOVEMENT_HISTORY_LIMIT,
  DEFAULT_BAG_STOCK_DAMAGE_HISTORY_LIMIT,
  DEFAULT_BAG_STOCK_COUNT_HISTORY_LIMIT,
  DEFAULT_BAG_STOCK_ALERT_HISTORY_LIMIT,
} from "./bag-stock-read-model.js";

/**
 * ==========================================================
 * Projection Identity
 * ==========================================================
 */

export const NEXFARM_BAG_STOCK_PROJECTION =
  "NEXFARM_BAG_STOCK_PROJECTION";

/**
 * ==========================================================
 * Supported Bag-Stock Events
 * ==========================================================
 *
 * These stable names are intentionally declared locally.
 *
 * nexfarm-events.js will later expose the same names through
 * NexFarmEventType and corresponding event creators.
 */

export const BagStockProjectionEventType =
  Object.freeze({

    BAG_STOCK_OPENING_RECORDED:
      "BAG_STOCK_OPENING_RECORDED",

    BAG_STOCK_RECEIVED:
      "BAG_STOCK_RECEIVED",

    BAG_STOCK_RESERVED:
      "BAG_STOCK_RESERVED",

    BAG_STOCK_CONSUMED:
      "BAG_STOCK_CONSUMED",

    BAG_STOCK_RELEASED:
      "BAG_STOCK_RELEASED",

    BAG_STOCK_DAMAGED:
      "BAG_STOCK_DAMAGED",

    BAG_STOCK_ADJUSTED:
      "BAG_STOCK_ADJUSTED",

    BAG_STOCK_COUNTED:
      "BAG_STOCK_COUNTED",

    BAG_STOCK_LOW_DETECTED:
      "BAG_STOCK_LOW_DETECTED",

  });

const SUPPORTED_EVENT_TYPES =
  new Set(
    Object.values(
      BagStockProjectionEventType,
    ),
  );

/**
 * ==========================================================
 * Internal Utilities
 * ==========================================================
 */

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
  fallback =
    new Date().toISOString(),
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

function appendHistory(
  history,
  record,
  limit,
) {

  return limitHistory(
    [
      ...(
        Array.isArray(history)
          ? history
          : []
      ),
      record,
    ],
    limit,
  );

}

function resolveEventId(
  event,
) {

  return normalizeText(
    event?.eventId ??
    event?.id ??
    event?.metadata?.eventId,
  );

}

function resolveEventType(
  event,
) {

  return normalizeText(
    event?.eventType ??
    event?.type,
  );

}

function resolveEventTimestamp(
  event,
) {

  return normalizeTimestamp(
    event?.timestamp ??
    event?.occurredAt ??
    event?.createdAt ??
    event?.metadata?.timestamp,
  );

}

function resolveEventPayload(
  event,
) {

  if (
    event?.payload &&
    typeof event.payload ===
      "object" &&
    !Array.isArray(
      event.payload,
    )
  ) {
    return event.payload;
  }

  return {};

}

function resolveEventContext(
  event,
) {

  if (
    event?.context &&
    typeof event.context ===
      "object" &&
    !Array.isArray(
      event.context,
    )
  ) {
    return event.context;
  }

  return {};

}

function resolveContextIdentityId(
  context,
) {

  return normalizeText(
    context?.identity?.identityId ??
    context?.identityId ??
    context?.actorId,
  );

}

function resolveContextActorType(
  context,
) {

  return normalizeText(
    context?.identity?.actorType ??
    context?.actorType,
  );

}

function createActorSummary(
  context,
) {

  return {
    identityId:
      resolveContextIdentityId(
        context,
      ),

    actorType:
      resolveContextActorType(
        context,
      ),
  };

}

function createScopeSummary(
  context,
  readModel,
) {

  return {
    estateId:
      normalizeText(
        context?.estateId ??
        readModel?.estateId,
      ),

    businessUnitId:
      normalizeText(
        context?.businessUnitId ??
        readModel?.businessUnitId,
      ),

    runtimeMode:
      normalizeText(
        context?.runtimeMode ??
        readModel?.runtimeMode,
      ),

    deviceId:
      normalizeText(
        context?.deviceId,
      ),
  };

}

function isScopeCompatible({
  readModel,
  context,
} = {}) {

  const scopeFields = [
    "estateId",
    "businessUnitId",
    "runtimeMode",
  ];

  return scopeFields.every(
    (field) => {

      const existingValue =
        normalizeText(
          readModel?.[field],
        );

      const eventValue =
        normalizeText(
          context?.[field],
        );

      if (
        !existingValue ||
        !eventValue
      ) {
        return true;
      }

      return (
        existingValue ===
        eventValue
      );

    },
  );

}

function hasProcessedEvent(
  readModel,
  eventId,
) {

  if (!eventId) {
    return false;
  }

  return (
    Array.isArray(
      readModel
        ?.processedEventIds,
    ) &&
    readModel
      .processedEventIds
      .includes(
        eventId,
      )
  );

}

function markEventProcessed(
  readModel,
  eventId,
) {

  if (!eventId) {
    return;
  }

  const processedEventIds =
    Array.isArray(
      readModel
        ?.processedEventIds,
    )
      ? readModel
          .processedEventIds
      : [];

  if (
    processedEventIds.includes(
      eventId,
    )
  ) {
    return;
  }

  readModel.processedEventIds = [
    ...processedEventIds,
    eventId,
  ];

}

function ensureStockEntry({
  readModel,
  bagSizeKg,
  rules,
} = {}) {

  const normalizedBagSizeKg =
    Number(
      bagSizeKg,
    );

  if (
    readModel
      ?.stockByBagSizeKg
      ?.[normalizedBagSizeKg]
  ) {
    return readModel
      .stockByBagSizeKg[
        normalizedBagSizeKg
      ];
  }

  const temporaryModel =
    createEmptyBagStockReadModel({
      estateId:
        readModel?.estateId,

      businessUnitId:
        readModel
          ?.businessUnitId,

      runtimeMode:
        readModel?.runtimeMode,

      stockLocationId:
        readModel
          ?.stockLocationId,

      rules,
    });

  const emptyEntry =
    temporaryModel
      ?.stockByBagSizeKg
      ?.[normalizedBagSizeKg];

  if (!emptyEntry) {
    return null;
  }

  readModel.stockByBagSizeKg[
    normalizedBagSizeKg
  ] =
    cloneValue(
      emptyEntry,
    );

  return readModel
    .stockByBagSizeKg[
      normalizedBagSizeKg
    ];

}

function resolveStockStatus(
  entry,
) {

  if (entry?.enabled === false) {
    return BagStockStatus.DISABLED;
  }

  const availableQuantity =
    normalizeInteger(
      entry?.availableQuantity,
    );

  const reservedQuantity =
    normalizeInteger(
      entry?.reservedQuantity,
    );

  const lowStockThreshold =
    normalizeInteger(
      entry?.lowStockThreshold,
    );

  const reorderLevel =
    normalizeInteger(
      entry?.reorderLevel,
    );

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

function refreshStockEntry({
  entry,
  eventId,
  movementType,
  occurredAt,
} = {}) {

  entry.openingQuantity =
    normalizeInteger(
      entry.openingQuantity,
    );

  entry.receivedQuantity =
    normalizeInteger(
      entry.receivedQuantity,
    );

  entry.reservedQuantity =
    normalizeInteger(
      entry.reservedQuantity,
    );

  entry.consumedQuantity =
    normalizeInteger(
      entry.consumedQuantity,
    );

  entry.releasedQuantity =
    normalizeInteger(
      entry.releasedQuantity,
    );

  entry.damagedQuantity =
    normalizeInteger(
      entry.damagedQuantity,
    );

  entry.positiveAdjustmentQuantity =
    normalizeInteger(
      entry
        .positiveAdjustmentQuantity,
    );

  entry.negativeAdjustmentQuantity =
    normalizeInteger(
      entry
        .negativeAdjustmentQuantity,
    );

  entry.onHandQuantity =
    normalizeInteger(
      entry.onHandQuantity,
    );

  entry.availableQuantity =
    normalizeInteger(
      entry.availableQuantity,
    );

  entry.status =
    resolveStockStatus(
      entry,
    );

  entry.lastMovementType =
    movementType;

  entry.lastMovementId =
    eventId;

  entry.lastMovementAt =
    occurredAt;

  entry.lastUpdatedAt =
    occurredAt;

}

function createMovementRecord({
  event,
  readModel,
  movementType,
  bagSizeKg,
  quantity,
  before = {},
  after = {},
  payload = {},
} = {}) {

  const eventId =
    resolveEventId(
      event,
    );

  const eventType =
    resolveEventType(
      event,
    );

  const occurredAt =
    resolveEventTimestamp(
      event,
    );

  const context =
    resolveEventContext(
      event,
    );

  const scope =
    createScopeSummary(
      context,
      readModel,
    );

  return {
    movementId:
      eventId,

    eventId,

    eventType,

    movementType,

    bagSizeKg:
      Number(
        bagSizeKg,
      ),

    quantity:
      normalizeInteger(
        quantity,
      ),

    openingQuantityBefore:
      normalizeInteger(
        before?.openingQuantity,
      ),

    openingQuantityAfter:
      normalizeInteger(
        after?.openingQuantity,
      ),

    onHandQuantityBefore:
      normalizeInteger(
        before?.onHandQuantity,
      ),

    onHandQuantityAfter:
      normalizeInteger(
        after?.onHandQuantity,
      ),

    availableQuantityBefore:
      normalizeInteger(
        before?.availableQuantity,
      ),

    availableQuantityAfter:
      normalizeInteger(
        after?.availableQuantity,
      ),

    reservedQuantityBefore:
      normalizeInteger(
        before?.reservedQuantity,
      ),

    reservedQuantityAfter:
      normalizeInteger(
        after?.reservedQuantity,
      ),

    damagedQuantityBefore:
      normalizeInteger(
        before?.damagedQuantity,
      ),

    damagedQuantityAfter:
      normalizeInteger(
        after?.damagedQuantity,
      ),

    reservationId:
      normalizeText(
        payload?.reservationId,
      ),

    planId:
      normalizeText(
        payload?.planId ??
        payload?.packagingPlanId,
      ),

    intakeId:
      normalizeText(
        payload?.intakeId,
      ),

    bagId:
      normalizeText(
        payload?.bagId,
      ),

    movementReason:
      normalizeText(
        payload?.movementReason ??
        payload?.reason ??
        payload?.adjustmentReason ??
        payload?.releaseReason ??
        payload?.damageReason,
      ),

    actor:
      createActorSummary(
        context,
      ),

    deviceId:
      scope.deviceId,

    estateId:
      scope.estateId,

    businessUnitId:
      scope.businessUnitId,

    runtimeMode:
      scope.runtimeMode,

    occurredAt,
  };

}

function resolveQuantity(
  payload,
  aliases = [],
) {

  for (const alias of aliases) {

    const value =
      payload?.[alias];

    if (
      value !== undefined &&
      value !== null
    ) {
      return normalizeInteger(
        value,
      );
    }

  }

  return 0;

}

function resolveSignedQuantity(
  payload,
  aliases = [],
) {

  for (const alias of aliases) {

    const value =
      payload?.[alias];

    if (
      value !== undefined &&
      value !== null
    ) {
      return normalizeSignedInteger(
        value,
      );
    }

  }

  return 0;

}

/**
 * Some reservation events may contain one line:
 *
 * {
 *   bagSizeKg: 90,
 *   quantity: 2
 * }
 *
 * Others may contain:
 *
 * {
 *   reservationLines: [
 *     {
 *       bagSizeKg: 90,
 *       reservedQuantity: 2
 *     }
 *   ]
 * }
 */
function resolveMovementLines({
  payload,
  quantityAliases,
} = {}) {

  const sourceLines =
    payload?.reservationLines ??
    payload?.lines ??
    payload?.bagStockLines ??
    null;

  if (Array.isArray(sourceLines)) {

    return sourceLines
      .map(
        (line) => ({
          ...line,

          bagSizeKg:
            Number(
              line?.bagSizeKg,
            ),

          quantity:
            resolveQuantity(
              line,
              quantityAliases,
            ),
        }),
      )
      .filter(
        (line) =>
          Number.isFinite(
            line.bagSizeKg,
          ) &&
          line.bagSizeKg > 0 &&
          line.quantity > 0,
      );

  }

  const bagSizeKg =
    Number(
      payload?.bagSizeKg,
    );

  const quantity =
    resolveQuantity(
      payload,
      quantityAliases,
    );

  if (
    !Number.isFinite(
      bagSizeKg,
    ) ||
    bagSizeKg <= 0 ||
    quantity <= 0
  ) {
    return [];
  }

  return [
    {
      ...payload,
      bagSizeKg,
      quantity,
    },
  ];

}

function getOrCreateReservation({
  readModel,
  reservationId,
  payload,
  context,
  occurredAt,
} = {}) {

  if (!reservationId) {
    return null;
  }

  if (
    !readModel
      .reservationsById[
        reservationId
      ]
  ) {
    readModel
      .reservationsById[
        reservationId
      ] = {

        reservationId,

        planId:
          normalizeText(
            payload?.planId ??
            payload?.packagingPlanId,
          ),

        intakeId:
          normalizeText(
            payload?.intakeId,
          ),

        status:
          BagStockReservationStatus
            .ACTIVE,

        linesByBagSizeKg: {},

        totalReservedQuantity:
          0,

        totalConsumedQuantity:
          0,

        totalReleasedQuantity:
          0,

        actor:
          createActorSummary(
            context,
          ),

        deviceId:
          normalizeText(
            context?.deviceId,
          ),

        estateId:
          normalizeText(
            context?.estateId ??
            readModel?.estateId,
          ),

        businessUnitId:
          normalizeText(
            context?.businessUnitId ??
            readModel
              ?.businessUnitId,
          ),

        runtimeMode:
          normalizeText(
            context?.runtimeMode ??
            readModel?.runtimeMode,
          ),

        reservedAt:
          normalizeTimestamp(
            payload?.reservedAt,
            occurredAt,
          ),

        expiresAt:
          normalizeTimestamp(
            payload?.expiresAt,
            null,
          ),

        lastUpdatedAt:
          occurredAt,
      };
  }

  return readModel
    .reservationsById[
      reservationId
    ];

}

function rebuildReservationTotals(
  reservation,
) {

  const lines =
    Object.values(
      reservation
        ?.linesByBagSizeKg ??
      {},
    );

  reservation.totalReservedQuantity =
    lines.reduce(
      (
        total,
        line,
      ) =>
        total +
        normalizeInteger(
          line
            ?.reservedQuantity,
        ),
      0,
    );

  reservation.totalConsumedQuantity =
    lines.reduce(
      (
        total,
        line,
      ) =>
        total +
        normalizeInteger(
          line
            ?.consumedQuantity,
        ),
      0,
    );

  reservation.totalReleasedQuantity =
    lines.reduce(
      (
        total,
        line,
      ) =>
        total +
        normalizeInteger(
          line
            ?.releasedQuantity,
        ),
      0,
    );

  const remainingQuantity =
    reservation
      .totalReservedQuantity -
    reservation
      .totalConsumedQuantity -
    reservation
      .totalReleasedQuantity;

  reservation.remainingReservedQuantity =
    Math.max(
      0,
      remainingQuantity,
    );

  if (
    reservation
      .remainingReservedQuantity ===
      0
  ) {

    if (
      reservation
        .totalConsumedQuantity > 0
    ) {
      reservation.status =
        BagStockReservationStatus
          .CONSUMED;
    } else {
      reservation.status =
        BagStockReservationStatus
          .RELEASED;
    }

  } else if (
    reservation
      .totalConsumedQuantity > 0 ||
    reservation
      .totalReleasedQuantity > 0
  ) {
    reservation.status =
      BagStockReservationStatus
        .PARTIALLY_CONSUMED;
  } else {
    reservation.status =
      BagStockReservationStatus
        .ACTIVE;
  }

}

function refreshActiveReservationIds(
  readModel,
) {

  readModel.activeReservationIds =
    Object.values(
      readModel
        ?.reservationsById ??
      {},
    )
      .filter(
        (reservation) =>
          reservation?.status ===
            BagStockReservationStatus
              .ACTIVE ||
          reservation?.status ===
            BagStockReservationStatus
              .PARTIALLY_CONSUMED,
      )
      .map(
        (reservation) =>
          reservation
            .reservationId,
      );

}

/**
 * ==========================================================
 * Opening Stock Projection
 * ==========================================================
 */

function applyOpeningRecorded({
  readModel,
  event,
  rules,
} = {}) {

  const payload =
    resolveEventPayload(
      event,
    );

  const eventId =
    resolveEventId(
      event,
    );

  const occurredAt =
    normalizeTimestamp(
      payload?.recordedAt ??
      payload?.openedAt,
      resolveEventTimestamp(
        event,
      ),
    );

  const lines =
    resolveMovementLines({
      payload,

      quantityAliases: [
        "openingQuantity",
        "quantity",
        "countedQuantity",
      ],
    });

  lines.forEach(
    (line) => {

      if (
        !isSupportedBagSizeKg(
          line.bagSizeKg,
          rules,
        )
      ) {
        return;
      }

      const entry =
        ensureStockEntry({
          readModel,
          bagSizeKg:
            line.bagSizeKg,
          rules,
        });

      if (!entry) {
        return;
      }

      const before =
        cloneValue(
          entry,
        );

      const openingQuantity =
        line.quantity;

      entry.openingQuantity =
        openingQuantity;

      entry.onHandQuantity =
        openingQuantity +
        normalizeInteger(
          entry.receivedQuantity,
        ) +
        normalizeInteger(
          entry
            .positiveAdjustmentQuantity,
        ) -
        normalizeInteger(
          entry.consumedQuantity,
        ) -
        normalizeInteger(
          entry.damagedQuantity,
        ) -
        normalizeInteger(
          entry
            .negativeAdjustmentQuantity,
        );

      entry.onHandQuantity =
        Math.max(
          0,
          entry.onHandQuantity,
        );

      entry.availableQuantity =
        Math.max(
          0,
          entry.onHandQuantity -
          normalizeInteger(
            entry.reservedQuantity,
          ),
        );

      entry.stockLocationId =
        normalizeText(
          line?.stockLocationId ??
          payload?.stockLocationId ??
          entry.stockLocationId,
        );

      refreshStockEntry({
        entry,
        eventId,
        movementType:
          BagStockMovementType
            .OPENING,
        occurredAt,
      });

      const movementRecord =
        createMovementRecord({
          event,
          readModel,
          movementType:
            BagStockMovementType
              .OPENING,
          bagSizeKg:
            line.bagSizeKg,
          quantity:
            openingQuantity,
          before,
          after:
            entry,
          payload,
        });

      readModel.movementHistory =
        appendHistory(
          readModel
            .movementHistory,
          movementRecord,
          DEFAULT_BAG_STOCK_MOVEMENT_HISTORY_LIMIT,
        );

    },
  );

}

/**
 * ==========================================================
 * Stock Receipt Projection
 * ==========================================================
 */

function applyStockReceived({
  readModel,
  event,
  rules,
} = {}) {

  const payload =
    resolveEventPayload(
      event,
    );

  const eventId =
    resolveEventId(
      event,
    );

  const occurredAt =
    normalizeTimestamp(
      payload?.receivedAt,
      resolveEventTimestamp(
        event,
      ),
    );

  const lines =
    resolveMovementLines({
      payload,

      quantityAliases: [
        "receivedQuantity",
        "quantity",
      ],
    });

  lines.forEach(
    (line) => {

      if (
        !isSupportedBagSizeKg(
          line.bagSizeKg,
          rules,
        )
      ) {
        return;
      }

      const entry =
        ensureStockEntry({
          readModel,
          bagSizeKg:
            line.bagSizeKg,
          rules,
        });

      if (!entry) {
        return;
      }

      const before =
        cloneValue(
          entry,
        );

      entry.receivedQuantity +=
        line.quantity;

      entry.onHandQuantity +=
        line.quantity;

      entry.availableQuantity +=
        line.quantity;

      entry.stockLocationId =
        normalizeText(
          line?.stockLocationId ??
          payload?.stockLocationId ??
          entry.stockLocationId,
        );

      refreshStockEntry({
        entry,
        eventId,
        movementType:
          BagStockMovementType
            .RECEIVED,
        occurredAt,
      });

      const movementRecord =
        createMovementRecord({
          event,
          readModel,
          movementType:
            BagStockMovementType
              .RECEIVED,
          bagSizeKg:
            line.bagSizeKg,
          quantity:
            line.quantity,
          before,
          after:
            entry,
          payload,
        });

      readModel.movementHistory =
        appendHistory(
          readModel
            .movementHistory,
          movementRecord,
          DEFAULT_BAG_STOCK_MOVEMENT_HISTORY_LIMIT,
        );

    },
  );

}
/**
 * ==========================================================
 * Reservation Projection
 * ==========================================================
 */

function applyStockReserved({
  readModel,
  event,
  rules,
} = {}) {

  const payload =
    resolveEventPayload(
      event,
    );

  const context =
    resolveEventContext(
      event,
    );

  const eventId =
    resolveEventId(
      event,
    );

  const occurredAt =
    normalizeTimestamp(
      payload?.reservedAt,
      resolveEventTimestamp(
        event,
      ),
    );

  const reservationId =
    normalizeText(
      payload?.reservationId,
    );

  const lines =
    resolveMovementLines({
      payload,

      quantityAliases: [
        "reservedQuantity",
        "quantity",
        "requiredQuantity",
      ],
    });

  const reservation =
    getOrCreateReservation({
      readModel,
      reservationId,
      payload,
      context,
      occurredAt,
    });

  lines.forEach(
    (line) => {

      if (
        !isSupportedBagSizeKg(
          line.bagSizeKg,
          rules,
        )
      ) {
        return;
      }

      const entry =
        ensureStockEntry({
          readModel,
          bagSizeKg:
            line.bagSizeKg,
          rules,
        });

      if (!entry) {
        return;
      }

      const reservableQuantity =
        Math.min(
          line.quantity,
          normalizeInteger(
            entry
              .availableQuantity,
          ),
        );

      if (
        reservableQuantity <= 0
      ) {
        return;
      }

      const before =
        cloneValue(
          entry,
        );

      entry.reservedQuantity +=
        reservableQuantity;

      entry.availableQuantity -=
        reservableQuantity;

      refreshStockEntry({
        entry,
        eventId,
        movementType:
          BagStockMovementType
            .RESERVED,
        occurredAt,
      });

      if (reservation) {

        const existingLine =
          reservation
            .linesByBagSizeKg
            ?.[line.bagSizeKg] ??
          {
            bagSizeKg:
              line.bagSizeKg,

            reservedQuantity:
              0,

            consumedQuantity:
              0,

            releasedQuantity:
              0,
          };

        existingLine.reservedQuantity +=
          reservableQuantity;

        existingLine
          .remainingReservedQuantity =
          Math.max(
            0,
            existingLine
              .reservedQuantity -
            existingLine
              .consumedQuantity -
            existingLine
              .releasedQuantity,
          );

        reservation
          .linesByBagSizeKg[
            line.bagSizeKg
          ] =
          existingLine;

        reservation.lastUpdatedAt =
          occurredAt;

      }

      const movementRecord =
        createMovementRecord({
          event,
          readModel,
          movementType:
            BagStockMovementType
              .RESERVED,
          bagSizeKg:
            line.bagSizeKg,
          quantity:
            reservableQuantity,
          before,
          after:
            entry,
          payload: {
            ...payload,
            reservationId,
          },
        });

      readModel.movementHistory =
        appendHistory(
          readModel
            .movementHistory,
          movementRecord,
          DEFAULT_BAG_STOCK_MOVEMENT_HISTORY_LIMIT,
        );

    },
  );

  if (reservation) {
    rebuildReservationTotals(
      reservation,
    );
  }

  refreshActiveReservationIds(
    readModel,
  );

}

/**
 * ==========================================================
 * Consumption Projection
 * ==========================================================
 */

function applyStockConsumed({
  readModel,
  event,
  rules,
} = {}) {

  const payload =
    resolveEventPayload(
      event,
    );

  const eventId =
    resolveEventId(
      event,
    );

  const occurredAt =
    normalizeTimestamp(
      payload?.consumedAt,
      resolveEventTimestamp(
        event,
      ),
    );

  const reservationId =
    normalizeText(
      payload?.reservationId,
    );

  const lines =
    resolveMovementLines({
      payload,

      quantityAliases: [
        "consumedQuantity",
        "quantity",
      ],
    });

  const reservation =
    reservationId
      ? readModel
          .reservationsById
          ?.[reservationId] ??
        null
      : null;

  lines.forEach(
    (line) => {

      if (
        !isSupportedBagSizeKg(
          line.bagSizeKg,
          rules,
        )
      ) {
        return;
      }

      const entry =
        ensureStockEntry({
          readModel,
          bagSizeKg:
            line.bagSizeKg,
          rules,
        });

      if (!entry) {
        return;
      }

      const consumableQuantity =
        Math.min(
          line.quantity,
          normalizeInteger(
            entry
              .reservedQuantity,
          ),
          normalizeInteger(
            entry
              .onHandQuantity,
          ),
        );

      if (
        consumableQuantity <= 0
      ) {
        return;
      }

      const before =
        cloneValue(
          entry,
        );

      entry.reservedQuantity -=
        consumableQuantity;

      entry.onHandQuantity -=
        consumableQuantity;

      entry.consumedQuantity +=
        consumableQuantity;

      /*
       * Available quantity was already reduced when the bags
       * were reserved. Consuming a reservation must therefore
       * not reduce available quantity again.
       */

      refreshStockEntry({
        entry,
        eventId,
        movementType:
          BagStockMovementType
            .CONSUMED,
        occurredAt,
      });

      if (reservation) {

        const reservationLine =
          reservation
            .linesByBagSizeKg
            ?.[line.bagSizeKg];

        if (reservationLine) {

          const remainingReserved =
            Math.max(
              0,
              normalizeInteger(
                reservationLine
                  .reservedQuantity,
              ) -
              normalizeInteger(
                reservationLine
                  .consumedQuantity,
              ) -
              normalizeInteger(
                reservationLine
                  .releasedQuantity,
              ),
            );

          const lineConsumption =
            Math.min(
              consumableQuantity,
              remainingReserved,
            );

          reservationLine
            .consumedQuantity +=
            lineConsumption;

          reservationLine
            .remainingReservedQuantity =
            Math.max(
              0,
              reservationLine
                .reservedQuantity -
              reservationLine
                .consumedQuantity -
              reservationLine
                .releasedQuantity,
            );

          reservation.lastUpdatedAt =
            occurredAt;
        }

      }

      const movementRecord =
        createMovementRecord({
          event,
          readModel,
          movementType:
            BagStockMovementType
              .CONSUMED,
          bagSizeKg:
            line.bagSizeKg,
          quantity:
            consumableQuantity,
          before,
          after:
            entry,
          payload: {
            ...payload,
            reservationId,
          },
        });

      readModel.movementHistory =
        appendHistory(
          readModel
            .movementHistory,
          movementRecord,
          DEFAULT_BAG_STOCK_MOVEMENT_HISTORY_LIMIT,
        );

    },
  );

  if (reservation) {
    rebuildReservationTotals(
      reservation,
    );
  }

  refreshActiveReservationIds(
    readModel,
  );

}



/**
 * ==========================================================
 * Reservation Release Projection
 * ==========================================================
 */

function applyStockReleased({
  readModel,
  event,
  rules,
} = {}) {

  const payload =
    resolveEventPayload(
      event,
    );

  const eventId =
    resolveEventId(
      event,
    );

  const occurredAt =
    normalizeTimestamp(
      payload?.releasedAt,
      resolveEventTimestamp(
        event,
      ),
    );

  const reservationId =
    normalizeText(
      payload?.reservationId,
    );

  const lines =
    resolveMovementLines({
      payload,

      quantityAliases: [
        "releasedQuantity",
        "quantity",
      ],
    });

  const reservation =
    reservationId
      ? readModel
          .reservationsById
          ?.[reservationId] ??
        null
      : null;

  lines.forEach(
    (line) => {

      if (
        !isSupportedBagSizeKg(
          line.bagSizeKg,
          rules,
        )
      ) {
        return;
      }

      const entry =
        ensureStockEntry({
          readModel,
          bagSizeKg:
            line.bagSizeKg,
          rules,
        });

      if (!entry) {
        return;
      }

      const releasableQuantity =
        Math.min(
          line.quantity,
          normalizeInteger(
            entry
              .reservedQuantity,
          ),
        );

      if (
        releasableQuantity <= 0
      ) {
        return;
      }

      const before =
        cloneValue(
          entry,
        );

      entry.reservedQuantity -=
        releasableQuantity;

      entry.availableQuantity +=
        releasableQuantity;

      entry.releasedQuantity +=
        releasableQuantity;

      /*
       * Releasing a reservation does not change physical
       * on-hand quantity. It only makes reserved bags
       * available again.
       */

      refreshStockEntry({
        entry,
        eventId,
        movementType:
          BagStockMovementType
            .RELEASED,
        occurredAt,
      });

      if (reservation) {

        const reservationLine =
          reservation
            .linesByBagSizeKg
            ?.[line.bagSizeKg];

        if (reservationLine) {

          const remainingReserved =
            Math.max(
              0,
              normalizeInteger(
                reservationLine
                  .reservedQuantity,
              ) -
              normalizeInteger(
                reservationLine
                  .consumedQuantity,
              ) -
              normalizeInteger(
                reservationLine
                  .releasedQuantity,
              ),
            );

          const lineRelease =
            Math.min(
              releasableQuantity,
              remainingReserved,
            );

          reservationLine
            .releasedQuantity +=
            lineRelease;

          reservationLine
            .remainingReservedQuantity =
            Math.max(
              0,
              reservationLine
                .reservedQuantity -
              reservationLine
                .consumedQuantity -
              reservationLine
                .releasedQuantity,
            );

          reservation.lastUpdatedAt =
            occurredAt;
        }

      }

      const movementRecord =
        createMovementRecord({
          event,
          readModel,
          movementType:
            BagStockMovementType
              .RELEASED,
          bagSizeKg:
            line.bagSizeKg,
          quantity:
            releasableQuantity,
          before,
          after:
            entry,
          payload: {
            ...payload,
            reservationId,
          },
        });

      readModel.movementHistory =
        appendHistory(
          readModel
            .movementHistory,
          movementRecord,
          DEFAULT_BAG_STOCK_MOVEMENT_HISTORY_LIMIT,
        );

    },
  );

  if (reservation) {
    rebuildReservationTotals(
      reservation,
    );
  }

  refreshActiveReservationIds(
    readModel,
  );

}

/**
 * ==========================================================
 * Damage Projection
 * ==========================================================
 */

function applyStockDamaged({
  readModel,
  event,
  rules,
} = {}) {

  const payload =
    resolveEventPayload(
      event,
    );

  const eventId =
    resolveEventId(
      event,
    );

  const occurredAt =
    normalizeTimestamp(
      payload?.recordedAt ??
      payload?.damagedAt,
      resolveEventTimestamp(
        event,
      ),
    );

  const lines =
    resolveMovementLines({
      payload,

      quantityAliases: [
        "damagedQuantity",
        "quantity",
      ],
    });

  lines.forEach(
    (line) => {

      if (
        !isSupportedBagSizeKg(
          line.bagSizeKg,
          rules,
        )
      ) {
        return;
      }

      const entry =
        ensureStockEntry({
          readModel,
          bagSizeKg:
            line.bagSizeKg,
          rules,
        });

      if (!entry) {
        return;
      }

      const damagedFrom =
        normalizeText(
          line?.damagedFrom ??
          payload?.damagedFrom,
        ) === "reserved"
          ? "reserved"
          : "available";

      const sourceQuantity =
        damagedFrom ===
        "reserved"
          ? normalizeInteger(
              entry
                .reservedQuantity,
            )
          : normalizeInteger(
              entry
                .availableQuantity,
            );

      const damagedQuantity =
        Math.min(
          line.quantity,
          sourceQuantity,
          normalizeInteger(
            entry
              .onHandQuantity,
          ),
        );

      if (
        damagedQuantity <= 0
      ) {
        return;
      }

      const before =
        cloneValue(
          entry,
        );

      if (
        damagedFrom ===
        "reserved"
      ) {
        entry.reservedQuantity -=
          damagedQuantity;
      } else {
        entry.availableQuantity -=
          damagedQuantity;
      }

      entry.onHandQuantity -=
        damagedQuantity;

      entry.damagedQuantity +=
        damagedQuantity;

      refreshStockEntry({
        entry,
        eventId,
        movementType:
          BagStockMovementType
            .DAMAGED,
        occurredAt,
      });

      const context =
        resolveEventContext(
          event,
        );

      const scope =
        createScopeSummary(
          context,
          readModel,
        );

      const damageRecord = {
        damageId:
          eventId,

        eventId,

        bagSizeKg:
          line.bagSizeKg,

        damagedQuantity,

        damagedFrom,

        damageReason:
          normalizeText(
            line?.damageReason ??
            payload?.damageReason,
          ),

        damageStage:
          normalizeText(
            line?.damageStage ??
            payload?.damageStage,
          ),

        reservationId:
          normalizeText(
            line?.reservationId ??
            payload?.reservationId,
          ),

        planId:
          normalizeText(
            line?.planId ??
            payload?.planId ??
            payload?.packagingPlanId,
          ),

        intakeId:
          normalizeText(
            line?.intakeId ??
            payload?.intakeId,
          ),

        bagId:
          normalizeText(
            line?.bagId ??
            payload?.bagId,
          ),

        evidenceReference:
          normalizeText(
            line
              ?.evidenceReference ??
            payload
              ?.evidenceReference,
          ),

        actor:
          createActorSummary(
            context,
          ),

        deviceId:
          scope.deviceId,

        estateId:
          scope.estateId,

        businessUnitId:
          scope.businessUnitId,

        runtimeMode:
          scope.runtimeMode,

        recordedAt:
          occurredAt,
      };

      readModel.damageHistory =
        appendHistory(
          readModel
            .damageHistory,
          damageRecord,
          DEFAULT_BAG_STOCK_DAMAGE_HISTORY_LIMIT,
        );

      const movementRecord =
        createMovementRecord({
          event,
          readModel,
          movementType:
            BagStockMovementType
              .DAMAGED,
          bagSizeKg:
            line.bagSizeKg,
          quantity:
            damagedQuantity,
          before,
          after:
            entry,
          payload:
            line,
        });

      readModel.movementHistory =
        appendHistory(
          readModel
            .movementHistory,
          movementRecord,
          DEFAULT_BAG_STOCK_MOVEMENT_HISTORY_LIMIT,
        );

    },
  );

  refreshActiveReservationIds(
    readModel,
  );

}

/**
 * ==========================================================
 * Stock Adjustment Projection
 * ==========================================================
 */

function applyStockAdjusted({
  readModel,
  event,
  rules,
} = {}) {

  const payload =
    resolveEventPayload(
      event,
    );

  const eventId =
    resolveEventId(
      event,
    );

  const occurredAt =
    normalizeTimestamp(
      payload?.adjustedAt,
      resolveEventTimestamp(
        event,
      ),
    );

  const bagSizeKg =
    Number(
      payload?.bagSizeKg,
    );

  const adjustmentQuantity =
    resolveSignedQuantity(
      payload,
      [
        "adjustmentQuantity",
        "quantity",
      ],
    );

  if (
    !isSupportedBagSizeKg(
      bagSizeKg,
      rules,
    ) ||
    adjustmentQuantity === 0
  ) {
    return;
  }

  const entry =
    ensureStockEntry({
      readModel,
      bagSizeKg,
      rules,
    });

  if (!entry) {
    return;
  }

  const before =
    cloneValue(
      entry,
    );

  let appliedAdjustment =
    adjustmentQuantity;

  if (
    adjustmentQuantity < 0
  ) {
    appliedAdjustment =
      -Math.min(
        Math.abs(
          adjustmentQuantity,
        ),
        normalizeInteger(
          entry
            .availableQuantity,
        ),
        normalizeInteger(
          entry
            .onHandQuantity,
        ),
      );
  }

  entry.onHandQuantity =
    Math.max(
      0,
      entry.onHandQuantity +
      appliedAdjustment,
    );

  entry.availableQuantity =
    Math.max(
      0,
      entry.availableQuantity +
      appliedAdjustment,
    );

  if (appliedAdjustment > 0) {
    entry
      .positiveAdjustmentQuantity +=
      appliedAdjustment;
  } else {
    entry
      .negativeAdjustmentQuantity +=
      Math.abs(
        appliedAdjustment,
      );
  }

  refreshStockEntry({
    entry,
    eventId,
    movementType:
      BagStockMovementType
        .ADJUSTED,
    occurredAt,
  });

  const context =
    resolveEventContext(
      event,
    );

  const scope =
    createScopeSummary(
      context,
      readModel,
    );

  const adjustmentRecord = {
    adjustmentId:
      eventId,

    eventId,

    bagSizeKg,

    requestedAdjustmentQuantity:
      adjustmentQuantity,

    appliedAdjustmentQuantity:
      appliedAdjustment,

    adjustmentDirection:
      appliedAdjustment > 0
        ? "increase"
        : "decrease",

    adjustmentReason:
      normalizeText(
        payload
          ?.adjustmentReason,
      ),

    countReference:
      normalizeText(
        payload
          ?.countReference,
      ),

    evidenceReference:
      normalizeText(
        payload
          ?.evidenceReference,
      ),

    onHandQuantityBefore:
      before.onHandQuantity,

    onHandQuantityAfter:
      entry.onHandQuantity,

    availableQuantityBefore:
      before.availableQuantity,

    availableQuantityAfter:
      entry.availableQuantity,

    actor:
      createActorSummary(
        context,
      ),

    deviceId:
      scope.deviceId,

    estateId:
      scope.estateId,

    businessUnitId:
      scope.businessUnitId,

    runtimeMode:
      scope.runtimeMode,

    adjustedAt:
      occurredAt,
  };

  readModel.adjustmentHistory =
    appendHistory(
      readModel
        .adjustmentHistory,
      adjustmentRecord,
      DEFAULT_BAG_STOCK_COUNT_HISTORY_LIMIT,
    );

  const movementRecord =
    createMovementRecord({
      event,
      readModel,
      movementType:
        BagStockMovementType
          .ADJUSTED,
      bagSizeKg,
      quantity:
        Math.abs(
          appliedAdjustment,
        ),
      before,
      after:
        entry,
      payload,
    });

  movementRecord.adjustmentQuantity =
    appliedAdjustment;

  readModel.movementHistory =
    appendHistory(
      readModel
        .movementHistory,
      movementRecord,
      DEFAULT_BAG_STOCK_MOVEMENT_HISTORY_LIMIT,
    );

}

/**
 * ==========================================================
 * Physical Count Projection
 * ==========================================================
 */

function applyStockCounted({
  readModel,
  event,
  rules,
} = {}) {

  const payload =
    resolveEventPayload(
      event,
    );

  const eventId =
    resolveEventId(
      event,
    );

  const occurredAt =
    normalizeTimestamp(
      payload?.countedAt,
      resolveEventTimestamp(
        event,
      ),
    );

  const bagSizeKg =
    Number(
      payload?.bagSizeKg,
    );

  if (
    !isSupportedBagSizeKg(
      bagSizeKg,
      rules,
    )
  ) {
    return;
  }

  const countedOnHandQuantity =
    resolveQuantity(
      payload,
      [
        "countedOnHandQuantity",
        "countedQuantity",
        "quantity",
      ],
    );

  const entry =
    ensureStockEntry({
      readModel,
      bagSizeKg,
      rules,
    });

  if (!entry) {
    return;
  }

  const expectedOnHandQuantity =
    normalizeInteger(
      entry.onHandQuantity,
    );

  const differenceQuantity =
    countedOnHandQuantity -
    expectedOnHandQuantity;

  entry.countedQuantity =
    countedOnHandQuantity;

  entry.countDifferenceQuantity =
    differenceQuantity;

  entry.lastCountedAt =
    occurredAt;

  entry.lastMovementType =
    BagStockMovementType
      .COUNTED;

  entry.lastMovementId =
    eventId;

  entry.lastMovementAt =
    occurredAt;

  entry.lastUpdatedAt =
    occurredAt;

  const context =
    resolveEventContext(
      event,
    );

  const scope =
    createScopeSummary(
      context,
      readModel,
    );

  const countRecord = {
    countId:
      eventId,

    eventId,

    bagSizeKg,

    expectedOnHandQuantity,

    countedOnHandQuantity,

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
        payload
          ?.countReference,
      ),

    countReason:
      normalizeText(
        payload?.countReason,
      ),

    evidenceReference:
      normalizeText(
        payload
          ?.evidenceReference,
      ),

    resolved:
      payload?.resolved ===
      true,

    actor:
      createActorSummary(
        context,
      ),

    deviceId:
      scope.deviceId,

    estateId:
      scope.estateId,

    businessUnitId:
      scope.businessUnitId,

    runtimeMode:
      scope.runtimeMode,

    countedAt:
      occurredAt,
  };

  readModel.countHistory =
    appendHistory(
      readModel
        .countHistory,
      countRecord,
      DEFAULT_BAG_STOCK_COUNT_HISTORY_LIMIT,
    );

  const movementRecord =
    createMovementRecord({
      event,
      readModel,
      movementType:
        BagStockMovementType
          .COUNTED,
      bagSizeKg,
      quantity:
        countedOnHandQuantity,
      before:
        entry,
      after:
        entry,
      payload,
    });

  movementRecord.expectedOnHandQuantity =
    expectedOnHandQuantity;

  movementRecord.countedOnHandQuantity =
    countedOnHandQuantity;

  movementRecord.differenceQuantity =
    differenceQuantity;

  readModel.movementHistory =
    appendHistory(
      readModel
        .movementHistory,
      movementRecord,
      DEFAULT_BAG_STOCK_MOVEMENT_HISTORY_LIMIT,
    );

}

/**
 * ==========================================================
 * Low-Stock Alert Projection
 * ==========================================================
 */

function applyLowStockDetected({
  readModel,
  event,
} = {}) {

  const payload =
    resolveEventPayload(
      event,
    );

  const eventId =
    resolveEventId(
      event,
    );

  const occurredAt =
    normalizeTimestamp(
      payload?.detectedAt,
      resolveEventTimestamp(
        event,
      ),
    );

  const context =
    resolveEventContext(
      event,
    );

  const scope =
    createScopeSummary(
      context,
      readModel,
    );

  const bagSizeKg =
    Number(
      payload?.bagSizeKg,
    );

  const alertRecord = {
    alertId:
      eventId,

    eventId,

    alertType:
      "bag_stock_low",

    bagSizeKg:
      Number.isFinite(
        bagSizeKg,
      )
        ? bagSizeKg
        : null,

    availableQuantity:
      normalizeInteger(
        payload
          ?.availableQuantity,
      ),

    lowStockThreshold:
      normalizeInteger(
        payload
          ?.lowStockThreshold,
      ),

    reorderLevel:
      normalizeInteger(
        payload?.reorderLevel,
      ),

    severity:
      normalizeText(
        payload?.severity,
      ) ??
      "warning",

    status:
      normalizeText(
        payload?.status,
      ) ??
      "active",

    recommendationType:
      normalizeText(
        payload
          ?.recommendationType,
      ) ??
      "bag_restock_review",

    actor:
      createActorSummary(
        context,
      ),

    deviceId:
      scope.deviceId,

    estateId:
      scope.estateId,

    businessUnitId:
      scope.businessUnitId,

    runtimeMode:
      scope.runtimeMode,

    detectedAt:
      occurredAt,
  };

  readModel.alertHistory =
    appendHistory(
      readModel
        .alertHistory,
      alertRecord,
      DEFAULT_BAG_STOCK_ALERT_HISTORY_LIMIT,
    );

}

/**
 * ==========================================================
 * Projection Initialization
 * ==========================================================
 */

function initializeReadModel({
  currentModel,
  event,
  rules,
} = {}) {

  const context =
    resolveEventContext(
      event,
    );

  if (
    currentModel &&
    typeof currentModel ===
      "object" &&
    !Array.isArray(
      currentModel,
    )
  ) {
    return cloneValue(
      normalizeBagStockReadModel({
        readModel:
          currentModel,
        rules,
      }),
    );
  }

  return cloneValue(
    createEmptyBagStockReadModel({
      estateId:
        context?.estateId ??
        null,

      businessUnitId:
        context?.businessUnitId ??
        "NEXFARM",

      runtimeMode:
        context?.runtimeMode ??
        null,

      stockLocationId:
        resolveEventPayload(
          event,
        )?.stockLocationId ??
        null,

      rules,

      createdAt:
        resolveEventTimestamp(
          event,
        ),
    }),
  );

}

/**
 * ==========================================================
 * Main Projection
 * ==========================================================
 */

/**
 * Project one supported bag-stock event.
 *
 * Signature follows the NexaPOS projection convention:
 *
 * projectNexFarmBagStock({
 *   currentModel,
 *   event
 * })
 */
export function projectNexFarmBagStock({
  currentModel,
  event,
  rules =
    DEFAULT_PACKAGING_RULES,
} = {}) {

  const eventType =
    resolveEventType(
      event,
    );

  if (
    !SUPPORTED_EVENT_TYPES.has(
      eventType,
    )
  ) {
    return currentModel;
  }

  const eventId =
    resolveEventId(
      event,
    );

  const context =
    resolveEventContext(
      event,
    );

  const readModel =
    initializeReadModel({
      currentModel,
      event,
      rules,
    });

  if (
    !isScopeCompatible({
      readModel,
      context,
    })
  ) {
    /*
     * A read model must never mix estate, business-unit or
     * runtime scopes. The mismatched event remains in the
     * source event stream but is not projected here.
     */
    return currentModel;
  }

  if (
    hasProcessedEvent(
      readModel,
      eventId,
    )
  ) {
    return currentModel;
  }

  /*
   * Adopt missing scope values from the first compatible
   * event applied to the read model.
   */

  readModel.estateId =
    normalizeText(
      readModel.estateId ??
      context?.estateId,
    );

  readModel.businessUnitId =
    normalizeText(
      readModel
        .businessUnitId ??
      context?.businessUnitId ??
      "NEXFARM",
    );

  readModel.runtimeMode =
    normalizeText(
      readModel.runtimeMode ??
      context?.runtimeMode,
    );

  readModel.rulesVersion =
    getPackagingRulesVersion(
      rules,
    );

  switch (eventType) {

    case BagStockProjectionEventType
      .BAG_STOCK_OPENING_RECORDED:

      applyOpeningRecorded({
        readModel,
        event,
        rules,
      });

      break;

    case BagStockProjectionEventType
      .BAG_STOCK_RECEIVED:

      applyStockReceived({
        readModel,
        event,
        rules,
      });

      break;

    case BagStockProjectionEventType
      .BAG_STOCK_RESERVED:

      applyStockReserved({
        readModel,
        event,
        rules,
      });

      break;

    case BagStockProjectionEventType
      .BAG_STOCK_CONSUMED:

      applyStockConsumed({
        readModel,
        event,
        rules,
      });

      break;

    case BagStockProjectionEventType
      .BAG_STOCK_RELEASED:

      applyStockReleased({
        readModel,
        event,
        rules,
      });

      break;

    case BagStockProjectionEventType
      .BAG_STOCK_DAMAGED:

      applyStockDamaged({
        readModel,
        event,
        rules,
      });

      break;

    case BagStockProjectionEventType
      .BAG_STOCK_ADJUSTED:

      applyStockAdjusted({
        readModel,
        event,
        rules,
      });

      break;

    case BagStockProjectionEventType
      .BAG_STOCK_COUNTED:

      applyStockCounted({
        readModel,
        event,
        rules,
      });

      break;

    case BagStockProjectionEventType
      .BAG_STOCK_LOW_DETECTED:

      applyLowStockDetected({
        readModel,
        event,
      });

      break;

    default:

      return currentModel;

  }

  markEventProcessed(
    readModel,
    eventId,
  );

  refreshActiveReservationIds(
    readModel,
  );

  const occurredAt =
    resolveEventTimestamp(
      event,
    );

  readModel.lastMovementAt =
    occurredAt;

  readModel.lastProjectedEventId =
    eventId;

  readModel.lastProjectedEventType =
    eventType;

  readModel.lastUpdatedAt =
    occurredAt;

  return rebuildBagStockReadModel({
    readModel,
    rules,
    updatedAt:
      occurredAt,
  });

}

/**
 * ==========================================================
 * Projection Metadata
 * ==========================================================
 */

export function getBagStockProjectionMetadata() {

  return Object.freeze({
    projectionName:
      NEXFARM_BAG_STOCK_PROJECTION,

    readModelName:
      NEXFARM_BAG_STOCK_READ_MODEL,

    supportedEventTypes:
      [
        ...SUPPORTED_EVENT_TYPES,
      ],

    supportedBagSizesKg:
      getAllowedBagSizesKg(
        DEFAULT_PACKAGING_RULES,
      ),

    rulesVersion:
      getPackagingRulesVersion(
        DEFAULT_PACKAGING_RULES,
      ),

    idempotencyEnabled:
      true,

    estateScopeIsolation:
      true,

    businessUnitScopeIsolation:
      true,

    runtimeModeIsolation:
      true,

    sourceEventsImmutable:
      true,

    nexVoxAdvisoryOnly:
      true,
  });

}
