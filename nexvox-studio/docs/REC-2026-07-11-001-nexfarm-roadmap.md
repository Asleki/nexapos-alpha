# Engineering Continuity Record: NexFarm Phase Separation & Domain Boundaries

**Date:** July 11, 2026, 4:47 AM  
**Status:** Approved Architectural Truth  
**Target:** NexFarm / Finance Module Inter-service Communication

---

## 🎯 Context & Intent
Defines how NexaPOS handles complex farming real-world supply patterns (multi-grain drops, partial truckloads, split intervals, and downstream client distribution) without contaminating the clean state machine of the initial `nexapos-alpha` core pipeline.

## 🛠️ Unified Architecture

### Phase 1: Procurement Core (Current Alpha Scope)
* **Question Answered:** *"How does grain securely become verified NexFarm inventory?"*
* **Boundary:** Ends explicitly when physical inventory is formally accepted and legal custody changes hands.
* **Alpha Target Roadmap:**
  1. `Supplier Declined`
  2. `Payment Request`
  3. `Payment Approval / Declined`
  4. `Inventory Accepted`
  5. `Intake Completed`

### Phase 2: Procurement Extensions (Deferred to Finance Engine)
* **Question Answered:** *"How do we track and reconcile complex supplier accounts over time?"*
* **Architectural Rule:** Do not force multi-grain delivery or interval scheduling rules into the intake pipeline. These will be implemented as downstream extensions triggered by event streams parsing into the **Finance Module**.
* **Target Schema Support:** Multi-grain, split-delivery trucks, consolidated ledger payouts.

### Phase 3: Sales & Distribution (Downstream Engine)
* **Question Answered:** *"How does NexFarm execute bulk inventory sales to commercial buyers?"*
* **Boundary:** Runs inversely to procurement. Interacts with a `BUYER` actor schema instead of a `SUPPLIER` schema.

---

## 🧠 Core Engineering Training Truth for L2
> NexFarm does not manage accounting logic. It captures operational events. The incoming Finance Module will asynchronously ingest these event streams to manage accounts payable, credit lines, partial billing cycles, and consolidated payouts. This maintains a highly cohesive, loosely coupled system model.
