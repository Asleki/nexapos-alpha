/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: trusted-device-store.js
 * Layer: Device Trust Foundation
 * NEES: SK-004
 * ==========================================================
 *
 * Responsibility:
 * Manage the local registry of trusted devices.
 *
 * Depends On:
 * - device-state.js
 *
 * Used By:
 * - Security & Control Layer (SK-009)
 * - Device Registration
 * - Device Validation
 *
 * Must Never:
 * - Authenticate users
 * - Execute business logic
 * - Synchronize with remote services
 * - Modify event payloads
 */

const trustedDevices = new Map();

/**
 * Register or update a trusted device.
 */
export function registerTrustedDevice(device) {

  trustedDevices.set(device.deviceId, device);

  return device;

}

/**
 * Retrieve a trusted device.
 */
export function getTrustedDevice(deviceId) {

  return trustedDevices.get(deviceId) ?? null;

}

/**
 * Determine whether a device is trusted.
 */
export function isTrustedDevice(deviceId) {

  return trustedDevices.has(deviceId);

}

/**
 * Remove a trusted device.
 */
export function revokeTrustedDevice(deviceId) {

  trustedDevices.delete(deviceId);

}

/**
 * Return all trusted devices.
 */
export function listTrustedDevices() {

  return Array.from(trustedDevices.values());

}