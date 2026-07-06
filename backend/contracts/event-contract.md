# NexaPOS Alpha 1.0

# Event Contract

## Purpose

This document defines the canonical event contract shared across the NexaPOS Alpha 1.0 ecosystem.

Every operational action within NexaPOS is represented as an immutable event.

The event contract provides a stable interface between:

- Frontend (PWA)
- Offline Queue
- Synchronization Engine
- Backend Services
- Analytics Engine
- Financial Engine
- Future NexVox integrations

The event contract is independent of storage technology.

Whether events are stored in IndexedDB, Google Sheets, Supabase, SQL, or another future datastore, the event structure remains consistent.

---

# Core Principles

Every event shall be:

- Immutable
- Timestamped
- Traceable
- Versioned
- Auditable
- Independently identifiable

Events are never modified after creation.

If business information changes, a new event is created.

---

# Required Fields

Every event shall contain:

| Field | Description |
|--------|-------------|
| eventId | Globally unique event identifier |
| eventType | Type of business event |
| timestamp | UTC creation timestamp |
| runtimeMode | Simulation or Live |
| actorId | User or system creating the event |
| deviceId | Trusted device identifier |
| status | Current lifecycle state |
| payload | Business-specific data |

---

# Event Lifecycle

Every event progresses through the following states:

Created

↓

Validated

↓

Queued

↓

Synchronized

↓

Archived

If synchronization fails:

Created

↓

Validated

↓

Queued

↓

Failed

↓

Retry Queue

---

# Event Categories

Examples include:

Sales

Inventory

Finance

Attendance

Payroll

Configuration

Notifications

Security

Synchronization

Simulation

Future modules may introduce additional categories without changing the contract itself.

---

# Payload Rules

The payload contains only business-specific information.

Examples:

Sales

Inventory movements

Financial postings

Attendance records

Configuration values

Simulation parameters

The payload structure depends on the event type.

The outer event structure never changes.

---

# Versioning

Future revisions of the event schema shall remain backward compatible whenever practical.

Breaking changes require:

- new schema version
- migration documentation
- compatibility strategy

---

# Security

Events shall never contain:

Plain-text passwords

API keys

Authentication tokens

Private encryption keys

Sensitive secrets

Sensitive information must be referenced securely rather than embedded inside the event.

---

# Ownership

This document defines the single source of truth for the NexaPOS event structure.

All modules shall conform to this contract.