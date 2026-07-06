/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: offline-health.js
 * Layer: Offline State Manager
 * NEES: SK-006
 * ==========================================================
 *
 * Responsibility:
 * Provide one combined offline readiness report.
 *
 * Depends On:
 * offline-state.js
 * storage-health.js
 * queue-health.js
 *
 * Used By:
 * Application Bootstrap
 * Dashboard
 * Sync Engine
 *
 * Must Never:
 * - Store events
 * - Synchronize events
 * - Modify queued data
 * - Execute business logic
 */

import { isOnline, isOffline } from "./offline-state.js";
import { getStorageHealth } from "./storage-health.js";
import { getQueueHealth } from "./queue-health.js";

export function getOfflineHealth() {
  const storage = getStorageHealth();
  const queue = getQueueHealth();

  return {
    online: isOnline(),
    offline: isOffline(),
    storage,
    queue,
    readyForOfflineEvents: storage.healthy,
  };
}