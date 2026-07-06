/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: validation-report.js
 * Layer: Event Validation Engine
 * NEES: SK-008
 * ==========================================================
 *
 * Responsibility:
 * Create a standardized validation report from validator results.
 *
 * Must Never:
 * - Validate events directly
 * - Queue events
 * - Modify event payloads
 * - Execute business logic
 */

export function createValidationReport({ valid, checks }) {
  const failedChecks = checks.filter((check) => !check.valid);

  return {
    valid,
    checkedAt: new Date().toISOString(),
    totalChecks: checks.length,
    passedChecks: checks.length - failedChecks.length,
    failedChecks: failedChecks.length,
    checks,
    errors: failedChecks.map((check) => ({
      validator: check.validator,
      reason: check.reason ?? "Validation failed."
    }))
  };
}