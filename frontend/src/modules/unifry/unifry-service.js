/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: unifry-service.js
 * Layer: UniFry Module
 * NEES: Business Module Execution Layer
 * ==========================================================
 *
 * Responsibility:
 * Execute UniFry business operations by
 * interacting with the NexaPOS Kernel.
 *
 * Depends On:
 * - unifry-events.js
 * - kernel-engine.js
 * - read-model-engine.js
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

  return {
    accepted: true,
    kernel: kernelResult,
    projection: projectionResult,
  };
}