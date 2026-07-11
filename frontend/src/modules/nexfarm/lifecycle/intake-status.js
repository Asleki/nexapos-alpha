/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: intake-status.js
 * Layer: NexFarm Lifecycle
 * NEES: NEM-004
 * ==========================================================
 *
 * Responsibility:
 * Define the immutable lifecycle statuses for the
 * NexFarm grain intake workflow.
 *
 * Lifecycle statuses represent operational progress
 * of a single grain intake from arrival through
 * storage completion.
 *
 * IMPORTANT:
 * Supplier registration is an optional supplier
 * relationship workflow and is NOT a mandatory
 * prerequisite for starting grain intake.
 *
 * A grain intake may therefore begin:
 *
 * INITIAL
 *      ├── REGISTERED
 *      │       ↓
 *      │  DELIVERY_STARTED
 *      │
 *      └── DELIVERY_STARTED
 *
 * This file defines lifecycle vocabulary only.
 *
 * Must Never:
 * - Execute business logic
 * - Validate workflow transitions
 * - Publish events
 * - Perform supplier registration
 * - Create Nexa IDs
 * - Perform identity matching
 */

export const IntakeStatus = Object.freeze({

  /**
   * ==========================================
   * Initial
   * ==========================================
   */

  INITIAL:
    "initial",

  /**
   * ==========================================
   * Optional Supplier Relationship
   * ==========================================
   *
   * Indicates that the seller has been
   * registered as a recurring NexFarm supplier.
   *
   * This status is OPTIONAL and must never
   * block grain intake.
   */

  REGISTERED:
    "registered",

  /**
   * ==========================================
   * Grain Intake
   * ==========================================
   */

  DELIVERY_STARTED:
    "delivery_started",

  INSPECTED:
    "inspected",

  MOISTURE_TESTED:
    "moisture_tested",

  WEIGHED:
    "weighed",

  /**
   * ==========================================
   * Commercial
   * ==========================================
   */

  PRICE_PREVIEWED:
    "price_previewed",

  OFFER_ACCEPTED:
    "offer_accepted",

  /**
   * ==========================================
   * Internal Drying
   * ==========================================
   */

  DRYING:
    "drying",

  DRYING_ASSESSED:
    "drying_assessed",

  RETURN_TO_DRYING:
    "return_to_drying",

  LOSS_REVIEW:
    "loss_review",

  GRAIN_LOST:
    "grain_lost",

  /**
   * ==========================================
   * Packaging & Storage
   * ==========================================
   */

  PACKAGING_READY:
    "packaging_ready",

  BAGGED:
    "bagged",

  QR_READY:
    "qr_ready",

  STORED:
    "stored",

  EZONE:
    "ezone",

  /**
   * ==========================================
   * Terminal States
   * ==========================================
   */

  COMPLETED:
    "completed",

  REJECTED:
    "rejected",

});