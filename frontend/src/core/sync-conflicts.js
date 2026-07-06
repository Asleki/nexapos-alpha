/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: sync-conflicts.js
 * Layer: Sync Orchestration Engine
 * NEES: SK-007 / SK-008
 * ==========================================================
 *
 * Responsibility:
 * Detect synchronization conflict signals.
 *
 * Must Never:
 * - Resolve conflicts autonomously
 * - Modify event payloads
 * - Delete events
 * - Execute business logic
 */

import { event } from "./logger.js";

export function detectSyncConflict(receipt) {
  const hasConflict =
    receipt?.accepted === false ||
    receipt?.status === "conflict" ||
    receipt?.conflict === true;

  if (hasConflict) {
    event("SYNC_CONFLICT_DETECTED", {
      eventId: receipt.eventId ?? null,
      receiptId: receipt.receiptId ?? null,
    });
  }

  return hasConflict;
}

export function createConflictRecord(receipt) {
  return {
    conflictId: crypto.randomUUID(),
    eventId: receipt?.eventId ?? null,
    receiptId: receipt?.receiptId ?? null,
    detectedAt: new Date().toISOString(),
    status: "pending_review",
    source: "sync",
  };
}