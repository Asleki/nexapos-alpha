/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: qr-engine.js
 * Layer: NexFarm Storage Engine
 * NEES: Business Module Execution Layer
 * ==========================================================
 *
 * Responsibility:
 * Generate and validate QR identity payloads for
 * physical NexFarm grain bags.
 *
 * Must Never:
 * - Print labels directly
 * - Assign racks
 * - Move inventory
 * - Create business events
 * - Execute Kernel logic
 * - Synchronize external systems
 */

export const NexFarmQrVersion = Object.freeze({
  ALPHA_1:
    "NEXFARM_QR_ALPHA_1",
});

export function createBagQrPayload({
  bagId,
  labelCode,
  intakeId,
  grainType,
  bagSizeKg,
  actualWeightKg,
  estateId = null,
  businessUnitId = "NEXFARM",
  qrVersion = NexFarmQrVersion.ALPHA_1,
  createdAt = new Date().toISOString(),
} = {}) {

  if (!bagId) {
    return Object.freeze({
      accepted: false,
      reason: "MISSING_BAG_ID",
      payload: null,
    });
  }

  if (!labelCode) {
    return Object.freeze({
      accepted: false,
      reason: "MISSING_LABEL_CODE",
      payload: null,
    });
  }

  if (!intakeId) {
    return Object.freeze({
      accepted: false,
      reason: "MISSING_INTAKE_ID",
      payload: null,
    });
  }

  if (!grainType) {
    return Object.freeze({
      accepted: false,
      reason: "MISSING_GRAIN_TYPE",
      payload: null,
    });
  }

  if (!bagSizeKg) {
    return Object.freeze({
      accepted: false,
      reason: "MISSING_BAG_SIZE_KG",
      payload: null,
    });
  }

  const payload =
    Object.freeze({
      qrVersion,
      bagId,
      labelCode,
      intakeId,
      grainType,
      bagSizeKg,
      actualWeightKg,
      estateId,
      businessUnitId,
      createdAt,
    });

  return Object.freeze({
    accepted: true,
    reason: null,
    payload,
  });

}

export function encodeBagQrValue({
  payload,
} = {}) {

  if (!payload) {
    return Object.freeze({
      accepted: false,
      reason: "MISSING_QR_PAYLOAD",
      qrValue: null,
    });
  }

  const qrValue =
    JSON.stringify(payload);

  return Object.freeze({
    accepted: true,
    reason: null,
    qrValue,
  });

}

export function createPrintableBagLabel({
  payload,
  qrValue,
} = {}) {

  if (!payload) {
    return Object.freeze({
      accepted: false,
      reason: "MISSING_QR_PAYLOAD",
      label: null,
    });
  }

  if (!qrValue) {
    return Object.freeze({
      accepted: false,
      reason: "MISSING_QR_VALUE",
      label: null,
    });
  }

  return Object.freeze({
    accepted: true,
    reason: null,
    label: Object.freeze({
      title:
        "NexFarm Grain Bag",

      labelCode:
        payload.labelCode,

      bagId:
        payload.bagId,

      intakeId:
        payload.intakeId,

      grainType:
        payload.grainType,

      bagSizeKg:
        payload.bagSizeKg,

      actualWeightKg:
        payload.actualWeightKg,

      estateId:
        payload.estateId,

      qrValue,
    }),
  });

}

export function validateBagQrPayload({
  payload,
} = {}) {

  if (!payload) {
    return Object.freeze({
      accepted: false,
      reason: "MISSING_QR_PAYLOAD",
    });
  }

  if (
    payload.qrVersion !==
    NexFarmQrVersion.ALPHA_1
  ) {
    return Object.freeze({
      accepted: false,
      reason: "UNSUPPORTED_QR_VERSION",
    });
  }

  if (!payload.bagId) {
    return Object.freeze({
      accepted: false,
      reason: "MISSING_BAG_ID",
    });
  }

  if (!payload.labelCode) {
    return Object.freeze({
      accepted: false,
      reason: "MISSING_LABEL_CODE",
    });
  }

  if (!payload.intakeId) {
    return Object.freeze({
      accepted: false,
      reason: "MISSING_INTAKE_ID",
    });
  }

  if (!payload.grainType) {
    return Object.freeze({
      accepted: false,
      reason: "MISSING_GRAIN_TYPE",
    });
  }

  if (!payload.bagSizeKg) {
    return Object.freeze({
      accepted: false,
      reason: "MISSING_BAG_SIZE_KG",
    });
  }

  return Object.freeze({
    accepted: true,
    reason: null,
  });

}