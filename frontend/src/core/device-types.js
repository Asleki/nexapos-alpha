/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: device-types.js
 * Layer: Device Trust Foundation
 * NEES: SK-004
 * ==========================================================
 *
 * Responsibility:
 * Define the supported device types that may
 * participate in NexaPOS operations.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - device-context.js
 * - device-fingerprint.js
 * - Security & Control Layer (SK-009)
 *
 * Must Never:
 * - Register devices
 * - Trust devices
 * - Authenticate devices
 * - Execute business logic
 */

export const DeviceType = Object.freeze({

  POS_TERMINAL: "pos-terminal",

  MOBILE_PHONE: "mobile-phone",

  TABLET: "tablet",

  DESKTOP: "desktop",

  LAPTOP: "laptop",

  SERVER: "server",

  SERVICE: "service",

  SIMULATOR: "simulator"

});