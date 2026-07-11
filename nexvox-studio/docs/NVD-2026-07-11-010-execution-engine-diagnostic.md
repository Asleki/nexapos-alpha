# Engineering Continuity Record: Execution Engine Diagnostic Strategy

**Date:** July 11, 2026, 6:45 PM  
**Status:** Approved Diagnostic Path  
**Target:** Execution Layer - execution-engine.js Lifecycle Validation

---

## 🎯 Context & Intent
Following the diagnostic analysis of the NexFarm Cycle One integration, we have isolated the `SUPPLIER_REGISTERED` kernel rejection to the lifecycle transition layer rather than the service layer. This record defines the transition from `nexfarm-service.js` inspection to the `execution/execution-engine.js` validation layer.

## 🛠️ Architectural Principles

* **Transition Integrity:** The Execution Engine is the final arbiter of valid lifecycle movements. It must correctly initialize `null` lifecycle states to `INITIAL` to prevent invalid transition errors.
* **Separation of Logic:** Engine-level validation is distinct from Service-level orchestration. We avoid modifying Service methods to compensate for Engine-level transition failures.
* **Deterministic Debugging:** We verify how `executeOperation()` resolves the lifecycle object and whether the `isValidIntakeTransition()` logic is correctly configured for the `NEXFARM_SUPPLIER_REGISTERED_WORKFLOW`.

## 🧠 Core Engineering Training Truth for L2
> Architectural problems in a state-machine-driven system are rarely in the service orchestrator if the event creation is successful. The failure lies in how the execution engine interprets the starting state. By moving to `execution-engine.js`, we align with the principle of identifying the root cause at the point of decision, rather than patching the orchestrator.
