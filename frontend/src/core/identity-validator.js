/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: identity-validator.js
 * Layer: Security & Control Layer
 * NEES: SK-009
 * ==========================================================
 *
 * Responsibility:
 * Validate that an event context contains a usable identity.
 *
 * Depends On:
 * - security-errors.js
 *
 * Used By:
 * - security-engine.js
 *
 * Must Never:
 * - Authenticate identities
 * - Authorize permissions
 * - Validate device trust
 * - Execute business logic
 */

import { SecurityErrorCode } from "./security-errors.js";

export function validateIdentitySecurity(event) {
  const identity = event?.context?.identity;

  if (!identity) {
    return {
      allowed: false,
      validator: "identity",
      code: SecurityErrorCode.IDENTITY_REQUIRED,
      reason: "Identity context is required."
    };
  }

  if (!identity.identityId || !identity.actorType) {
    return {
      allowed: false,
      validator: "identity",
      code: SecurityErrorCode.INVALID_IDENTITY,
      reason: "Identity context is incomplete."
    };
  }

  return {
    allowed: true,
    validator: "identity"
  };
}