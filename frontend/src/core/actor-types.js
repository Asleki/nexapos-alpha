/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: actor-types.js
 * Layer: Identity Foundation
 * NEES: SK-003
 * ==========================================================
 *
 * Responsibility:
 * Define the supported actor types that may
 * execute operations within NexaPOS.
 *
 * Must Never:
 * - Store identity information
 * - Authenticate users
 * - Manage sessions
 * - Execute business logic
 */

export const ActorType = Object.freeze({

  USER: "user",

  SYSTEM: "system",

  SERVICE: "service",

  DEVICE: "device",

  SIMULATION: "simulation"

});