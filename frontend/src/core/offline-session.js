/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: offline-session.js
 * Layer: Offline State Manager
 * NEES: SK-006
 * ==========================================================
 *
 * Responsibility:
 * Track the lifecycle of an offline operational session.
 */

import { event } from "./logger.js";
import { isOffline } from "./offline-state.js";

let session = null;

/**
 * Starts an offline session.
 */
export function startOfflineSession() {

  if (!isOffline()) {
    return null;
  }

  if (session) {
    return session;
  }

  session = {
    id: crypto.randomUUID(),
    startedAt: new Date().toISOString()
  };

  event("OFFLINE_SESSION_STARTED", session);

  return session;
}

/**
 * Ends the current offline session.
 */
export function endOfflineSession() {

  if (!session) {
    return null;
  }

  const finished = {
    ...session,
    endedAt: new Date().toISOString()
  };

  event("OFFLINE_SESSION_ENDED", finished);

  session = null;

  return finished;
}

/**
 * Returns the active session.
 */
export function getOfflineSession() {
  return session;
}