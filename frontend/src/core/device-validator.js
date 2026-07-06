/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: device-validator.js
 * Layer: Security & Control Layer
 * NEES: SK-009
 * ==========================================================
 *
 * Responsibility:
 * Validate that an event context originates
 * from a trusted device.
 *
 * Depends On:
 * - trusted-device-store.js
 * - security-errors.js
 *
 * Used By:
 * - security-engine.js
 *
 * Must Never:
 * - Register devices
 * - Authenticate identities
 * - Authorize permissions
 * - Execute business logic
 */

import { isTrustedDevice } from "./trusted-device-store.js";
import { SecurityErrorCode } from "./security-errors.js";

export function validateDeviceSecurity(event) {

  const deviceId = event?.context?.deviceId;

  if (!deviceId) {
    return {
      allowed: false,
      validator: "device",
      code: SecurityErrorCode.DEVICE_REQUIRED,
      reason: "Device context is required."
    };
  }

  if (!isTrustedDevice(deviceId)) {
    return {
      allowed: false,
      validator: "device",
      code: SecurityErrorCode.UNTRUSTED_DEVICE,
      reason: "Device is not trusted."
    };
  }

  return {
    allowed: true,
    validator: "device"
  };

}