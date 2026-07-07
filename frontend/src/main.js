/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * Application Bootstrap
 * ==========================================================
 */

import { APP_CONFIG } from "./config/app-config.js";

import {
  startOfflineStateManager,
  subscribeToConnectivity
} from "./core/offline-state.js";

import { startSyncTrigger } from "./core/sync-trigger.js";
import { recoverEventQueue } from "./core/queue-recovery.js";
import { getOfflineHealth } from "./core/offline-health.js";
import { log } from "./core/logger.js";

import { registerUniFry } from "./modules/unifry/unifry-bootstrap.js";
import { renderUniFryPrototype } from "./modules/unifry/unifry-ui.js";

const runtimeElement = document.getElementById("runtime-mode");
const connectionElement = document.getElementById("connection-status");

runtimeElement.textContent =
  `Runtime mode: ${APP_CONFIG.DEFAULT_RUNTIME_MODE}`;

subscribeToConnectivity((state) => {
  connectionElement.textContent =
    `Connection status: ${state.isOnline ? "Online" : "Offline"}`;
});

async function bootstrap() {
  startOfflineStateManager();

  startSyncTrigger();

  registerUniFry();

  await recoverEventQueue();

  const health = getOfflineHealth();

  log("Offline Health", health);

  renderUniFryPrototype();

  log("NexaPOS Alpha initialized.");
}

bootstrap();