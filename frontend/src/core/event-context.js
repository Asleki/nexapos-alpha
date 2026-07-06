/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: event-context.js
 * Layer: Identity Foundation
 * NEES: SK-003
 * ==========================================================
 *
 * Responsibility:
 * Create the execution context attached to operational events.
 *
 * Must Never:
 * - Authenticate users
 * - Authorize permissions
 * - Register devices
 * - Execute business logic
 */

import { createIdentityContext } from "./identity-context.js";
import { createSessionContext } from "./session-context.js";

export function createEventContext({
  identity = {},
  session = {},
  deviceId = null,
  traceId = crypto.randomUUID()
} = {}) {

  return Object.freeze({

    identity: createIdentityContext(identity),

    session: createSessionContext(session),

    deviceId,

    traceId,

    createdAt: new Date().toISOString()

  });

}