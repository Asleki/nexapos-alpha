/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: device-fingerprint.js
 * Layer: Device Trust Foundation
 * NEES: SK-004
 * ==========================================================
 *
 * Responsibility:
 * Generate a stable device fingerprint used by the
 * Device Trust Foundation.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - trusted-device-store.js
 * - Security & Control Layer (SK-009)
 * - Device Registration
 *
 * Must Never:
 * - Authenticate users
 * - Decide device trust
 * - Execute business logic
 * - Contact external services
 */

/**
 * Creates a deterministic device fingerprint.
 *
 * Alpha:
 * Returns a locally generated identifier.
 *
 * Future:
 * May incorporate browser capabilities,
 * hardware characteristics,
 * platform identifiers,
 * and cryptographic hashing.
 */
export function createDeviceFingerprint() {

  return crypto.randomUUID();

}