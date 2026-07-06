/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * Storage Foundation
 * ==========================================================
 *
 * Temporary storage layer.
 *
 * Phase 1:
 * Uses browser localStorage.
 *
 * Phase 2:
 * Will migrate to IndexedDB without changing
 * the rest of the application.
 */

const STORAGE_KEY = "nexapos-alpha-events";

/**
 * Save one event.
 */
export async function saveEvent(event) {
  const events = await loadEvents();

  events.push(event);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(events)
  );
}

/**
 * Load all stored events.
 */
export async function loadEvents() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Remove every stored event.
 */
export async function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}