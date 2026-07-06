/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: device-context.js
 * Layer: Device Trust Foundation
 * NEES: SK-004
 * ==========================================================
 *
 * Responsibility:
 * Define the device context carried through
 * NexaPOS execution pipelines.
 *
 * Depends On:
 * - device-types.js
 *
 * Used By:
 * - event-context.js
 * - device-fingerprint.js
 * - trusted-device-store.js
 * - Security & Control Layer (SK-009)
 *
 * Must Never:
 * - Register devices
 * - Approve device trust
 * - Authenticate users
 * - Execute business logic
 */

import { DeviceType } from "./device-types.js";

export function createDeviceContext({
  deviceId = null,
  deviceType = DeviceType.MOBILE_PHONE,
  deviceName = null,
  trusted = false,
  registeredAt = null,
  lastSeenAt = new Date().toISOString(),
} = {}) {
  return Object.freeze({
    deviceId,
    deviceType,
    deviceName,
    trusted,
    registeredAt,
    lastSeenAt,
  });
}