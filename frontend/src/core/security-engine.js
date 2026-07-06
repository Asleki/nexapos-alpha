/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: security-engine.js
 * Layer: Security & Control Layer
 * NEES: SK-009
 * ==========================================================
 *
 * Responsibility:
 * Coordinate all security validation before an
 * operation is allowed to execute.
 *
 * Depends On:
 * - identity-validator.js
 * - session-validator.js
 * - device-validator.js
 * - permission-validator.js
 * - security-report.js
 *
 * Used By:
 * - event-pipeline.js
 * - Future Business Modules
 * - Future API Layer
 *
 * Must Never:
 * - Authenticate identities
 * - Register devices
 * - Execute business logic
 * - Modify event payloads
 */

import { validateIdentitySecurity } from "./identity-validator.js";
import { validateSessionSecurity } from "./session-validator.js";
import { validateDeviceSecurity } from "./device-validator.js";
import { validatePermissionSecurity } from "./permission-validator.js";
import { createSecurityReport } from "./security-report.js";

export function validateSecurity(event) {

  const checks = [
    validateIdentitySecurity(event),
    validateSessionSecurity(event),
    validateDeviceSecurity(event),
    validatePermissionSecurity(event)
  ];

  const allowed = checks.every(check => check.allowed);

  return createSecurityReport({
    allowed,
    checks
  });

}