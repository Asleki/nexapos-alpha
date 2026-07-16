/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: packaging-feasibility-engine.js
 * Layer: NexFarm Packaging Feasibility
 * NEES: Business Module Execution Layer
 * Cycle: Cycle 4 — Inventory-Aware Packaging
 * ==========================================================
 *
 * Responsibility:
 * Coordinate the complete preliminary feasibility assessment
 * for a NexFarm packaging request before any inventory is
 * reserved, consumed, packaged or physically stored.
 *
 * This engine evaluates:
 * - Grain packaging eligibility
 * - Source and custody readiness
 * - Moisture and condition safety
 * - Empty-bag inventory availability
 * - Rules-aware bag combinations
 * - Preliminary rack-capacity compatibility
 * - E-Zone remainder feasibility
 * - Quantity reconciliation
 * - Packaging-plan expiry
 * - Decision traces for audit and NexVox AI L1 observation
 *
 * This engine answers:
 *
 * "Can this eligible quantity of grain be packaged now,
 * using the current bag stock, preliminary rack capacity,
 * E-Zone availability and approved packaging rules?"
 *
 * It does not execute the plan.
 *
 * Correct operational sequence:
 *
 * Eligible grain
 * ↓
 * Packaging feasibility evaluated
 * ↓
 * PACKAGING_SUGGESTED
 * ↓
 * BAG_STOCK_RESERVED
 * ↓
 * BAG_CREATED
 * ↓
 * BAG_STOCK_CONSUMED
 * ↓
 * QR and rack workflows
 *
 * Future Integration:
 * - rack-capacity-engine.js will later provide the formal
 *   rack-capacity assessment consumed by this coordinator.
 * - bag-stock-projection.js will provide current empty-bag
 *   stock snapshots.
 * - E-Zone projections will provide section capacity and
 *   grain-compatibility snapshots.
 * - Cycle 7 rack admission will perform final physical
 *   placement and exact location validation.
 * - NexVox AI L1 may observe feasibility outcomes,
 *   shortages, constrained bag sizes, E-Zone pressure,
 *   rack-capacity pressure and rejected combinations.
 * - NexVox must never approve packaging, reserve bags,
 *   consume stock, change rack rules, move grain or
 *   override safety decisions.
 *
 * Depends On:
 * - packaging-rules.js
 * - packaging-engine.js
 * - bag-stock-engine.js
 *
 * Used By:
 * - nexfarm-service.js
 * - Temporary Cycle 4 integration tests
 * - Future packaging-order workflow
 * - Future NexFarm dashboards
 *
 * Must Never:
 * - Create business events
 * - Execute Kernel logic
 * - Mutate inventory
 * - Reserve empty bags
 * - Consume empty bags
 * - Assign exact rack positions
 * - Modify E-Zone quantities
 * - Approve safety overrides
 * - Approve payments
 * - Approve purchases
 * - Mix estate or runtime scopes
 */

import {
  DEFAULT_PACKAGING_RULES,
  PackagingConstraintCode,
  PackagingEligibilityStatus,
  PackagingPlanStatus,
  PackagingSourceType,
  PackagingWarningCode,
  getPackagingRulesVersion,
  isSupportedPackagingGrainType,
  validatePackagingRules,
} from "./packaging-rules.js";

import {
  suggestPackaging,
} from "./packaging-engine.js";

import {
  detectBagStockLevels,
  evaluateBagStockFeasibility,
  normalizeBagStockSnapshot,
} from "./bag-stock-engine.js";

/**
 * ==========================================================
 * Feasibility Statuses
 * ==========================================================
 */

export const PackagingFeasibilityStatus =
  Object.freeze({

    FEASIBLE:
      "feasible",

    PARTIALLY_FEASIBLE:
      "partially_feasible",

    BLOCKED:
      "blocked",

    REVIEW_REQUIRED:
      "review_required",

    INVALID:
      "invalid",

  });

/**
 * ==========================================================
 * Grain Custody Statuses
 * ==========================================================
 */

export const PackagingCustodyStatus =
  Object.freeze({

    INTAKE_ELIGIBLE:
      "intake_eligible",

    READY_FOR_STORAGE_PREPARATION:
      "ready_for_storage_preparation",

    EZONE_RELEASED:
      "ezone_released",

    COMBINED_ORDER_READY:
      "combined_order_ready",

    RETURN_TO_DRYING:
      "return_to_drying",

    LOSS_REVIEW_PENDING:
      "loss_review_pending",

    INTERNAL_GRAIN_LOSS:
      "internal_grain_loss",

    UNSAFE:
      "unsafe",

    UNKNOWN:
      "unknown",

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

function normalizeNumber(
  value,
  {
    minimum = null,
    maximum = null,
    allowNull = true,
  } = {},
) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return allowNull
      ? null
      : 0;
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
      : 0;
  }

  if (
    minimum !== null &&
    normalized < minimum
  ) {
    return minimum;
  }

  if (
    maximum !== null &&
    normalized > maximum
  ) {
    return maximum;
  }

  return normalized;

}

function roundQuantity(
  value,
  precision = 3,
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

  return Number(
    normalized.toFixed(
      precision,
    ),
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

function normalizeStringArray(
  values,
) {

  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map(
          (value) =>
            normalizeText(
              value,
            ),
        )
        .filter(Boolean),
    ),
  );

}

function normalizeSourceReferences(
  references,
) {

  if (!Array.isArray(references)) {
    return [];
  }

  return references
    .map(
      (reference) => {

        if (
          typeof reference ===
          "string"
        ) {
          return {
            referenceId:
              normalizeText(
                reference,
              ),

            referenceType:
              null,
          };
        }

        if (
          !reference ||
          typeof reference !==
            "object"
        ) {
          return null;
        }

        return {
          ...cloneValue(
            reference,
          ),

          referenceId:
            normalizeText(
              reference
                ?.referenceId ??
              reference
                ?.sourceId ??
              reference
                ?.intakeId ??
              reference
                ?.dryingCycleId ??
              reference
                ?.eZoneReleaseId,
            ),

          referenceType:
            normalizeText(
              reference
                ?.referenceType ??
              reference
                ?.sourceType,
            ),
        };

      },
    )
    .filter(
      (reference) =>
        reference &&
        reference.referenceId,
    );

}

function normalizeGrainCondition(
  value,
) {

  const normalized =
    normalizeText(
      value,
    );

  return normalized
    ? normalized.toLowerCase()
    : null;

}

function normalizeDecision(
  value,
) {

  const normalized =
    normalizeText(
      value,
    );

  return normalized
    ? normalized.toLowerCase()
    : null;

}

function normalizeSourceType(
  value,
) {

  const normalized =
    normalizeText(
      value,
    );

  return normalized
    ? normalized.toLowerCase()
    : null;

}

function createConstraint({
  code,
  field = null,
  message = null,
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
  message = null,
  details = null,
} = {}) {

  return {
    code,
    field,
    message,
    details,
  };

}

function pushUniqueByCode(
  target,
  item,
) {

  if (
    !item ||
    !item.code
  ) {
    return;
  }

  const duplicate =
    target.some(
      (existingItem) =>
        existingItem?.code ===
          item.code &&
        JSON.stringify(
          existingItem?.details ??
          null,
        ) ===
          JSON.stringify(
            item?.details ??
            null,
          ),
    );

  if (!duplicate) {
    target.push(
      item,
    );
  }

}

function resolveContextScope(
  context = {},
) {

  return {
    identityId:
      normalizeText(
        context
          ?.identity
          ?.identityId ??
        context?.identityId,
      ),

    actorType:
      normalizeText(
        context
          ?.identity
          ?.actorType ??
        context?.actorType,
      ),

    deviceId:
      normalizeText(
        context?.deviceId,
      ),

    estateId:
      normalizeText(
        context?.estateId,
      ),

    businessUnitId:
      normalizeText(
        context?.businessUnitId,
      ),

    runtimeMode:
      normalizeText(
        context?.runtimeMode,
      ),
  };

}

function valuesMatch(
  firstValue,
  secondValue,
) {

  const first =
    normalizeText(
      firstValue,
    );

  const second =
    normalizeText(
      secondValue,
    );

  if (
    !first ||
    !second
  ) {
    return true;
  }

  return (
    first === second
  );

}

/**
 * ==========================================================
 * Rack Snapshot Normalization
 * ==========================================================
 *
 * rack-capacity-engine.js is not implemented yet.
 *
 * This temporary normalized contract matches the snapshot
 * already accepted by packaging-engine.js.
 */

export function normalizePreliminaryRackCapacitySnapshot({
  snapshot,
  grainType = null,
  context = {},
} = {}) {

  if (
    !snapshot ||
    typeof snapshot !==
      "object"
  ) {
    return deepFreeze({
      accepted: false,

      reason:
        PackagingConstraintCode
          .RACK_CAPACITY_SNAPSHOT_REQUIRED,

      capacityByBagSizeKg: {},

      sections: [],

      totals: {
        availablePositionCount:
          0,

        compatiblePositionCount:
          0,

        blockedPositionCount:
          0,
      },

      errors: [
        createConstraint({
          code:
            PackagingConstraintCode
              .RACK_CAPACITY_SNAPSHOT_REQUIRED,

          field:
            "rackCapacitySnapshot",

          message:
            "A preliminary rack-capacity snapshot is required.",
        }),
      ],

      warnings: [],
    });
  }

  const expectedScope =
    resolveContextScope(
      context,
    );

  const snapshotEstateId =
    normalizeText(
      snapshot?.estateId,
    );

  const snapshotBusinessUnitId =
    normalizeText(
      snapshot?.businessUnitId,
    );

  const snapshotRuntimeMode =
    normalizeText(
      snapshot?.runtimeMode,
    );

  const errors = [];
  const warnings = [];

  if (
    !valuesMatch(
      expectedScope.estateId,
      snapshotEstateId,
    )
  ) {
    errors.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .SOURCE_SCOPE_MISMATCH,

        field:
          "rackCapacitySnapshot.estateId",

        message:
          "Rack capacity belongs to a different estate.",

        details: {
          expectedEstateId:
            expectedScope.estateId,

          snapshotEstateId,
        },
      }),
    );
  }

  if (
    !valuesMatch(
      expectedScope.businessUnitId,
      snapshotBusinessUnitId,
    )
  ) {
    errors.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .SOURCE_SCOPE_MISMATCH,

        field:
          "rackCapacitySnapshot.businessUnitId",

        message:
          "Rack capacity belongs to a different business unit.",

        details: {
          expectedBusinessUnitId:
            expectedScope.businessUnitId,

          snapshotBusinessUnitId,
        },
      }),
    );
  }

  if (
    !valuesMatch(
      expectedScope.runtimeMode,
      snapshotRuntimeMode,
    )
  ) {
    errors.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .RUNTIME_MODE_MISMATCH,

        field:
          "rackCapacitySnapshot.runtimeMode",

        message:
          "Rack capacity belongs to a different runtime mode.",

        details: {
          expectedRuntimeMode:
            expectedScope.runtimeMode,

          snapshotRuntimeMode,
        },
      }),
    );
  }

  const capacityByBagSizeKg = {};
  const sections = [];

  const addCapacityEntry =
    (rawEntry = {}) => {

      const bagSizeKg =
        Number(
          rawEntry?.bagSizeKg,
        );

      if (
        !Number.isFinite(
          bagSizeKg,
        ) ||
        bagSizeKg <= 0
      ) {
        return;
      }

      const availablePositionCount =
        Math.max(
          0,
          Math.floor(
            Number(
              rawEntry
                ?.availablePositionCount ??
              rawEntry
                ?.availableQuantity ??
              rawEntry
                ?.availableSlots ??
              0,
            ) || 0,
          ),
        );

      const sectionGrainType =
        normalizeText(
          rawEntry?.grainType ??
          snapshot?.grainType,
        );

      const requestedGrainType =
        normalizeText(
          grainType,
        );

      const grainCompatible =
        !sectionGrainType ||
        !requestedGrainType ||
        sectionGrainType
          .toLowerCase() ===
        requestedGrainType
          .toLowerCase();

      const status =
        normalizeText(
          rawEntry?.status,
        ) ??
        "active";

      const blockedStatuses =
        new Set([
          "disabled",
          "maintenance",
          "cleaning",
          "inspection_required",
          "full",
          "archived",
        ]);

      const active =
        !blockedStatuses.has(
          status.toLowerCase(),
        );

      const compatible =
        rawEntry?.compatible !==
          false &&
        grainCompatible &&
        active;

      const normalizedEntry = {
        bagSizeKg,

        availablePositionCount,

        compatible,

        status,

        rackId:
          normalizeText(
            rawEntry?.rackId,
          ),

        rackName:
          normalizeText(
            rawEntry?.rackName,
          ),

        rackSectionId:
          normalizeText(
            rawEntry
              ?.rackSectionId ??
            rawEntry
              ?.sectionId,
          ),

        rackSectionCode:
          normalizeText(
            rawEntry
              ?.rackSectionCode ??
            rawEntry
              ?.sectionCode,
          ),

        grainType:
          sectionGrainType,

        allowedLevels:
          Array.isArray(
            rawEntry
              ?.allowedLevels,
          )
            ? rawEntry
                .allowedLevels
                .map(Number)
                .filter(
                  (level) =>
                    Number.isInteger(
                      level,
                    ) &&
                    level > 0,
                )
            : [],

        estateId:
          normalizeText(
            rawEntry?.estateId ??
            snapshotEstateId,
          ),

        businessUnitId:
          normalizeText(
            rawEntry
              ?.businessUnitId ??
            snapshotBusinessUnitId,
          ),

        runtimeMode:
          normalizeText(
            rawEntry?.runtimeMode ??
            snapshotRuntimeMode,
          ),
      };

      const existing =
        capacityByBagSizeKg[
          bagSizeKg
        ];

      if (!existing) {
        capacityByBagSizeKg[
          bagSizeKg
        ] = {
          ...normalizedEntry,
        };
      } else {
        capacityByBagSizeKg[
          bagSizeKg
        ] = {
          ...existing,

          availablePositionCount:
            existing
              .availablePositionCount +
            normalizedEntry
              .availablePositionCount,

          compatible:
            existing.compatible ||
            normalizedEntry.compatible,

          rackSectionId:
            existing.rackSectionId ??
            normalizedEntry
              .rackSectionId,

          rackSectionCode:
            existing.rackSectionCode ??
            normalizedEntry
              .rackSectionCode,
        };
      }

      sections.push(
        normalizedEntry,
      );

      if (
        sectionGrainType &&
        requestedGrainType &&
        !grainCompatible
      ) {
        warnings.push(
          createWarning({
            code:
              PackagingConstraintCode
                .RACK_SECTION_GRAIN_TYPE_MISMATCH,

            field:
              "rackCapacitySnapshot",

            message:
              "A rack section was excluded because its grain type does not match the packaging request.",

            details: {
              rackSectionId:
                normalizedEntry
                  .rackSectionId,

              sectionGrainType,

              requestedGrainType,
            },
          }),
        );
      }

    };

  if (
    Array.isArray(
      snapshot,
    )
  ) {
    snapshot.forEach(
      addCapacityEntry,
    );
  } else if (
    Array.isArray(
      snapshot?.sections,
    )
  ) {
    snapshot.sections.forEach(
      (section) => {

        if (
          Array.isArray(
            section
              ?.capacityByBagSize,
          )
        ) {
          section
            .capacityByBagSize
            .forEach(
              (capacityEntry) =>
                addCapacityEntry({
                  ...section,
                  ...capacityEntry,
                }),
            );

          return;
        }

        addCapacityEntry(
          section,
        );

      },
    );
  } else {

    const rawCapacity =
      snapshot
        ?.capacityByBagSizeKg ??
      snapshot;

    Object.entries(
      rawCapacity,
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
          addCapacityEntry({
            bagSizeKg:
              Number(
                rawBagSizeKg,
              ),

            availablePositionCount:
              Number(
                rawEntry,
              ),

            grainType:
              snapshot?.grainType,

            estateId:
              snapshotEstateId,

            businessUnitId:
              snapshotBusinessUnitId,

            runtimeMode:
              snapshotRuntimeMode,
          });

          return;
        }

        if (
          rawEntry &&
          typeof rawEntry ===
            "object"
        ) {
          addCapacityEntry({
            ...rawEntry,

            bagSizeKg:
              rawEntry
                ?.bagSizeKg ??
              Number(
                rawBagSizeKg,
              ),
          });
        }

      },
    );

  }
  const normalizedEntries =
    Object.values(
      capacityByBagSizeKg,
    );

  const totals =
    normalizedEntries.reduce(
      (
        currentTotals,
        entry,
      ) => {

        currentTotals
          .availablePositionCount +=
          entry.availablePositionCount;

        if (
          entry.compatible ===
          true
        ) {
          currentTotals
            .compatiblePositionCount +=
            entry.availablePositionCount;
        } else {
          currentTotals
            .blockedPositionCount +=
            entry.availablePositionCount;
        }

        return currentTotals;

      },
      {
        availablePositionCount:
          0,

        compatiblePositionCount:
          0,

        blockedPositionCount:
          0,
      },
    );

  const accepted =
    errors.length === 0;

  return deepFreeze({
    accepted,

    reason:
      accepted
        ? null
        : errors[0]?.code ??
          PackagingConstraintCode
            .RACK_CAPACITY_SNAPSHOT_REQUIRED,

    capacityByBagSizeKg,

    sections,

    totals,

    estateId:
      snapshotEstateId ??
      expectedScope.estateId,

    businessUnitId:
      snapshotBusinessUnitId ??
      expectedScope.businessUnitId,

    runtimeMode:
      snapshotRuntimeMode ??
      expectedScope.runtimeMode,

    grainType:
      normalizeText(
        grainType,
      ),

    errors,

    warnings,
  });

}

/**
 * ==========================================================
 * E-Zone Feasibility
 * ==========================================================
 */

export function evaluateEZoneRemainderFeasibility({
  remainderKg,
  grainType,
  moisturePercentage = null,
  section = null,
  context = {},
  rules =
    DEFAULT_PACKAGING_RULES,
} = {}) {

  const normalizedRemainderKg =
    roundQuantity(
      remainderKg,
    );

  if (
    normalizedRemainderKg <=
    0
  ) {
    return deepFreeze({
      accepted: true,

      feasible: true,

      required:
        false,

      reason:
        null,

      remainderKg:
        0,

      section:
        null,

      constraints: [],

      warnings: [],
    });
  }

  const constraints = [];
  const warnings = [];

  if (
    rules
      ?.eZone
      ?.remainderAllowed !==
    true
  ) {
    constraints.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .EZONE_SECTION_REQUIRED,

        field:
          "rules.eZone.remainderAllowed",

        message:
          "Packaging remainder is not permitted by the active rules.",
      }),
    );
  }

  if (
    !section ||
    typeof section !==
      "object"
  ) {
    constraints.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .EZONE_SECTION_REQUIRED,

        field:
          "eZoneSection",

        message:
          "A compatible E-Zone section is required for packaging remainder.",

        details: {
          remainderKg:
            normalizedRemainderKg,

          grainType,
        },
      }),
    );

    return deepFreeze({
      accepted: true,

      feasible: false,

      required:
        true,

      reason:
        constraints[0].code,

      remainderKg:
        normalizedRemainderKg,

      section:
        null,

      constraints,

      warnings,
    });
  }

  const sectionStatus =
    normalizeText(
      section?.status,
    ) ??
    "active";

  const allowedStatuses =
    new Set(
      (
        rules
          ?.eZone
          ?.allowSectionStatuses ??
        []
      ).map(
        (status) =>
          String(status)
            .toLowerCase(),
      ),
    );

  const blockedStatuses =
    new Set(
      (
        rules
          ?.eZone
          ?.blockedSectionStatuses ??
        []
      ).map(
        (status) =>
          String(status)
            .toLowerCase(),
      ),
    );

  if (
    blockedStatuses.has(
      sectionStatus
        .toLowerCase(),
    ) ||
    (
      allowedStatuses.size >
        0 &&
      !allowedStatuses.has(
        sectionStatus
          .toLowerCase(),
      )
    )
  ) {
    constraints.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .EZONE_SECTION_DISABLED,

        field:
          "eZoneSection.status",

        message:
          "The selected E-Zone section is not active for grain admission.",

        details: {
          sectionStatus,
        },
      }),
    );
  }

  const requestedGrainType =
    normalizeText(
      grainType,
    );

  const sectionGrainType =
    normalizeText(
      section?.grainType,
    );

  if (
    requestedGrainType &&
    sectionGrainType &&
    requestedGrainType
      .toLowerCase() !==
    sectionGrainType
      .toLowerCase()
  ) {
    constraints.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .EZONE_GRAIN_TYPE_MISMATCH,

        field:
          "eZoneSection.grainType",

        message:
          "The E-Zone section is assigned to a different grain type.",

        details: {
          requestedGrainType,

          sectionGrainType,

          eZoneId:
            normalizeText(
              section
                ?.eZoneId ??
              section
                ?.eZoneSectionId,
            ),
        },
      }),
    );
  }

  const scope =
    resolveContextScope(
      context,
    );

  if (
    !valuesMatch(
      scope.estateId,
      section?.estateId,
    ) ||
    !valuesMatch(
      scope.businessUnitId,
      section?.businessUnitId,
    )
  ) {
    constraints.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .SOURCE_SCOPE_MISMATCH,

        field:
          "eZoneSection",

        message:
          "The E-Zone section belongs to a different operational scope.",
      }),
    );
  }

  if (
    !valuesMatch(
      scope.runtimeMode,
      section?.runtimeMode,
    )
  ) {
    constraints.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .RUNTIME_MODE_MISMATCH,

        field:
          "eZoneSection.runtimeMode",

        message:
          "The E-Zone section belongs to a different runtime mode.",
      }),
    );
  }

  const maximumCapacityKg =
    normalizeNumber(
      section
        ?.maximumCapacityKg ??
      section
        ?.capacityKg,

      {
        minimum:
          0,

        allowNull:
          true,
      },
    );

  const currentQuantityKg =
    normalizeNumber(
      section
        ?.currentQuantityKg,

      {
        minimum:
          0,

        allowNull:
          false,
      },
    );

  const explicitlyAvailableKg =
    normalizeNumber(
      section
        ?.availableCapacityKg,

      {
        minimum:
          0,

        allowNull:
          true,
      },
    );

  const availableCapacityKg =
    explicitlyAvailableKg ??
    (
      maximumCapacityKg !==
      null
        ? Math.max(
            0,
            maximumCapacityKg -
            currentQuantityKg,
          )
        : null
    );

  if (
    rules
      ?.eZone
      ?.requireCapacity ===
      true &&
    availableCapacityKg !==
      null &&
    normalizedRemainderKg >
      availableCapacityKg
  ) {
    constraints.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .EZONE_CAPACITY_EXCEEDED,

        field:
          "eZoneSection.availableCapacityKg",

        message:
          "The selected E-Zone section does not have enough available capacity.",

        details: {
          remainderKg:
            normalizedRemainderKg,

          availableCapacityKg,

          currentQuantityKg,

          maximumCapacityKg,
        },
      }),
    );
  }

const normalizedMoisture =
    normalizeNumber(
      moisturePercentage,

      {
        minimum:
          0,

        allowNull:
          true,
      },
    );

  const maximumMoisture =
    normalizeNumber(
      section
        ?.maximumMoisturePercent ??
      rules
        ?.eligibility
        ?.defaultMaximumStorageMoisturePercent,

      {
        minimum:
          0,

        allowNull:
          true,
      },
    );

  if (
    rules
      ?.eZone
      ?.requireSafeMoisture ===
      true &&
    normalizedMoisture !==
      null &&
    maximumMoisture !==
      null &&
    normalizedMoisture >
      maximumMoisture
  ) {
    constraints.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .EZONE_MOISTURE_UNSAFE,

        field:
          "moisturePercentage",

        message:
          "The grain moisture is unsafe for the selected E-Zone section.",

        details: {
          moisturePercentage:
            normalizedMoisture,

          maximumMoisturePercent:
            maximumMoisture,
        },
      }),
    );
  }

  warnings.push(
    createWarning({
      code:
        PackagingWarningCode
          .EZONE_REMAINDER_CREATED,

      field:
        "remainderKg",

      message:
        "The packaging plan creates a traceable E-Zone remainder.",

      details: {
        remainderKg:
          normalizedRemainderKg,

        eZoneId:
          normalizeText(
            section
              ?.eZoneId ??
            section
              ?.eZoneSectionId,
          ),

        grainType:
          requestedGrainType,
      },
    }),
  );

  const feasible =
    constraints.length === 0;

  return deepFreeze({
    accepted: true,

    feasible,

    required:
      true,

    reason:
      feasible
        ? null
        : constraints[0]?.code,

    remainderKg:
      normalizedRemainderKg,

    grainType:
      requestedGrainType,

    moisturePercentage:
      normalizedMoisture,

    section: {
      eZoneId:
        normalizeText(
          section
            ?.eZoneId ??
          section
            ?.eZoneSectionId,
        ),

      eZoneCode:
        normalizeText(
          section
            ?.eZoneCode ??
          section
            ?.sectionCode,
        ),

      eZoneName:
        normalizeText(
          section
            ?.eZoneName ??
          section
            ?.sectionName,
        ),

      grainType:
        sectionGrainType,

      status:
        sectionStatus,

      currentQuantityKg,

      maximumCapacityKg,

      availableCapacityKg,

      projectedQuantityKg:
        roundQuantity(
          currentQuantityKg +
          normalizedRemainderKg,
        ),

      estateId:
        normalizeText(
          section?.estateId,
        ),

      businessUnitId:
        normalizeText(
          section?.businessUnitId,
        ),

      runtimeMode:
        normalizeText(
          section?.runtimeMode,
        ),
    },

    constraints,

    warnings,
  });

}

/**
 * ==========================================================
 * Grain Eligibility
 * ==========================================================
 */

export function evaluatePackagingEligibility({
  grain = {},
  sourceType = null,
  sourceReferences = [],
  context = {},
  rules =
    DEFAULT_PACKAGING_RULES,
} = {}) {

  const constraints = [];
  const warnings = [];

  const normalizedSourceType =
    normalizeSourceType(
      sourceType ??
      grain?.sourceType,
    );

  const normalizedGrainType =
    normalizeText(
      grain?.grainType,
    );

  const quantityKg =
    normalizeNumber(
      grain
        ?.quantityKg ??
      grain
        ?.weightKg,

      {
        minimum:
          0,

        allowNull:
          true,
      },
    );

  const moisturePercentage =
    normalizeNumber(
      grain
        ?.moisturePercentage ??
      grain
        ?.moisturePercent,

      {
        minimum:
          0,

        allowNull:
          true,
      },
    );

  const returnedWeightKg =
    normalizeNumber(
      grain
        ?.returnedWeightKg ??
      grain
        ?.weightAtReturnKg ??
      grain
        ?.afterDryingWeightKg,

      {
        minimum:
          0,

        allowNull:
          true,
      },
    );

  const assessmentDecision =
    normalizeDecision(
      grain
        ?.assessmentDecision,
    );

  const grainCondition =
    normalizeGrainCondition(
      grain
        ?.grainCondition ??
      grain
        ?.conditionStatus,
    );

  const custodyStatus =
    normalizeDecision(
      grain
        ?.custodyStatus,
    ) ??
    PackagingCustodyStatus
      .UNKNOWN;

  const lossReviewPending =
    grain
      ?.lossReviewPending ===
      true ||
    grain
      ?.reviewRequired ===
      true ||
    assessmentDecision ===
      "loss_review_required" ||
    custodyStatus ===
      PackagingCustodyStatus
        .LOSS_REVIEW_PENDING;

  const internalLossRecorded =
    grain
      ?.internalLossRecorded ===
      true ||
    grain
      ?.batchClosedAsLoss ===
      true ||
    assessmentDecision ===
      "internal_grain_loss" ||
    custodyStatus ===
      PackagingCustodyStatus
        .INTERNAL_GRAIN_LOSS;

  const returnToDrying =
    grain
      ?.returnToDrying ===
      true ||
    assessmentDecision ===
      "return_to_drying" ||
    custodyStatus ===
      PackagingCustodyStatus
        .RETURN_TO_DRYING;

  if (!normalizedGrainType) {
    constraints.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .GRAIN_TYPE_REQUIRED,

        field:
          "grain.grainType",

        message:
          "A grain type is required before packaging feasibility can be evaluated.",
      }),
    );
  } else if (
    !isSupportedPackagingGrainType(
      normalizedGrainType,
      rules,
    )
  ) {
    constraints.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .GRAIN_TYPE_UNSUPPORTED,

        field:
          "grain.grainType",

        message:
          "The grain type is not active in the current NexFarm packaging rules.",

        details: {
          grainType:
            normalizedGrainType,
        },
      }),
    );
  }

  if (
    quantityKg === null ||
    quantityKg <= 0
  ) {
    constraints.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .INVALID_GRAIN_QUANTITY,

        field:
          "grain.quantityKg",

        message:
          "Packaging requires a positive grain quantity.",

        details: {
          quantityKg,
        },
      }),
    );
  }

  const allowedSourceTypes =
    normalizeStringArray(
      rules
        ?.eligibility
        ?.allowedSourceTypes,
    );

  if (
    !normalizedSourceType ||
    !allowedSourceTypes.includes(
      normalizedSourceType,
    )
  ) {
    constraints.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .GRAIN_NOT_PACKAGING_ELIGIBLE,

        field:
          "sourceType",

        message:
          "The source type is not eligible for packaging.",

        details: {
          sourceType:
            normalizedSourceType,

          allowedSourceTypes,
        },
      }),
    );
  }

  if (
    rules
      ?.eligibility
      ?.requireSafeMoisture ===
      true
  ) {

    const maximumMoisture =
      normalizeNumber(
        grain
          ?.maximumStorageMoisturePercent ??
        rules
          ?.eligibility
          ?.defaultMaximumStorageMoisturePercent,

        {
          minimum:
            0,

          allowNull:
            true,
        },
      );

    if (
      moisturePercentage ===
      null
    ) {
      constraints.push(
        createConstraint({
          code:
            PackagingConstraintCode
              .MOISTURE_UNSAFE,

          field:
            "grain.moisturePercentage",

          message:
            "A safe moisture reading is required before packaging.",
        }),
      );
    } else if (
      maximumMoisture !==
        null &&
      moisturePercentage >
        maximumMoisture
    ) {
      constraints.push(
        createConstraint({
          code:
            PackagingConstraintCode
              .MOISTURE_UNSAFE,

          field:
            "grain.moisturePercentage",

          message:
            "The grain moisture exceeds the packaging and storage limit.",

          details: {
            moisturePercentage,

            maximumMoisturePercent:
              maximumMoisture,
          },
        }),
      );
    }

  }

  if (
    normalizedSourceType ===
      PackagingSourceType
        .DRYING_RETURN &&
    rules
      ?.eligibility
      ?.requireReturnedWeightAfterDrying ===
      true &&
    (
      returnedWeightKg ===
        null ||
      returnedWeightKg <= 0
    )
  ) {
    constraints.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .RETURNED_WEIGHT_REQUIRED,

        field:
          "grain.returnedWeightKg",

        message:
          "Returned grain weight is required after drying.",
      }),
    );
  }

  if (
    normalizedSourceType ===
      PackagingSourceType
        .DRYING_RETURN &&
    rules
      ?.eligibility
      ?.requireDryingAssessmentAfterDrying ===
      true &&
    !assessmentDecision
  ) {
    constraints.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .DRYING_ASSESSMENT_REQUIRED,

        field:
          "grain.assessmentDecision",

        message:
          "An internal drying assessment is required before packaging.",
      }),
    );
  }

  if (
    returnToDrying &&
    rules
      ?.eligibility
      ?.allowPackagingWhenReturnToDrying !==
      true
  ) {
    constraints.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .RETURN_TO_DRYING_REQUIRED,

        field:
          "grain.assessmentDecision",

        message:
          "The grain must return to drying before packaging.",
      }),
    );
  }

  if (
    lossReviewPending &&
    rules
      ?.eligibility
      ?.allowPackagingWhenLossReviewPending !==
      true
  ) {
    constraints.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .LOSS_REVIEW_PENDING,

        field:
          "grain.lossReviewPending",

        message:
          "Packaging is blocked while internal loss review remains pending.",
      }),
    );
  }

  if (
    internalLossRecorded &&
    rules
      ?.eligibility
      ?.allowPackagingAfterInternalLoss !==
      true
  ) {
    constraints.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .INTERNAL_GRAIN_LOSS_RECORDED,

        field:
          "grain.internalLossRecorded",

        message:
          "A batch closed as internal grain loss cannot be packaged.",
      }),
    );
  }

  const unsafeConditions =
    new Set(
      (
        rules
          ?.eligibility
          ?.unsafeGrainConditions ??
        []
      ).map(
        (condition) =>
          String(condition)
            .toLowerCase(),
      ),
    );

  if (
    grainCondition &&
    unsafeConditions.has(
      grainCondition,
    ) &&
    rules
      ?.eligibility
      ?.allowUnsafeGrainCondition !==
      true
  ) {
    constraints.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .GRAIN_CONDITION_UNSAFE,

        field:
          "grain.grainCondition",

        message:
          "The recorded grain condition is unsafe for packaging.",

        details: {
          grainCondition,
        },
      }),
    );
  }

  const safeAssessmentDecisions =
    new Set(
      (
        rules
          ?.eligibility
          ?.safeAssessmentDecisions ??
        []
      ).map(
        (decision) =>
          String(decision)
            .toLowerCase(),
      ),
    );

  if (
    normalizedSourceType ===
      PackagingSourceType
        .DRYING_RETURN &&
    assessmentDecision &&
    safeAssessmentDecisions.size >
      0 &&
    !safeAssessmentDecisions.has(
      assessmentDecision,
    ) &&
    !returnToDrying &&
    !lossReviewPending &&
    !internalLossRecorded
  ) {
    constraints.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .GRAIN_NOT_PACKAGING_ELIGIBLE,

        field:
          "grain.assessmentDecision",

        message:
          "The drying assessment decision does not permit packaging.",

        details: {
          assessmentDecision,

          safeAssessmentDecisions:
            [
              ...safeAssessmentDecisions,
            ],
        },
      }),
    );
  }

  const scope =
    resolveContextScope(
      context,
    );

  if (
    rules
      ?.eligibility
      ?.requireEstateScope ===
      true &&
    !scope.estateId
  ) {
    constraints.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .SOURCE_SCOPE_MISMATCH,

        field:
          "context.estateId",

        message:
          "Estate scope is required for packaging feasibility.",
      }),
    );
  }

  if (
    rules
      ?.eligibility
      ?.requireBusinessUnitScope ===
      true &&
    !scope.businessUnitId
  ) {
    constraints.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .SOURCE_SCOPE_MISMATCH,

        field:
          "context.businessUnitId",

        message:
          "Business-unit scope is required for packaging feasibility.",
      }),
    );
  }

  if (
    rules
      ?.eligibility
      ?.requireRuntimeModeScope ===
      true &&
    !scope.runtimeMode
  ) {
    constraints.push(
      createConstraint({
        code:
          PackagingConstraintCode
            .RUNTIME_MODE_MISMATCH,

        field:
          "context.runtimeMode",

        message:
          "Runtime-mode scope is required for packaging feasibility.",
      }),
    );
  }

  if (
    normalizeSourceReferences(
      sourceReferences,
    ).length === 0 &&
    rules
      ?.context
      ?.requireSourceReference ===
      true
  ) {
    warnings.push(
      createWarning({
        code:
          "SOURCE_REFERENCE_MISSING",

        field:
          "sourceReferences",

        message:
          "The packaging request should preserve at least one traceable source reference.",
      }),
    );
  }

  const eligible =
    constraints.length === 0;

  return deepFreeze({
    accepted: true,

    eligible,

    eligibilityStatus:
      eligible
        ? PackagingEligibilityStatus
            .ELIGIBLE
        : lossReviewPending
          ? PackagingEligibilityStatus
              .REVIEW_REQUIRED
          : PackagingEligibilityStatus
              .BLOCKED,

    reason:
      eligible
        ? null
        : constraints[0]?.code ??
          PackagingConstraintCode
            .GRAIN_NOT_PACKAGING_ELIGIBLE,

    grain: {
      grainType:
        normalizedGrainType,

      quantityKg,

      moisturePercentage,

      returnedWeightKg,

      assessmentDecision,

      grainCondition,

      custodyStatus,

      returnToDrying,

      lossReviewPending,

      internalLossRecorded,
    },

    sourceType:
      normalizedSourceType,

    sourceReferences:
      normalizeSourceReferences(
        sourceReferences,
      ),

    context:
      scope,

    constraints,

    warnings,

    rulesVersion:
      getPackagingRulesVersion(
        rules,
      ),
  });

}

/**
 * ==========================================================
 * Main Feasibility Coordinator
 * ==========================================================
 */

export function evaluatePackagingFeasibility({
  grain = {},
  sourceType = null,
  sourceReferences = [],
  bagSizes = null,
  bagStockSnapshot = null,
  rackCapacitySnapshot = null,
  eZoneSection = null,
  context = {},
  rules =
    DEFAULT_PACKAGING_RULES,
  createdAt =
    new Date().toISOString(),
} = {}) {

  const evaluatedAt =
    normalizeTimestamp(
      createdAt,
    );

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

      feasible: false,

      status:
        PackagingFeasibilityStatus
          .INVALID,

      planStatus:
        PackagingPlanStatus
          .REJECTED,

      reason:
        "INVALID_PACKAGING_RULES",

      eligibility:
        null,

      bagStock:
        null,

      rackCapacity:
        null,

      eZone:
        null,

      packagingPlan:
        null,

      constraints: [
        createConstraint({
          code:
            "INVALID_PACKAGING_RULES",

          field:
            "rules",

          message:
            "The active packaging rules are invalid.",

          details:
            rulesValidation.errors,
        }),
      ],

      warnings:
        rulesValidation.warnings,

      decisionTrace: {
        rulesValidation,

        evaluatedAt,
      },
    });
  }

  const normalizedSourceType =
    normalizeSourceType(
      sourceType ??
      grain?.sourceType,
    );

  const normalizedSourceReferences =
    normalizeSourceReferences(
      sourceReferences,
    );

  const eligibility =
    evaluatePackagingEligibility({
      grain,
      sourceType:
        normalizedSourceType,
      sourceReferences:
        normalizedSourceReferences,
      context,
      rules,
    });

  const constraints = [];
  const warnings = [];

  eligibility.constraints.forEach(
    (constraint) =>
      pushUniqueByCode(
        constraints,
        constraint,
      ),
  );

  eligibility.warnings.forEach(
    (warning) =>
      pushUniqueByCode(
        warnings,
        warning,
      ),
  );

  if (
    eligibility.eligible !==
    true
  ) {
    return deepFreeze({
      accepted: true,

      feasible: false,

      status:
        eligibility
          .eligibilityStatus ===
        PackagingEligibilityStatus
          .REVIEW_REQUIRED
          ? PackagingFeasibilityStatus
              .REVIEW_REQUIRED
          : PackagingFeasibilityStatus
              .BLOCKED,

      planStatus:
        PackagingPlanStatus
          .REJECTED,

      reason:
        eligibility.reason,

      eligibility,

      bagStock:
        null,

      rackCapacity:
        null,

      eZone:
        null,

      packagingPlan:
        null,

      constraints,

      warnings,

      rulesVersion:
        getPackagingRulesVersion(
          rules,
        ),

      evaluatedAt,

      decisionTrace: {
        eligibility,

        rulesVersion:
          getPackagingRulesVersion(
            rules,
          ),

        evaluatedAt,
      },

      nexVoxObservation: {
        advisoryOnly:
          true,

        packagingEligible:
          false,

        feasibilityStatus:
          PackagingFeasibilityStatus
            .BLOCKED,

        reason:
          eligibility.reason,

        constraints,

        mayOverride:
          false,

        evaluatedAt,
      },
    });
  }

  const normalizedBagStock =
    normalizeBagStockSnapshot({
      snapshot:
        bagStockSnapshot,
      rules,
    });

  if (
    normalizedBagStock.accepted !==
    true
  ) {
    normalizedBagStock
      .errors
      .forEach(
        (error) =>
          pushUniqueByCode(
            constraints,
            error,
          ),
      );
  }

  normalizedBagStock
    .warnings
    ?.forEach(
      (warning) =>
        pushUniqueByCode(
          warnings,
          warning,
        ),
    );

  const normalizedRackCapacity =
    normalizePreliminaryRackCapacitySnapshot({
      snapshot:
        rackCapacitySnapshot,
      grainType:
        eligibility
          .grain
          .grainType,
      context,
    });

  if (
    normalizedRackCapacity
      .accepted !==
    true
  ) {
    normalizedRackCapacity
      .errors
      .forEach(
        (error) =>
          pushUniqueByCode(
            constraints,
            error,
          ),
      );
  }

  normalizedRackCapacity
    .warnings
    .forEach(
      (warning) =>
        pushUniqueByCode(
          warnings,
          warning,
        ),
    );

  if (
    normalizedBagStock.accepted !==
      true ||
    normalizedRackCapacity
      .accepted !==
      true
  ) {
    return deepFreeze({
      accepted: true,

      feasible: false,

      status:
        PackagingFeasibilityStatus
          .BLOCKED,

      planStatus:
        PackagingPlanStatus
          .REJECTED,

      reason:
        constraints[0]?.code ??
        PackagingConstraintCode
          .NO_FEASIBLE_PACKAGING_PLAN,

      eligibility,

      bagStock:
        normalizedBagStock,

      rackCapacity:
        normalizedRackCapacity,

      eZone:
        null,

      packagingPlan:
        null,

      constraints,

      warnings,

      rulesVersion:
        getPackagingRulesVersion(
          rules,
        ),

      evaluatedAt,

      decisionTrace: {
        eligibility,

        bagStock:
          normalizedBagStock,

        rackCapacity:
          normalizedRackCapacity,

        constraints,

        warnings,

        evaluatedAt,
      },

      nexVoxObservation: {
        advisoryOnly:
          true,

        packagingEligible:
          true,

        feasibilityStatus:
          PackagingFeasibilityStatus
            .BLOCKED,

        reason:
          constraints[0]?.code ??
          null,

        bagStockSnapshotAvailable:
          normalizedBagStock
            .accepted === true,

        rackCapacitySnapshotAvailable:
          normalizedRackCapacity
            .accepted === true,

        mayOverride:
          false,

        evaluatedAt,
      },
    });
  }

  const planResult =
    suggestPackaging({
      weightKg:
        eligibility
          .grain
          .quantityKg,

      grainType:
        eligibility
          .grain
          .grainType,

      sourceType:
        normalizedSourceType,

      sourceReferences:
        normalizedSourceReferences,

      bagSizes,

      bagStockSnapshot:
        normalizedBagStock
          .stockByBagSizeKg,

      rackCapacitySnapshot:
        {
          estateId:
            normalizedRackCapacity
              .estateId,

          businessUnitId:
            normalizedRackCapacity
              .businessUnitId,

          runtimeMode:
            normalizedRackCapacity
              .runtimeMode,

          grainType:
            normalizedRackCapacity
              .grainType,

          capacityByBagSizeKg:
            normalizedRackCapacity
              .capacityByBagSizeKg,
        },

      eZoneSectionAvailable:
        eZoneSection !==
        null,

      rules,

      createdAt:
        evaluatedAt,
    });

  planResult
    ?.blockingConstraints
    ?.forEach(
      (constraint) =>
        pushUniqueByCode(
          constraints,
          constraint,
        ),
    );

  planResult
    ?.warnings
    ?.forEach(
      (warning) =>
        pushUniqueByCode(
          warnings,
          warning,
        ),
    );

  const bagStockFeasibility =
    planResult?.suggestedBags
      ?.length > 0
      ? evaluateBagStockFeasibility({
          snapshot:
            normalizedBagStock
              .stockByBagSizeKg,

          requirements:
            planResult
              .suggestedBags
              .map(
                (bag) => ({
                  bagSizeKg:
                    bag.bagSizeKg,

                  requiredQuantity:
                    bag.quantity,
                }),
              ),

          planId:
            null,

          estateId:
            context?.estateId,

          businessUnitId:
            context?.businessUnitId,

          runtimeMode:
            context?.runtimeMode,

          rules,

          evaluatedAt,
        })
      : {
          accepted:
            true,

          feasible:
            false,

          reason:
            PackagingConstraintCode
              .NO_FEASIBLE_PACKAGING_PLAN,

          requirements: [],

          shortages: [],
        };

  if (
    bagStockFeasibility
      .feasible !==
    true
  ) {
    pushUniqueByCode(
      constraints,
      createConstraint({
        code:
          bagStockFeasibility
            .reason ??
          PackagingConstraintCode
            .EMPTY_BAG_STOCK_INSUFFICIENT,

        field:
          "bagStockSnapshot",

        message:
          "The empty-bag stock cannot satisfy the selected packaging plan.",

        details: {
          shortages:
            bagStockFeasibility
              .shortages ??
            [],
        },
      }),
    );
  }

  bagStockFeasibility
    ?.warnings
    ?.forEach(
      (warning) =>
        pushUniqueByCode(
          warnings,
          warning,
        ),
    );

  const eZoneFeasibility =
    evaluateEZoneRemainderFeasibility({
      remainderKg:
        planResult?.eZoneKg ??
        eligibility
          .grain
          .quantityKg,

      grainType:
        eligibility
          .grain
          .grainType,

      moisturePercentage:
        eligibility
          .grain
          .moisturePercentage,

      section:
        eZoneSection,

      context,

      rules,
    });

  if (
    eZoneFeasibility
      .feasible !==
    true
  ) {
    eZoneFeasibility
      .constraints
      .forEach(
        (constraint) =>
          pushUniqueByCode(
            constraints,
            constraint,
          ),
      );
  }

  eZoneFeasibility
    .warnings
    .forEach(
      (warning) =>
        pushUniqueByCode(
          warnings,
          warning,
        ),
    );

  const inputQuantityKg =
    roundQuantity(
      eligibility
        .grain
        .quantityKg,
    );

  const packagedQuantityKg =
    roundQuantity(
      planResult
        ?.totalPackagedKg ??
      0,
    );

  const eZoneRemainderKg =
    roundQuantity(
      planResult
        ?.eZoneKg ??
      0,
    );

  const accountedQuantityKg =
    roundQuantity(
      packagedQuantityKg +
      eZoneRemainderKg,
    );

  const reconciliationDifferenceKg =
    roundQuantity(
      inputQuantityKg -
      accountedQuantityKg,
    );

  const toleranceKg =
    normalizeNumber(
      rules
        ?.reconciliation
        ?.defaultToleranceKg,

      {
        minimum:
          0,

        allowNull:
          false,
      },
    );

  const quantityReconciled =
    Math.abs(
      reconciliationDifferenceKg,
    ) <= toleranceKg;

  if (!quantityReconciled) {
    pushUniqueByCode(
      constraints,
      createConstraint({
        code:
          PackagingConstraintCode
            .QUANTITY_RECONCILIATION_FAILED,

        field:
          "quantityReconciliation",

        message:
          "The packaging plan does not account for the full grain quantity.",

        details: {
          inputQuantityKg,

          packagedQuantityKg,

          eZoneRemainderKg,

          accountedQuantityKg,

          reconciliationDifferenceKg,

          toleranceKg,
        },
      }),
    );
  }

  const stockLevels =
    detectBagStockLevels({
      snapshot:
        normalizedBagStock
          .stockByBagSizeKg,

      rules,

      evaluatedAt,
    });

  stockLevels
    ?.nexVoxObservation
    ?.notificationCandidates
    ?.forEach(
      (candidate) => {

        if (
          candidate?.severity ===
            "critical" ||
          candidate?.severity ===
            "high"
        ) {
          pushUniqueByCode(
            warnings,
            createWarning({
              code:
                PackagingWarningCode
                  .LOW_EMPTY_BAG_STOCK,

              field:
                `bagStock.${candidate.bagSizeKg}`,

              message:
                "The packaging plan uses a bag size with low or exhausted stock.",

              details:
                candidate,
            }),
          );
        }

      },
    );

  const preliminaryRackFeasible =
    (
      planResult
        ?.rackCapacityRequirements ??
      []
    ).every(
      (requirement) =>
        Number(
          requirement
            ?.requiredPositionCount ??
          0,
        ) <=
        Number(
          requirement
            ?.availablePositionCountBeforePlan ??
          0,
        ),
    );

  if (
    !preliminaryRackFeasible &&
    (
      planResult
        ?.rackCapacityRequirements ??
      []
    ).length > 0
  ) {
    pushUniqueByCode(
      constraints,
      createConstraint({
        code:
          PackagingConstraintCode
            .RACK_CAPACITY_INSUFFICIENT,

        field:
          "rackCapacitySnapshot",

        message:
          "Preliminary compatible rack capacity cannot satisfy the packaging plan.",
      }),
    );
  }

  const planAccepted =
    planResult?.accepted ===
      true;

  const hasBlockingConstraints =
    constraints.length > 0;

  const feasible =
    planAccepted &&
    bagStockFeasibility
      .feasible === true &&
    preliminaryRackFeasible &&
    eZoneFeasibility
      .feasible === true &&
    quantityReconciled &&
    !hasBlockingConstraints;

  const partialPackaging =
    feasible &&
    eZoneRemainderKg > 0;

  const status =
    feasible
      ? partialPackaging
        ? PackagingFeasibilityStatus
            .PARTIALLY_FEASIBLE
        : PackagingFeasibilityStatus
            .FEASIBLE
      : PackagingFeasibilityStatus
          .BLOCKED;

  const reason =
    feasible
      ? null
      : constraints[0]?.code ??
        planResult?.reason ??
        PackagingConstraintCode
          .NO_FEASIBLE_PACKAGING_PLAN;

  const decisionTrace = {
    evaluatedAt,

    rulesVersion:
      getPackagingRulesVersion(
        rules,
      ),

    context:
      resolveContextScope(
        context,
      ),

    grainEligibility:
      eligibility,

    normalizedBagStock:
      normalizedBagStock
        .stockByBagSizeKg,

    normalizedRackCapacity:
      normalizedRackCapacity
        .capacityByBagSizeKg,

    eZoneSection:
      eZoneFeasibility
        .section,

    packagingPlan:
      planResult,

    bagStockFeasibility,

    preliminaryRackFeasible,

    eZoneFeasibility,

    quantityReconciliation: {
      inputQuantityKg,

      packagedQuantityKg,

      eZoneRemainderKg,

      accountedQuantityKg,

      reconciliationDifferenceKg,

      toleranceKg,

      reconciled:
        quantityReconciled,
    },

    constraints,

    warnings,
  };

  return deepFreeze({
    accepted: true,

    feasible,

    status,

    planStatus:
      feasible
        ? PackagingPlanStatus
            .FEASIBLE
        : PackagingPlanStatus
            .REJECTED,

    reason,

    eligibility,

    bagStock: {
      snapshot:
        normalizedBagStock,

      feasibility:
        bagStockFeasibility,

      levels:
        stockLevels,
    },

    rackCapacity: {
      snapshot:
        normalizedRackCapacity,

      feasible:
        preliminaryRackFeasible,

      requirements:
        planResult
          ?.rackCapacityRequirements ??
        [],
    },

    eZone:
      eZoneFeasibility,

    packagingPlan:
      planResult,

    quantityReconciliation:
      decisionTrace
        .quantityReconciliation,

    constraints,

    warnings,

    rulesVersion:
      getPackagingRulesVersion(
        rules,
      ),

    evaluatedAt,

    decisionTrace,

    nexVoxObservation: {
      advisoryOnly:
        true,

      mayApprovePackaging:
        false,

      mayReserveBagStock:
        false,

      mayConsumeBagStock:
        false,

      mayAssignRack:
        false,

      mayModifyEZone:
        false,

      mayOverrideSafety:
        false,

      feasibilityStatus:
        status,

      feasible,

      partialPackaging,

      grainType:
        eligibility
          .grain
          .grainType,

      sourceType:
        normalizedSourceType,

      requestedQuantityKg:
        inputQuantityKg,

      packagedQuantityKg,

      eZoneRemainderKg,

      suggestedBags:
        cloneValue(
          planResult
            ?.suggestedBags ??
          [],
        ),

      bagStockRequirements:
        cloneValue(
          planResult
            ?.bagStockRequirements ??
          [],
        ),

      rackCapacityRequirements:
        cloneValue(
          planResult
            ?.rackCapacityRequirements ??
          [],
        ),

      bagStockShortages:
        cloneValue(
          bagStockFeasibility
            ?.shortages ??
          [],
        ),

      sinkingBagStock:
        cloneValue(
          stockLevels
            ?.nexVoxObservation
            ?.notificationCandidates ??
          [],
        ),

      constraints:
        cloneValue(
          constraints,
        ),

      warnings:
        cloneValue(
          warnings,
        ),

      rulesVersion:
        getPackagingRulesVersion(
          rules,
        ),

      evaluatedAt,
    },
  });

}

/**
 * ==========================================================
 * Lightweight Feasibility Summary
 * ==========================================================
 */

export function createPackagingFeasibilitySummary(
  result,
) {

  if (
    !result ||
    typeof result !==
      "object"
  ) {
    return deepFreeze({
      accepted: false,

      feasible: false,

      reason:
        "PACKAGING_FEASIBILITY_RESULT_REQUIRED",
    });
  }

  return deepFreeze({
    accepted:
      result.accepted ===
      true,

    feasible:
      result.feasible ===
      true,

    status:
      result.status ??
      PackagingFeasibilityStatus
        .INVALID,

    reason:
      result.reason ??
      null,

    grainType:
      result
        ?.eligibility
        ?.grain
        ?.grainType ??
      null,

    requestedQuantityKg:
      result
        ?.quantityReconciliation
        ?.inputQuantityKg ??
      0,

    packagedQuantityKg:
      result
        ?.quantityReconciliation
        ?.packagedQuantityKg ??
      0,

    eZoneRemainderKg:
      result
        ?.quantityReconciliation
        ?.eZoneRemainderKg ??
      0,

    quantityReconciled:
      result
        ?.quantityReconciliation
        ?.reconciled ===
      true,

    suggestedBags:
      cloneValue(
        result
          ?.packagingPlan
          ?.suggestedBags ??
        [],
      ),

    bagStockRequirements:
      cloneValue(
        result
          ?.packagingPlan
          ?.bagStockRequirements ??
        [],
      ),

    rackCapacityRequirements:
      cloneValue(
        result
          ?.packagingPlan
          ?.rackCapacityRequirements ??
        [],
      ),

    eZoneRequired:
      result
        ?.eZone
        ?.required ===
      true,

    eZoneFeasible:
      result
        ?.eZone
        ?.feasible ===
      true,

    constraintCodes:
      (
        result?.constraints ??
        []
      )
        .map(
          (constraint) =>
            constraint?.code,
        )
        .filter(Boolean),

    warningCodes:
      (
        result?.warnings ??
        []
      )
        .map(
          (warning) =>
            warning?.code,
        )
        .filter(Boolean),

    rulesVersion:
      result.rulesVersion ??
      null,

    evaluatedAt:
      result.evaluatedAt ??
      null,
  });

}
