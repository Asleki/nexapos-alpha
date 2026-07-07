/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: unifry-bootstrap.js
 * Layer: UniFry Module
 * NEES: Business Module Execution Layer
 * ==========================================================
 *
 * Responsibility:
 * Register UniFry projections and prototype trust context
 * during application startup.
 *
 * Depends On:
 * - read-model-registry.js
 * - trusted-device-store.js
 * - device-context.js
 * - device-types.js
 * - device-state.js
 * - unifry-projection.js
 *
 * Used By:
 * - main.js
 *
 * Must Never:
 * - Create business events
 * - Update read models directly
 * - Synchronize events
 */

import { registerProjection } from "../../core/read-model-registry.js";
import { registerTrustedDevice } from "../../core/trusted-device-store.js";
import { createDeviceContext } from "../../core/device-context.js";
import { DeviceType } from "../../core/device-types.js";
import { DeviceState } from "../../core/device-state.js";

import {
  UNIFRY_ACTIVE_ORDERS_PROJECTION,
  projectUniFryActiveOrders,
} from "./unifry-projection.js";

export function registerUniFry() {
  registerProjection(
    UNIFRY_ACTIVE_ORDERS_PROJECTION,
    projectUniFryActiveOrders
  );

  registerTrustedDevice(
    createDeviceContext({
      deviceId: "SIMULATED_DEVICE",
      deviceType: DeviceType.SIMULATOR,
      deviceName: "UniFry Prototype Device",
      trusted: true,
      registeredAt: new Date().toISOString(),
      state: DeviceState.TRUSTED,
    })
  );
}