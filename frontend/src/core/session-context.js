/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: session-context.js
 * Layer: Identity Foundation
 * NEES: SK-003
 * ==========================================================
 *
 * Responsibility:
 * Define the execution session context for
 * NexaPOS operations.
 *
 * Must Never:
 * - Authenticate identities
 * - Authorize permissions
 * - Manage devices
 * - Execute business logic
 */

export function createSessionContext({
  sessionId = crypto.randomUUID(),
  startedAt = new Date().toISOString(),
  expiresAt = null,
  runtimeMode = "simulation",
  active = true
} = {}) {

  return Object.freeze({

    sessionId,

    startedAt,

    expiresAt,

    runtimeMode,

    active

  });

}