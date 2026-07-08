/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: nexfarm-events.js
 * Layer: NexFarm Module
 * NEES: Business Module Execution Layer
 * ==========================================================
 */

import { createEvent } from "../../core/event-schema.js";

export function createSupplierRegisteredEvent({
  supplierId,
  firstName,
  lastName,
  nationalId,
  phone,
  context = {},
} = {}) {
  return createEvent({
    type: "SUPPLIER_REGISTERED",
    payload: {
      supplierId,
      firstName,
      lastName,
      nationalId,
      phone,
    },
    context,
  });
}

export function createGrainDeliveryStartedEvent({
  supplierId,
  deliveryId,
  grainType,
  context = {},
} = {}) {
  return createEvent({
    type: "GRAIN_DELIVERY_STARTED",
    payload: {
      supplierId,
      deliveryId,
      grainType,
    },
    context,
  });
}

export function createMoistureTestRecordedEvent({
  deliveryId,
  moisture,
  context = {},
} = {}) {
  return createEvent({
    type: "MOISTURE_TEST_RECORDED",
    payload: {
      deliveryId,
      moisture,
    },
    context,
  });
}

export function createWeightCapturedEvent({
  deliveryId,
  weight,
  context = {},
} = {}) {
  return createEvent({
    type: "WEIGHT_CAPTURED",
    payload: {
      deliveryId,
      weight,
    },
    context,
  });
}

export function createPackagingSuggestedEvent({
  deliveryId,
  packaging,
  context = {},
} = {}) {
  return createEvent({
    type: "PACKAGING_SUGGESTED",
    payload: {
      deliveryId,
      packaging,
    },
    context,
  });
}