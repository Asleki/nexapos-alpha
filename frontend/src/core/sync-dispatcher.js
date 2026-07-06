/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: sync-dispatcher.js
 * Layer: Sync Orchestration Engine
 * NEES: SK-007
 * ==========================================================
 *
 * Responsibility:
 * Dispatch queued events to the configured sync destination.
 *
 * Depends On:
 * logger.js
 *
 * Used By:
 * Sync Engine
 *
 * Must Never:
 * - Create business events
 * - Modify event payloads
 * - Decide conflict outcomes
 * - Execute business logic
 */

import { APP_CONFIG } from "../config/app-config.js";
import { event, warn } from "./logger.js";

/**
 * Dispatches one event to the current sync destination.
 *
 * Alpha behavior:
 * - No real backend call.
 * - Simulation acknowledgment only.
 */
export async function dispatchEventForSync(queuedEvent) {
  if (!APP_CONFIG.SYNC_ENABLED) {
    warn("Sync disabled. Returning simulated acknowledgment.", {
      eventId: queuedEvent.eventId,
    });

    return {
      accepted: true,
      simulated: true,
      eventId: queuedEvent.eventId,
      receiptId: crypto.randomUUID(),
      receivedAt: new Date().toISOString(),
      destination: "simulation",
    };
  }

  throw new Error("Live sync dispatch is not implemented in Alpha.");
}

/**
 * Dispatches a batch of events.
 */
export async function dispatchBatchForSync(events) {
  const receipts = [];

  for (const queuedEvent of events) {
    const receipt = await dispatchEventForSync(queuedEvent);
    receipts.push(receipt);
  }

  event("SYNC_BATCH_DISPATCHED", {
    totalEvents: events.length,
    totalReceipts: receipts.length,
  });

  return receipts;
}