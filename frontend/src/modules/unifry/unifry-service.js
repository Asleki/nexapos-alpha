/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: unifry-service.js
 * Layer: UniFry Module
 * NEES: Business Module Execution Layer
 * ==========================================================
 *
 * Responsibility:
 * Execute UniFry business operations through
 * the NexaPOS execution foundation.
 *
 * Depends On:
 * - unifry-events.js
 * - kernel-engine.js
 * - read-model-engine.js
 * - execution-engine.js
 * - unifry-projection.js
 *
 * Used By:
 * - UniFry UI
 *
 * Must Never:
 * - Validate events
 * - Execute security directly
 * - Store events directly
 * - Synchronize events
 */

import { executeKernel } from "../../core/kernel-engine.js";
import { updateReadModel } from "../../core/read-model-engine.js";
import { createUniFryOrderCreatedEvent } from "./unifry-events.js";
import { executeOperation } from "./execution/execution-engine.js";

import {
  UNIFRY_ACTIVE_ORDERS_PROJECTION,
  UNIFRY_ACTIVE_ORDERS_READ_MODEL,
} from "./unifry-projection.js";

export async function createUniFryOrder({
  context = {},
  order = {},
} = {}) {

  const event = createUniFryOrderCreatedEvent({
    context,
    ...order,
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
    projectionName: UNIFRY_ACTIVE_ORDERS_PROJECTION,
    readModelName: UNIFRY_ACTIVE_ORDERS_READ_MODEL,
    event,
    initialState: {
      orders: [],
      totalOrders: 0,
    },
  });

  const executionResult = await executeOperation({
    workflow: "UNIFRY_ORDER_CREATED_WORKFLOW",
    event,
    kernel: kernelResult,
    projection: projectionResult,
    state: {
      updated: projectionResult.projected === true,
    },
  });

  return {
    accepted: true,
    kernel: kernelResult,
    projection: projectionResult,
    execution: executionResult,
  };

}