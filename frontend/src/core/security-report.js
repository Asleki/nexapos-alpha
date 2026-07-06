/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: security-report.js
 * Layer: Security & Control Layer
 * NEES: SK-009
 * ==========================================================
 *
 * Responsibility:
 * Create a standardized security report from
 * security validation results.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - security-engine.js
 *
 * Must Never:
 * - Validate security
 * - Authenticate identities
 * - Execute business logic
 */

export function createSecurityReport({ allowed, checks }) {

  const failedChecks = checks.filter(check => !check.allowed);

  return {
    allowed,

    checkedAt: new Date().toISOString(),

    totalChecks: checks.length,

    passedChecks: checks.length - failedChecks.length,

    failedChecks: failedChecks.length,

    checks,

    errors: failedChecks.map(check => ({
      validator: check.validator,
      reason: check.reason ?? "Security validation failed."
    }))
  };

}