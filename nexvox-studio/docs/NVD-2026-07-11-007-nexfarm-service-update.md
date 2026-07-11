# Engineering Continuity Record: NexFarm Service Orchestration Refinement

**Date:** July 11, 2026, 11:40 AM  
**Status:** Approved Architectural Refinement  
**Target:** NexFarm Module - nexfarm-service.js Architectural Definition

---

## 🎯 Context & Intent
This record formalizes the architectural update to `nexfarm-service.js`. The objective is to enable `startGrainIntake()` to handle the optional supplier registration lifecycle by accepting a `lifecycle` parameter, without coupling the grain intake workflow to mandatory registration.

## 🛠️ Architectural Principles

* **Orchestration Flexibility:** `startGrainIntake()` is updated to accept an optional `lifecycle` parameter (`lifecycle = null`). This allows the function to seamlessly continue a sequence from a `REGISTERED` state or initiate a direct `INITIAL -> DELIVERY_STARTED` path.
* **Deterministic Execution:** The `lifecycle` object is passed into `executeOperation()`, allowing the engine to correctly validate transitions based on the entry point.
* **Minimalist Change Policy:** The update avoids introducing unnecessary state flags (e.g., `supplierRegistrationOptional`) to keep the execution state clean and predictable.
* **Separation of Concerns:** Registration and intake remain independently invoked operations. Registration is never automatically triggered by intake.

## 🧠 Core Engineering Training Truth for L2
> The intake service layer must be agnostic to the entry point (registered vs. unregistered). By passing the `lifecycle` context into the execution engine, we decouple the initiation of grain intake from the optional supplier registration service, fulfilling the Cycle One boundary constraints.
