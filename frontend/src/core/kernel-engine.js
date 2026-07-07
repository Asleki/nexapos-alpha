/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: kernel-engine.js
 * Layer: Kernel Integration Layer
 * NEES: SK-001
 * ==========================================================
 *
 * Responsibility:
 * Coordinate the complete NexaPOS kernel execution flow.
 *
 * Depends On:
 * - event-validator.js
 * - security-engine.js
 * - event-pipeline.js
 *
 * Used By:
 * - Future Business Modules
 * - Future API Layer
 * - Future Automation Layer
 *
 * Must Never:
 * - Execute business logic
 * - Authenticate identities
 * - Modify event payloads
 * - Synchronize events directly
 */

import { validateEvent } from "./event-validator.js";
import { validateSecurity } from "./security-engine.js";
import { processEvent } from "./event-pipeline.js";

export async function executeKernel(event) {

  const validation = validateEvent(event);

  if (!validation.valid) {
    return {
      accepted: false,
      stage: "validation",
      validation
    };
  }

  const security = validateSecurity(event);

  if (!security.allowed) {
    return {
      accepted: false,
      stage: "security",
      security
    };
  }

  const pipeline = await processEvent(event);

  return {
    accepted: pipeline.accepted,
    stage: "pipeline",
    validation,
    security,
    pipeline
  };

}