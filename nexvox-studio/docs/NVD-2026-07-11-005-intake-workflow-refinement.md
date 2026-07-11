# Engineering Continuity Record: Intake Workflow Architectural Refinement

**Date:** July 11, 2026, 9:25 AM
**Status:** Approved Architectural Refinement
**Target:** NexFarm Lifecycle - intake-workflow.js Architectural Definition

---

## 🎯 Context & Intent
This record defines the architectural refinement for intake-workflow.js under Cycle One. The primary intent is to maintain the file as a pure event-to-status resolver while clarifying that supplier registration is an optional relationship workflow, not a mandatory prerequisite for grain intake.

## 🛠️ Architectural Principles

* **Resolver Purity:** The file must map immutable business events to lifecycle statuses only. It is strictly prohibited from executing business logic or validating event legality.
* **Transition Delegation:** Legality of transitions (e.g., optional registration vs. direct intake) is handled exclusively by intake-transition.js.
* **Separation of Concerns:** The workflow resolver maps states; the transition engine enforces rules.
* **Phase Isolation:** Commercial transaction events (Drying through Completion) are treated as internal NexFarm custody operations, isolated from supplier registration logic.

## 🧠 Core Engineering Training Truth for L2
> The event-to-status resolver must remain a pure lookup map. It must never decide if an event is allowed. Behavioral changes regarding optional entry points (e.g., INITIAL -> DELIVERY_STARTED vs INITIAL -> REGISTERED) are strictly enforced by the downstream transition engine, preventing architectural bloating in the resolver.
