/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: sync-receipts.js
 * Layer: Sync Orchestration Engine
 * NEES: SK-007
 * ==========================================================
 *
 * Responsibility:
 * Normalize and store synchronization receipt records in memory.
 *
 * Must Never:
 * - Dispatch events
 * - Modify business event payloads
 * - Resolve conflicts
 * - Execute business logic
 */

import { event } from "./logger.js";

const receipts = [];

export function recordSyncReceipt(receipt) {
  const normalizedReceipt = {
    receiptId: receipt.receiptId ?? crypto.randomUUID(),
    eventId: receipt.eventId,
    accepted: receipt.accepted === true,
    simulated: receipt.simulated === true,
    destination: receipt.destination ?? "unknown",
    receivedAt: receipt.receivedAt ?? new Date().toISOString(),
  };

  receipts.push(normalizedReceipt);

  event("SYNC_RECEIPT_RECORDED", normalizedReceipt);

  return normalizedReceipt;
}

export function getSyncReceipts() {
  return [...receipts];
}

export function clearSyncReceipts() {
  receipts.length = 0;

  event("SYNC_RECEIPTS_CLEARED");
}