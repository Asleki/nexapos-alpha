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
 *
 * Depends On:
 * - schema-validator.js
 * - required-fields-validator.js
 * - payload-validator.js
 * - runtime-validator.js
 * - timestamp-validator.js
 * - duplicate-validator.js
 * - validation-report.js
 *
 * Used By:
 * - event-pipeline.js
 *
 * Must Never:
 * - Queue events
 * - Synchronize events
 * - Modify event payloads
 * - Execute business logic
 */

import { validateSchema } from "./schema-validator.js";
import { validateRequiredFields } from "./required-fields-validator.js";
import { validatePayload } from "./payload-validator.js";
import { validateRuntime } from "./runtime-validator.js";
import { validateTimestamp } from "./timestamp-validator.js";
import { validateDuplicate } from "./duplicate-validator.js";
import { createValidationReport } from "./validation-report.js";

export function validateEvent(event) {

  const checks = [
    validateSchema(event),
    validateRequiredFields(event),
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