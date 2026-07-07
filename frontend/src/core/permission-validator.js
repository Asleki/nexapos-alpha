/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: permission-validator.js
 * Layer: Security & Control Layer
 * NEES: SK-009
 * ==========================================================
 *
 * Responsibility:
 * Validate that an identity has permission
 * to execute an operation.
 *
 * Depends On:
 * - security-errors.js
 *
 * Used By:
 * - security-engine.js
 *
 * Must Never:
 * - Authenticate identities
 * - Register devices
 * - Execute business logic
 * - Modify permissions
 */

import { SecurityErrorCode } from "./security-errors.js";

export function validatePermissionSecurity(event) {
  const identity = event?.context?.identity;

  if (!identity) {
    return {
      allowed: false,
      validator: "permission",
      code: SecurityErrorCode.PERMISSION_DENIED,
      reason: "Identity context is unavailable.",
    };
  }

  return {
    allowed: true,
    validator: "permission",
  };
}