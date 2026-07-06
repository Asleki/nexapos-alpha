/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: session-validator.js
 * Layer: Security & Control Layer
 * NEES: SK-009
 * ==========================================================
 *
 * Responsibility:
 * Validate that an event context contains a valid
 * execution session.
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

export function validateSessionSecurity(event) {

  const session = event?.context?.session;

  if (!session) {
    return {
      allowed: false,
      validator: "session",
      code: SecurityErrorCode.SESSION_REQUIRED,
      reason: "Session context is required."
    };
  }

  if (!session.sessionId) {
    return {
      allowed: false,
      validator: "session",
      code: SecurityErrorCode.INVALID_SESSION,
      reason: "Session identifier is missing."
    };
  }

  if (session.active !== true) {
    return {
      allowed: false,
      validator: "session",
      code: SecurityErrorCode.INVALID_SESSION,
      reason: "Session is inactive."
    };
  }

  return {
    allowed: true,
    validator: "session"
  };

}