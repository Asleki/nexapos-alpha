/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: nexfarm-service.js
 * Layer: NexFarm Module
 * NEES: Business Module Execution Layer
 * ==========================================================
 *
 * Responsibility:
 * Execute NexFarm business operations through
 * the NexaPOS live operational pipeline.
 *
 * Depends On:
 * - nexfarm-events.js
 * - kernel-engine.js
 * - read-model-engine.js
 * - execution-engine.js
 * - nexfarm-projection.js
 *
 * Used By:
 * - NexFarm UI
 *
 * Must Never:
 * - Validate events
 * - Execute security directly
 * - Store events directly
 * - Synchronize events
 */

import { executeKernel } from "../../core/kernel-engine.js";
import { updateReadModel } from "../../core/read-model-engine.js";

import {
  createSupplierRegisteredEvent,
  createGrainIntakeStartedEvent,
  createGrainTypeSelectedEvent,
  createMoistureTestRecordedEvent,
  createWeightCapturedEvent,
  createPricePreviewCreatedEvent,
  createSupplierAcceptedOfferEvent,
} from "./nexfarm-events.js";

import { executeOperation } from "./execution/execution-engine.js";

import {
  NEXFARM_SUPPLIER_DIRECTORY_PROJECTION,
  NEXFARM_SUPPLIER_DIRECTORY_READ_MODEL,
} from "./nexfarm-projection.js";

export async function registerNexFarmSupplier({
  context = {},
  supplier = {},
} = {}) {

  const workflow =
    "NEXFARM_SUPPLIER_REGISTERED_WORKFLOW";

  const event = createSupplierRegisteredEvent({
    context,
    ...supplier,
  });

  const kernelResult = await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const projectionResult = updateReadModel({
    projectionName: NEXFARM_SUPPLIER_DIRECTORY_PROJECTION,
    readModelName: NEXFARM_SUPPLIER_DIRECTORY_READ_MODEL,
    event,
    initialState: {
      suppliers: [],
      totalSuppliers: 0,
    },
  });

  const executionResult = await executeOperation({
    workflow,
    event,
    kernel: kernelResult,
    projection: projectionResult,
    state: {
      updated: projectionResult.projected === true,
    },
  });

  return {
    accepted: executionResult.accepted === true,
    kernel: kernelResult,
    projection: projectionResult,
    execution: executionResult,
  };

}

export async function startGrainIntake({
  context = {},
  intake = {},
} = {}) {

  const workflow =
    "NEXFARM_GRAIN_INTAKE_STARTED_WORKFLOW";

  const event = createGrainIntakeStartedEvent({
    context,
    ...intake,
  });

  const kernelResult = await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult = await executeOperation({
    workflow,
    event,
    kernel: kernelResult,
    projection: null,
    state: {
      updated: true,
      intakeStarted: true,
    },
  });

  return {
    accepted: executionResult.accepted === true,
    kernel: kernelResult,
    projection: null,
    execution: executionResult,
  };

}

export async function selectGrainType({
  context = {},
  intake = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_GRAIN_TYPE_SELECTED_WORKFLOW";

  const event = createGrainTypeSelectedEvent({
    context,
    ...intake,
  });

  const kernelResult = await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult = await executeOperation({
    workflow,
    event,
    kernel: kernelResult,
    lifecycle,
    projection: null,
    state: {
      updated: true,
      grainTypeSelected: true,
    },
  });

  return {
    accepted: executionResult.accepted === true,
    kernel: kernelResult,
    projection: null,
    execution: executionResult,
  };

}

export async function recordMoistureTest({
  context = {},
  intake = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_MOISTURE_TEST_RECORDED_WORKFLOW";

  const event = createMoistureTestRecordedEvent({
    context,
    ...intake,
  });

  const kernelResult = await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult = await executeOperation({
    workflow,
    event,
    kernel: kernelResult,
    lifecycle,
    projection: null,
    state: {
      updated: true,
      moistureTestRecorded: true,
    },
  });

  return {
    accepted: executionResult.accepted === true,
    kernel: kernelResult,
    projection: null,
    execution: executionResult,
  };

}

export async function captureWeight({
  context = {},
  intake = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_WEIGHT_CAPTURED_WORKFLOW";

  const event = createWeightCapturedEvent({
    context,
    ...intake,
  });

  const kernelResult = await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult = await executeOperation({
    workflow,
    event,
    kernel: kernelResult,
    lifecycle,
    projection: null,
    state: {
      updated: true,
      weightCaptured: true,
    },
  });

  return {
    accepted: executionResult.accepted === true,
    kernel: kernelResult,
    projection: null,
    execution: executionResult,
  };

}

export async function createPricePreview({
  context = {},
  intake = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_PRICE_PREVIEW_CREATED_WORKFLOW";

  const event = createPricePreviewCreatedEvent({
    context,
    ...intake,
  });

  const kernelResult = await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult = await executeOperation({
    workflow,
    event,
    kernel: kernelResult,
    lifecycle,
    projection: null,
    state: {
      updated: true,
      pricePreviewCreated: true,
    },
  });

  return {
    accepted: executionResult.accepted === true,
    kernel: kernelResult,
    projection: null,
    execution: executionResult,
  };

}

export async function acceptSupplierOffer({
  context = {},
  intake = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_SUPPLIER_ACCEPTED_OFFER_WORKFLOW";

  const event = createSupplierAcceptedOfferEvent({
    context,
    ...intake,
  });

  const kernelResult = await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult = await executeOperation({
    workflow,
    event,
    kernel: kernelResult,
    lifecycle,
    projection: null,
    state: {
      updated: true,
      supplierAcceptedOffer: true,
    },
  });

  return {
    accepted: executionResult.accepted === true,
    kernel: kernelResult,
    projection: null,
    execution: executionResult,
  };

}