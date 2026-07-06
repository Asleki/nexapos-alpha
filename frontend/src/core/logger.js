/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * Core Logger
 * ==========================================================
 *
 * Centralized application logging.
 *
 * Every module should log through this file instead of
 * calling console.log() directly.
 */

import { APP_CONFIG } from "../config/app-config.js";

const PREFIX = `[${APP_CONFIG.APP_NAME}]`;

function timestamp() {
  return new Date().toISOString();
}

export function log(message, data = null) {
  if (!APP_CONFIG.ENABLE_DEBUG_LOGS) return;

  console.log(`${PREFIX} ${timestamp()} INFO: ${message}`, data ?? "");
}

export function warn(message, data = null) {
  console.warn(`${PREFIX} ${timestamp()} WARN: ${message}`, data ?? "");
}

export function error(message, data = null) {
  console.error(`${PREFIX} ${timestamp()} ERROR: ${message}`, data ?? "");
}

export function event(eventName, eventData = null) {
  if (!APP_CONFIG.ENABLE_EVENT_LOGS) return;

  console.log(
    `${PREFIX} ${timestamp()} EVENT: ${eventName}`,
    eventData ?? ""
  );
}