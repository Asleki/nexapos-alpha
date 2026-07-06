/**
 * NexaPOS Alpha 1.0
 * Service Worker Foundation
 *
 * Purpose:
 * - Register the PWA foundation.
 * - Prepare for offline-first architecture.
 * - Do NOT cache business data.
 * - Do NOT queue transactions.
 * - Do NOT synchronize events.
 *
 * Those capabilities are implemented later
 * through the Offline State Manager and
 * Sync Orchestration Engine.
 */

const CACHE_NAME = "nexapos-alpha-shell-v1";

const APP_SHELL = [
  "../frontend/",
  "../frontend/index.html",
  "../frontend/src/styles/app.css",
  "../frontend/src/main.js",
  "../frontend/src/app.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  /**
   * Fetch handling intentionally left empty.
   *
   * Offline caching strategies,
   * event persistence,
   * synchronization,
   * conflict resolution,
   * and recovery
   * are implemented in later SK modules.
   */
});