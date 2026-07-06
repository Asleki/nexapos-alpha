/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: device-state.js
 * Layer: Device Trust Foundation
 * NEES: SK-004
 * ==========================================================
 *
 * Responsibility:
 * Define the lifecycle states of devices known
 * to the NexaPOS kernel.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - trusted-device-store.js
 * - Security & Control Layer (SK-009)
 *
 * Must Never:
 * - Register devices
 * - Authenticate devices
 * - Evaluate permissions
 * - Execute business logic
 */

export const DeviceState = Object.freeze({

  NEW: "new",

  REGISTERED: "registered",

  TRUSTED: "trusted",

  SUSPENDED: "suspended",

  REVOKED: "revoked",

  UNKNOWN: "unknown"

});