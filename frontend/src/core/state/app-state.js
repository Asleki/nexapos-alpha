/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: app-state.js
 * Layer: Application State Layer
 * NEES: M-002
 * ==========================================================
 *
 * Responsibility:
 * Define the canonical application state used by
 * the NexaPOS runtime.
 *
 * This file defines the structure of state only.
 * It does not store, mutate, or synchronize state.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - state-store.js
 * - state-engine.js
 * - Future UI Components
 *
 * Must Never:
 * - Execute business logic
 * - Store state
 * - Notify subscribers
 * - Synchronize data
 */

export function createInitialAppState() {
  return Object.freeze({

    runtime: {
      mode: "simulation",
      initialized: false,
    },

    connectivity: {
      online: true,
      offline: false,
    },

    identity: null,

    session: null,

    currentEstate: null,

    currentBusinessUnit: null,

    readModels: {},

    notifications: [],

    ui: {
      activeModule: null,
      activeScreen: null,
    },

  });
}