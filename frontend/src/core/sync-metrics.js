/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: sync-metrics.js
 * Layer: Sync Orchestration Engine
 * NEES: SK-007
 * ==========================================================
 *
 * Responsibility:
 * Track basic synchronization metrics.
 *
 * Must Never:
 * - Dispatch events
 * - Modify events
 * - Resolve conflicts
 * - Execute business logic
 */

import { event } from "./logger.js";

const metrics = {
  totalSyncAttempts: 0,
  totalSuccessfulSyncs: 0,
  totalFailedSyncs: 0,
  totalReceipts: 0,
  lastSyncAt: null,
};

export function recordSyncAttempt() {
  metrics.totalSyncAttempts++;
  metrics.lastSyncAt = new Date().toISOString();

  event("SYNC_METRIC_ATTEMPT_RECORDED", getSyncMetrics());
}

export function recordSuccessfulSync(receiptCount = 0) {
  metrics.totalSuccessfulSyncs++;
  metrics.totalReceipts += receiptCount;
  metrics.lastSyncAt = new Date().toISOString();

  event("SYNC_METRIC_SUCCESS_RECORDED", getSyncMetrics());
}

export function recordFailedSync() {
  metrics.totalFailedSyncs++;
  metrics.lastSyncAt = new Date().toISOString();

  event("SYNC_METRIC_FAILURE_RECORDED", getSyncMetrics());
}

export function getSyncMetrics() {
  return {
    ...metrics,
  };
}