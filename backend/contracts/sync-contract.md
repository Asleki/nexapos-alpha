# NexaPOS Alpha 1.0

# Sync Contract

## Purpose

This document defines how NexaPOS Alpha 1.0 will synchronize local events with future backend services.

The sync contract ensures that offline-first behavior remains predictable, safe, and auditable.

---

# Core Principle

Local execution comes first.

Server synchronization comes after local persistence.

A user action must never be treated as complete unless it has been safely stored locally or accepted by the server.

---

# Sync Flow

User Action

↓

Create Event

↓

Validate Event

↓

Store Locally

↓

Add to Queue

↓

Attempt Sync

↓

Receive Server Acknowledgment

↓

Update Local Sync Status

---

# Required Sync Fields

Every sync operation shall include:

| Field | Description |
|---|---|
| eventId | Event being synchronized |
| deviceId | Device submitting the event |
| actorId | User or system actor |
| runtimeMode | Simulation or Live |
| timestamp | Original event timestamp |
| retryCount | Number of sync attempts |
| syncStatus | Current sync state |

---

# Sync States

Allowed sync states:

- pending
- syncing
- synced
- failed
- conflict
- rejected

---

# Offline Rule

If network access is unavailable:

- Events remain local
- Events stay in the queue
- Retry is delayed
- No event is deleted
- User interface must show pending state

---

# Server Acknowledgment Rule

An event is not removed from the local queue until the server confirms receipt.

Duplicate submissions must be handled using eventId.

---

# Conflict Rule

If the server detects a conflict:

- The event is marked as conflict
- The conflict is logged
- No silent overwrite is allowed
- Human or rule-based resolution is required

---

# Security Rule

Sync must never transmit:

- passwords
- tokens
- private keys
- raw credentials

Sensitive values must be referenced, masked, hashed, or encrypted according to the security layer.

---

# Simulation Rule

During Alpha 1.0, all sync behavior belongs to simulation mode unless explicitly upgraded later.

No live financial or production sync is enabled in this phase.

---

# Ownership

This sync contract governs all future synchronization behavior across NexaPOS Alpha 1.0.