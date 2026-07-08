/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: nexfarm-bootstrap.js
 * Layer: NexFarm Module
 * NEES: Business Module Execution Layer
 * ==========================================================
 *
 * Responsibility:
 * Register NexFarm projections and prototype trust context
 * during application startup.
 *
 * Depends On:
 * - read-model-registry.js
 * - trusted-device-store.js
 * - device-context.js
 * - device-types.js
 * - device-state.js
 * - nexfarm-projection.js
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
  NEXFARM_SUPPLIER_DIRECTORY_PROJECTION,
  projectNexFarmSupplierDirectory,
} from "./nexfarm-projection.js";

export function registerNexFarm() {
  registerProjection(
    NEXFARM_SUPPLIER_DIRECTORY_PROJECTION,
    projectNexFarmSupplierDirectory
  );

  registerTrustedDevice(
    createDeviceContext({
      deviceId: "NEXFARM_TEST_DEVICE",
      deviceType: DeviceType.SIMULATOR,
      deviceName: "NexFarm Prototype Device",
      trusted: true,
      registeredAt: new Date().toISOString(),
      state: DeviceState.TRUSTED,
    })
  );
}