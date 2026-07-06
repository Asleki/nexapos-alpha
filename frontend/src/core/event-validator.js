/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: event-validator.js
 * Layer: Event Validation Engine
 * NEES: SK-008
 * ==========================================================
 *
 * Responsibility:
 * Coordinate validation of operational events.
 */

import { validateSchema } from "./schema-validator.js";
import { validatePayload } from "./payload-validator.js";
import { validateRuntime } from "./runtime-validator.js";
import { validateTimestamp } from "./timestamp-validator.js";
import { validateDuplicate } from "./duplicate-validator.js";
import { createValidationReport } from "./validation-report.js";

export function validateEvent(event) {

  const checks = [
    validateSchema(event),
    validatePayload(event),
    validateRuntime(event),
    validateTimestamp(event),
    validateDuplicate(event)
  ];

  const valid = checks.every(result => result.valid);

  return createValidationReport({
    valid,
    checks
  });

}