export const RUNTIME_MODE = Object.freeze({
SIMULATION: "simulation",
LIVE: "live",
});

export const ACTIVE_RUNTIME_MODE = RUNTIME_MODE.SIMULATION;

export function isSimulationMode() {
return ACTIVE_RUNTIME_MODE === RUNTIME_MODE.SIMULATION;
}

export function getRuntimeModeLabel() {
return isSimulationMode() ? "Simulation" : "Live";
}