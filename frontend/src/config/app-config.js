/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * Application Configuration
 * ==========================================================
 *
 * This file defines global application configuration.
 *
 * All modules should read configuration from here instead of
 * hardcoding values throughout the codebase.
 */

export const APP_CONFIG = Object.freeze({

  /**
   * Application
   */
  APP_NAME: "NexaPOS Alpha",

  APP_VERSION: "1.0.0-alpha",

  COMPANY_NAME: "Nexa Kenya Limited",

  /**
   * Runtime
   */
  DEFAULT_RUNTIME_MODE: "simulation",

  /**
   * Localization
   */
  DEFAULT_LANGUAGE: "en",

  DEFAULT_TIMEZONE: "Africa/Nairobi",

  DEFAULT_CURRENCY: "KES",

  /**
   * Synchronization
   */
  SYNC_ENABLED: false,

  AUTO_SYNC_INTERVAL_SECONDS: 30,

  /**
   * Logging
   */
  ENABLE_DEBUG_LOGS: true,

  ENABLE_EVENT_LOGS: true,

  /**
   * Offline
   */
  OFFLINE_ENABLED: true,

  /**
   * Security
   */
  REQUIRE_DEVICE_REGISTRATION: true,

  REQUIRE_USER_AUTHENTICATION: true

});