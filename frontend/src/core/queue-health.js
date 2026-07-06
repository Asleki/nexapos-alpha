/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: queue-health.js
 * Layer: Offline State Manager
 * NEES: SK-006
 * ==========================================================
 *
 * Responsibility:
 * Monitor the operational health of the local event queue.
 *
 * Depends On:
 * event-queue.js
 * logger.js
 *
 * Used By:
 * Sync Engine
 * Offline State Manager
 * Dashboard
 *
 * Must Never:
 * - Modify queued events
 * - Synchronize data
 * - Execute business logic
 */

import { size } from "./event-queue.js";
import { event } from "./logger.js";

/**
 * Returns queue health information.
 */
export function getQueueHealth() {
  const queueSize = size();

  const health = {
    healthy: true,
    queueSize,
    status: "normal"
  };

  if (queueSize > 100) {
    health.status = "busy";
  }

  if (queueSize > 500) {
    health.status = "critical";
  }

  event("QUEUE_HEALTH_CHECKED", health);

  return health;
}