/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: security-errors.js
 * Layer: Security & Control Layer
 * NEES: SK-009
 * ==========================================================
 *
 * Responsibility:
 * Define reusable security error codes used by
 * the Security & Control Layer.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - security-engine.js
 * - identity-validator.js
 * - session-validator.js
 * - device-validator.js
 * - permission-validator.js
 *
 * Must Never:
 * - Validate security
 * - Authenticate identities
 * - Execute business logic
 */

export const SecurityErrorCode = Object.freeze({

  IDENTITY_REQUIRED: "IDENTITY_REQUIRED",

  INVALID_IDENTITY: "INVALID_IDENTITY",

  SESSION_REQUIRED: "SESSION_REQUIRED",

  INVALID_SESSION: "INVALID_SESSION",

  DEVICE_REQUIRED: "DEVICE_REQUIRED",

  UNTRUSTED_DEVICE: "UNTRUSTED_DEVICE",

  PERMISSION_DENIED: "PERMISSION_DENIED",

  SECURITY_CHECK_FAILED: "SECURITY_CHECK_FAILED"

});