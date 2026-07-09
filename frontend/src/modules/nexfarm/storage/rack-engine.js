/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: rack-engine.js
 * Layer: NexFarm Storage Engine
 * NEES: Business Module Execution Layer
 * ==========================================================
 *
 * Responsibility:
 * Validate and suggest logical rack placement
 * for physical NexFarm grain bags.
 *
 * Must Never:
 * - Generate QR codes
 * - Create business events
 * - Execute Kernel logic
 * - Move inventory directly
 * - Synchronize external systems
 */

export const NexFarmRackGrainCode = Object.freeze({
  MAIZE:
    "M",

  BEANS:
    "B",
});

export function resolveRackGrainCode({
  grainType,
} = {}) {

  const normalizedGrainType =
    String(grainType ?? "")
      .trim()
      .toLowerCase();

  if (normalizedGrainType === "maize") {
    return NexFarmRackGrainCode.MAIZE;
  }

  if (normalizedGrainType === "beans") {
    return NexFarmRackGrainCode.BEANS;
  }

  return null;

}

export function createRackLocationCode({
  grainType,
  rackSection,
  row,
  column,
  bagSizeKg,
} = {}) {

  const grainCode =
    resolveRackGrainCode({
      grainType,
    });

  if (!grainCode) {
    return Object.freeze({
      accepted: false,
      reason: "UNSUPPORTED_GRAIN_TYPE",
      locationCode: null,
    });
  }

  if (!rackSection) {
    return Object.freeze({
      accepted: false,
      reason: "MISSING_RACK_SECTION",
      locationCode: null,
    });
  }

  if (!row) {
    return Object.freeze({
      accepted: false,
      reason: "MISSING_RACK_ROW",
      locationCode: null,
    });
  }

  if (!column) {
    return Object.freeze({
      accepted: false,
      reason: "MISSING_RACK_COLUMN",
      locationCode: null,
    });
  }

  if (!bagSizeKg) {
    return Object.freeze({
      accepted: false,
      reason: "MISSING_BAG_SIZE_KG",
      locationCode: null,
    });
  }

  const locationCode =
    `${grainCode}-RS${rackSection}-R${row}-C${column}-${bagSizeKg}`;

  return Object.freeze({
    accepted: true,
    reason: null,
    locationCode,
  });

}

export function validateRackAssignment({
  grainType,
  bagSizeKg,
  rackSectionGrainType,
  rowBagSizeKg,
  rowLevel = null,
  maxHeavyBagRowLevel = 1,
} = {}) {

  if (!grainType) {
    return Object.freeze({
      accepted: false,
      reason: "MISSING_GRAIN_TYPE",
    });
  }

  if (!bagSizeKg) {
    return Object.freeze({
      accepted: false,
      reason: "MISSING_BAG_SIZE_KG",
    });
  }

  if (
    rackSectionGrainType &&
    rackSectionGrainType !== grainType
  ) {
    return Object.freeze({
      accepted: false,
      reason: "GRAIN_TYPE_MISMATCH",
    });
  }

  if (
    rowBagSizeKg &&
    Number(rowBagSizeKg) !== Number(bagSizeKg)
  ) {
    return Object.freeze({
      accepted: false,
      reason: "BAG_SIZE_ROW_MISMATCH",
    });
  }

  if (
    Number(bagSizeKg) >= 90 &&
    rowLevel !== null &&
    Number(rowLevel) > Number(maxHeavyBagRowLevel)
  ) {
    return Object.freeze({
      accepted: false,
      reason: "HEAVY_BAG_TOO_HIGH",
    });
  }

  return Object.freeze({
    accepted: true,
    reason: null,
  });

}

export function suggestRackAssignment({
  grainType,
  bagSizeKg,
  availableLocations = [],
} = {}) {

  for (const location of availableLocations) {

    const validation =
      validateRackAssignment({
        grainType,
        bagSizeKg,
        rackSectionGrainType:
          location.rackSectionGrainType,
        rowBagSizeKg:
          location.rowBagSizeKg,
        rowLevel:
          location.rowLevel,
        maxHeavyBagRowLevel:
          location.maxHeavyBagRowLevel ?? 1,
      });

    if (!validation.accepted) {
      continue;
    }

    const locationCodeResult =
      createRackLocationCode({
        grainType,
        rackSection:
          location.rackSection,
        row:
          location.row,
        column:
          location.column,
        bagSizeKg,
      });

    if (!locationCodeResult.accepted) {
      continue;
    }

    return Object.freeze({
      accepted: true,
      reason: null,
      location: Object.freeze({
        rackSection:
          location.rackSection,
        row:
          location.row,
        column:
          location.column,
        rowLevel:
          location.rowLevel ?? null,
        locationCode:
          locationCodeResult.locationCode,
      }),
    });

  }

  return Object.freeze({
    accepted: false,
    reason: "NO_VALID_RACK_LOCATION",
    location: null,
  });

}