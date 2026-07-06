/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: identity-context.js
 * Layer: Identity Foundation
 * NEES: SK-003
 * ==========================================================
 *
 * Responsibility:
 * Define the identity context carried through
 * the NexaPOS execution pipeline.
 *
 * Must Never:
 * - Authenticate identities
 * - Manage sessions
 * - Authorize permissions
 * - Execute business logic
 */

import { ActorType } from "./actor-types.js";

export function createIdentityContext({
  identityId = null,
  actorType = ActorType.USER,
  displayName = null,
  estateId = null,
  businessUnit = null
} = {}) {

  return Object.freeze({

    identityId,

    actorType,

    displayName,

    estateId,

    businessUnit

  });

}