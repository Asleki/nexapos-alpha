/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: intake-status.js
 * Layer: NexFarm Lifecycle
 * NEES: NEM-004
 * ==========================================================
 */

export const IntakeStatus = Object.freeze({
  INITIAL: "initial",
  REGISTERED: "registered",
  DELIVERY_STARTED: "delivery_started",
  INSPECTED: "inspected",
  MOISTURE_TESTED: "moisture_tested",
  WEIGHED: "weighed",
  PACKAGING_READY: "packaging_ready",
  COMPLETED: "completed",
  REJECTED: "rejected",
});