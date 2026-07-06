/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: storage-health.js
 * Layer: Offline State Manager
 * NEES: SK-006
 * ==========================================================
 *
 * Responsibility:
 * Monitor the health of local application storage.
 *
 * Depends On:
 * logger.js
 *
 * Used By:
 * Event Queue
 * Persistent Event Queue
 * Sync Engine
 *
 * Must Never:
 * - Store business events
 * - Synchronize data
 * - Execute business logic
 */

import { event, error } from "./logger.js";

const STORAGE_TEST_KEY = "__nexapos_storage_test__";

/**
 * Checks whether browser storage is available.
 */
export function checkStorageHealth() {
  try {
    localStorage.setItem(STORAGE_TEST_KEY, "ok");
    localStorage.removeItem(STORAGE_TEST_KEY);

    event("STORAGE_HEALTH_OK");

    return {
      healthy: true,
      storage: "localStorage",
      message: "Storage is available."
    };

  } catch (err) {

    error("Storage health check failed.", err);

    return {
      healthy: false,
      storage: "localStorage",
      message: "Storage is unavailable."
    };
  }
}

/**
 * Returns a simple storage health summary.
 */
export function getStorageHealth() {
  return checkStorageHealth();
}