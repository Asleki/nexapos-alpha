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
 * This bootstrap connects NexFarm module projections to the
 * shared Read Model Engine before any NexFarm operation is
 * executed.
 *
 * Registered projections:
 * - Supplier Directory Projection
 * - Drying Custody Projection
 *
 * Future Use:
 * - NexFarm operational dashboards
 * - Drying-zone monitoring
 * - Internal loss-review visibility
 * - Storage-admission controls
 * - NexVox AI L1 observational analytics
 *
 * NexVox AI may observe registered read models but must never:
 * - Register production projections dynamically
 * - Modify source events
 * - Approve supplier operations
 * - Approve drying assessments
 * - Authorize packaging or rack assignment
 *
 * Depends On:
 * - read-model-registry.js
 * - trusted-device-store.js
 * - device-context.js
 * - device-types.js
 * - device-state.js
 * - nexfarm-projection.js
 * - drying-projection.js
 *
 * Used By:
 * - main.js
 *
 * Must Never:
 * - Create business events
 * - Update read models directly
 * - Synchronize events
 * - Execute business workflows
 * - Process supplier payments
 * - Perform drying analysis
 */

import {
  registerProjection,
} from "../../core/read-model-registry.js";

import {
  registerTrustedDevice,
} from "../../core/trusted-device-store.js";

import {
  createDeviceContext,
} from "../../core/device-context.js";

import {
  DeviceType,
} from "../../core/device-types.js";

import {
  DeviceState,
} from "../../core/device-state.js";

import {
  NEXFARM_SUPPLIER_DIRECTORY_PROJECTION,
  projectNexFarmSupplierDirectory,
} from "./nexfarm-projection.js";

import {
  NEXFARM_DRYING_CUSTODY_PROJECTION,
  projectNexFarmDryingCustody,
} from "./storage/drying-projection.js";

/**
 * ==========================================================
 * NexFarm Module Registration
 * ==========================================================
 */

export function registerNexFarm() {

  /**
   * Supplier-directory projection.
   *
   * Supports optional supplier registration and
   * supplier-directory read-model updates.
   */
  registerProjection(
    NEXFARM_SUPPLIER_DIRECTORY_PROJECTION,
    projectNexFarmSupplierDirectory,
  );

  /**
   * Drying-custody projection.
   *
   * Supports derived operational visibility for:
   * - Active drying batches
   * - Drying cycles
   * - Returned moisture and weight
   * - Internal drying assessments
   * - Return-to-drying decisions
   * - Loss review
   * - Internal grain loss
   * - Storage-preparation readiness
   */
  registerProjection(
    NEXFARM_DRYING_CUSTODY_PROJECTION,
    projectNexFarmDryingCustody,
  );

  /**
   * Prototype simulation device.
   *
   * This trusted simulator context supports Alpha
   * integration tests only and must not be treated as
   * a production hardware-registration workflow.
   */
  registerTrustedDevice(
    createDeviceContext({
      deviceId:
        "NEXFARM_TEST_DEVICE",

      deviceType:
        DeviceType.SIMULATOR,

      deviceName:
        "NexFarm Prototype Device",

      trusted:
        true,

      registeredAt:
        new Date().toISOString(),

      state:
        DeviceState.TRUSTED,
    }),
  );

}