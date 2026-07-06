export function renderAppStatus({ runtimeMode, isOnline }) {
const runtimeModeElement = document.getElementById("runtime-mode");
const connectionStatusElement = document.getElementById("connection-status");

if (runtimeModeElement) {
runtimeModeElement.textContent = "Runtime mode: ${runtimeMode}";
}

if (connectionStatusElement) {
connectionStatusElement.textContent = isOnline
? "Connection status: online"
: "Connection status: offline";
}
}