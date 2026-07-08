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
import { createSupplierRegisteredEvent } from "./nexfarm-events.js";
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