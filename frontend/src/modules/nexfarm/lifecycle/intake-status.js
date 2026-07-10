/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: intake-status.js
 * Layer: NexFarm Lifecycle
 * NEES: NEM-004
 * ==========================================================
 */

export const IntakeStatus = Object.freeze({

  INITIAL:
    "initial",

  REGISTERED:
    "registered",

  DELIVERY_STARTED:
    "delivery_started",

  INSPECTED:
    "inspected",

  MOISTURE_TESTED:
    "moisture_tested",

  WEIGHED:
    "weighed",

  PRICE_PREVIEWED:
    "price_previewed",

  OFFER_ACCEPTED:
    "offer_accepted",

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

  COMPLETED:
    "completed",

  REJECTED:
    "rejected",

});