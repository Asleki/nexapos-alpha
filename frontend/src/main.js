import { renderAppStatus } from "./app.js";
import { getRuntimeModeLabel } from "./config/runtime-mode.js";

function renderCurrentStatus() {
renderAppStatus({
runtimeMode: getRuntimeModeLabel(),
isOnline: navigator.onLine,
});
}

renderCurrentStatus();

window.addEventListener("online", renderCurrentStatus);
window.addEventListener("offline", renderCurrentStatus);