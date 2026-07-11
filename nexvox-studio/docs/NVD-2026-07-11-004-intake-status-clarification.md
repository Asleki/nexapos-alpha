# Engineering Continuity Record: Intake Status Architectural Clarification

**Date:** July 11, 2026, 9:13 AM  
**Status:** Approved Architectural Clarification  
**Target:** NexFarm Lifecycle - `intake-status.js` Architectural Definition

---

## 🎯 Context & Intent
This record defines the architectural rules for `intake-status.js` under Cycle One. The primary intent is to enforce that the `REGISTERED` status represents an optional supplier relationship workflow and is never a mandatory prerequisite for initiating a grain intake.

## 🛠️ Architectural Principles

* **Functional Scope:** The status definitions must be kept immutable and independent of registration logic.
* **Backward Compatibility:** `REGISTERED` remains in the schema but is explicitly documented as optional.
* **Transition Delegation:** The behavioral flexibility (allowing both `INITIAL -> REGISTERED` and `INITIAL -> DELIVERY_STARTED`) is defined in the transition logic, not the status definitions themselves.
* **Separation of Concerns:** `intake-status.js` defines lifecycle vocabulary only and must never execute business logic or validation.

## 🧠 Core Engineering Training Truth for L2
> `REGISTERED` is an optional supplier relationship state, not a mandatory prerequisite for grain intake. Intake may begin directly via `DELIVERY_STARTED`. The status file is a vocabulary definition and must never house execution logic, event publication, or validation routines.
