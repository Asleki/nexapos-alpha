# ==========================================================
# NexaPOS Alpha 1.0
# NexFarm Reference Architecture
# ==========================================================

Document:
Reference Architecture

Module:
NexFarm

Status:
Pre-Coding Architecture

Version:
Alpha 1.0

Purpose:
Define the JavaScript module structure, execution
pattern, read models, projections, integrations,
and smoke-test strategy for implementing NexFarm
inside NexaPOS Alpha 1.0.

This document does not replace the NexFarm Business
Operations Blueprint or the NexFarm Execution Mapping.
It translates those documents into a build-ready
software architecture.

==========================================================
PART I — ARCHITECTURAL POSITION
==========================================================

NexFarm is a business module inside the NexaPOS Alpha
platform.

It must reuse the existing platform foundation:

• System Kernel
• Event Queue
• Execution Engine Pattern
• Workflow Engine Pattern
• Lifecycle Engine Pattern
• Timeline Integration
• Event Bus Integration
• Reactive State Integration
• Projection Engine
• Read Models
• Shared Platform Services

NexFarm must not create a separate execution foundation.

==========================================================
PART II — MODULE DIRECTORY STRUCTURE
==========================================================

NexFarm shall follow the UniFry reference architecture.

frontend/src/modules/nexfarm/

├── execution/
│   ├── execution-context.js
│   ├── execution-engine.js
│   ├── execution-report.js
│   └── execution-smoke-test.js
│
├── integration/
│   ├── event-bus/
│   │   ├── event-bus-context.js
│   │   ├── event-bus-integration.js
│   │   ├── event-bus-report.js
│   │   └── event-bus-smoke-test.js
│   │
│   ├── lifecycle/
│   │   ├── lifecycle-context.js
│   │   ├── lifecycle-integration.js
│   │   ├── lifecycle-report.js
│   │   └── lifecycle-smoke-test.js
│   │
│   ├── state/
│   │   ├── state-context.js
│   │   ├── state-integration.js
│   │   ├── state-report.js
│   │   └── state-smoke-test.js
│   │
│   └── timeline/
│       ├── timeline-context.js
│       ├── timeline-integration.js
│       ├── timeline-report.js
│       └── timeline-smoke-test.js
│
├── lifecycle/
│   ├── intake-lifecycle.js
│   ├── intake-status.js
│   ├── intake-transition.js
│   ├── intake-workflow.js
│   ├── bag-lifecycle.js
│   ├── bag-status.js
│   ├── bag-transition.js
│   ├── bag-timeline.js
│   └── lifecycle-smoke-test.js
│
├── workflow/
│   ├── workflow-context.js
│   ├── workflow-engine.js
│   ├── workflow-events.js
│   ├── workflow-report.js
│   ├── workflow-result.js
│   └── workflow-smoke-test.js
│
├── nexfarm-bootstrap.js
├── nexfarm-events.js
├── nexfarm-projection.js
├── nexfarm-service.js
└── nexfarm-ui.js

==========================================================
PART III — MODULE RESPONSIBILITIES
==========================================================

NexFarm owns:

• Supplier registration workflow
• Supplier lookup
• Grain intake
• Visual inspection
• Moisture testing
• Digital weighing
• Packaging recommendation
• Official bag creation
• QR bag assignment request
• E-Zone management
• Solar drying workflow
• Rack assignment
• Grain inventory movement
• Grain sale workflow
• Dispatch workflow
• Stock count workflow
• NexFarm-specific read models

NexFarm does not own:

• Authentication
• Authorization
• Payments
• Receipt printing
• Notifications
• QR generation engine
• Device trust
• Audit logging
• Synchronization
• Ledger posting
• Treasury sweeps

Those belong to Shared Platform Services.

==========================================================
PART IV — EXECUTION PIPELINE
==========================================================

Every NexFarm operation must use the shared execution
pattern.

User Action

↓

NexFarm UI

↓

NexFarm Service

↓

System Kernel

↓

NexFarm Execution Engine

↓

Workflow Integration

↓

Lifecycle Integration

↓

Timeline Integration

↓

Event Bus Integration

↓

Reactive State Integration

↓

Projection Engine

↓

Read Model

↓

UI Update

No NexFarm screen may bypass this pipeline.

==========================================================
PART V — PRIMARY BUSINESS EVENTS
==========================================================

Initial NexFarm event catalogue:

SUPPLIER_REGISTERED

SUPPLIER_PROFILE_LOADED

GRAIN_DELIVERY_STARTED

GRAIN_VISUALLY_INSPECTED

GRAIN_REJECTED

MOISTURE_TEST_RECORDED

WEIGHT_CAPTURED

PACKAGING_SUGGESTED

BAG_CREATED

BAG_QR_ASSIGNED

EZONE_STOCK_ADDED

EZONE_STOCK_USED

SOLAR_DRYING_ASSIGNED

SOLAR_DRYING_RETESTED

SOLAR_TO_RACK_TRANSFERRED

RACK_ASSIGNED

SUPPLIER_PURCHASE_SUMMARY_CREATED

SUPPLIER_PAYMENT_REQUESTED

SUPPLIER_PAYMENT_CONFIRMED

INTERNAL_HARVEST_RECEIVED

GRAIN_SALE_CREATED

GRAIN_BAG_SCANNED_FOR_SALE

GRAIN_SALE_PAYMENT_REQUESTED

GRAIN_SALE_PAYMENT_CONFIRMED

GRAIN_DISPATCHED

STOCK_COUNT_COMPLETED

EZONE_OPTIMIZATION_COMPLETED

DAILY_GRAIN_REPORT_GENERATED

NEXFARM_DAY_CLOSED

==========================================================
PART VI — LIFECYCLES
==========================================================

NexFarm contains more than one lifecycle.

----------------------------------------------------------
Supplier Intake Lifecycle
----------------------------------------------------------

INITIAL

↓

REGISTERED

↓

DELIVERY_STARTED

↓

INSPECTED

↓

MOISTURE_TESTED

↓

WEIGHED

↓

PACKAGING_READY

↓

SUMMARY_CREATED

↓

PAYMENT_REQUESTED

↓

PAYMENT_CONFIRMED

↓

COMPLETED

Alternative:

INSPECTED

↓

REJECTED

----------------------------------------------------------
Bag Lifecycle
----------------------------------------------------------

INITIAL

↓

CREATED

↓

QR_ASSIGNED

↓

ASSIGNED_TO_EZONE

or

ASSIGNED_TO_SOLAR

or

ASSIGNED_TO_RACK

↓

AVAILABLE

↓

RESERVED_FOR_SALE

↓

DISPATCHED

Alternative:

DAMAGED

↓

ADJUSTMENT_REQUIRED

----------------------------------------------------------
Solar Drying Lifecycle
----------------------------------------------------------

INITIAL

↓

ASSIGNED_TO_SOLAR

↓

DRYING

↓

RETESTED

↓

REWEIGHED

↓

TRANSFERRED_TO_RACK

----------------------------------------------------------
Sale Lifecycle
----------------------------------------------------------

INITIAL

↓

SALE_CREATED

↓

BAG_SCANNED

↓

PAYMENT_REQUESTED

↓

PAYMENT_CONFIRMED

↓

DISPATCHED

↓

COMPLETED

==========================================================
PART VII — WORKFLOW RESPONSIBILITIES
==========================================================

NexFarm workflow layer translates business events into
lifecycle state transitions.

Examples:

GRAIN_DELIVERY_STARTED

↓

DELIVERY_STARTED

MOISTURE_TEST_RECORDED

↓

MOISTURE_TESTED

WEIGHT_CAPTURED

↓

WEIGHED

BAG_CREATED

↓

CREATED

RACK_ASSIGNED

↓

ASSIGNED_TO_RACK

GRAIN_DISPATCHED

↓

DISPATCHED

Workflow files must not update read models directly.

==========================================================
PART VIII — PROJECTIONS
==========================================================

NexFarm projections create current views from events.

Initial projections:

1. Supplier Directory Projection

Source Events:

• SUPPLIER_REGISTERED
• SUPPLIER_PROFILE_LOADED

Read Model:

NEXFARM_SUPPLIER_DIRECTORY

----------------------------------------------------------

2. Active Intake Projection

Source Events:

• GRAIN_DELIVERY_STARTED
• GRAIN_VISUALLY_INSPECTED
• MOISTURE_TEST_RECORDED
• WEIGHT_CAPTURED
• PACKAGING_SUGGESTED
• SUPPLIER_PURCHASE_SUMMARY_CREATED

Read Model:

NEXFARM_ACTIVE_INTAKES

----------------------------------------------------------

3. Grain Inventory Projection

Source Events:

• BAG_CREATED
• BAG_QR_ASSIGNED
• RACK_ASSIGNED
• EZONE_STOCK_ADDED
• EZONE_STOCK_USED
• SOLAR_DRYING_ASSIGNED
• SOLAR_TO_RACK_TRANSFERRED
• GRAIN_DISPATCHED

Read Model:

NEXFARM_GRAIN_INVENTORY

----------------------------------------------------------

4. Rack Inventory Projection

Source Events:

• RACK_ASSIGNED
• GRAIN_DISPATCHED
• STOCK_COUNT_COMPLETED

Read Model:

NEXFARM_RACK_INVENTORY

----------------------------------------------------------

5. E-Zone Projection

Source Events:

• EZONE_STOCK_ADDED
• EZONE_STOCK_USED
• EZONE_OPTIMIZATION_COMPLETED

Read Model:

NEXFARM_EZONE_INVENTORY

----------------------------------------------------------

6. Supplier Payment Projection

Source Events:

• SUPPLIER_PURCHASE_SUMMARY_CREATED
• SUPPLIER_PAYMENT_REQUESTED
• SUPPLIER_PAYMENT_CONFIRMED

Read Model:

NEXFARM_SUPPLIER_PAYMENTS

==========================================================
PART IX — READ MODELS
==========================================================

Initial read models include:

NEXFARM_SUPPLIER_DIRECTORY

NEXFARM_ACTIVE_INTAKES

NEXFARM_GRAIN_INVENTORY

NEXFARM_RACK_INVENTORY

NEXFARM_EZONE_INVENTORY

NEXFARM_SOLAR_DRYING

NEXFARM_SUPPLIER_PAYMENTS

NEXFARM_DAILY_SUMMARY

NEXFARM_MANAGER_DASHBOARD

These are current operational views only.

They are not the source of truth.

Events remain the source of truth.

==========================================================
PART X — SHARED PLATFORM SERVICES
==========================================================

NexFarm shall consume Shared Platform Services.

----------------------------------------------------------
Payment Platform
----------------------------------------------------------

Used for:

• Supplier payments
• Customer grain sale payments

NexFarm uses:

• NexFarm M-Pesa Business Account
• NexFarm DTB Business Account

NexFarm does not use NexaSmart operations for supplier
payments.

----------------------------------------------------------
Receipt & Printing Service
----------------------------------------------------------

Used for:

• Supplier purchase receipt
• Grain sale receipt
• Dispatch note
• Stock count report

----------------------------------------------------------
Notification Service
----------------------------------------------------------

Used for:

• Supplier registration SMS
• Supplier payment confirmation
• Customer sale confirmation
• Manager alerts

----------------------------------------------------------
QR Service
----------------------------------------------------------

Used for:

• Bag QR generation
• Bag QR validation
• Rack scan support

----------------------------------------------------------
Finance / Treasury Service
----------------------------------------------------------

Used for:

• Payment recording
• Ledger posting request
• Daily 60 percent M-Pesa sweep
• Monthly payroll and bill preparation
• Monthly 70 percent parent sweep

----------------------------------------------------------
Audit Service
----------------------------------------------------------

Used for:

• Supplier registration audit
• Weight capture audit
• Moisture test audit
• Inventory movement audit
• Payment request audit
• Stock count audit

==========================================================
PART XI — UI SCREENS
==========================================================

Initial screens:

• NexFarm Dashboard
• Supplier Registration
• Existing Supplier Lookup
• Grain Intake
• Visual Inspection
• Moisture Testing
• CAS Weighing
• Packaging Suggestion
• Bagging and QR Assignment
• E-Zone Management
• Solar Drying
• Rack Assignment
• Supplier Purchase Summary
• Supplier Payment Status
• Grain Inventory
• Grain Sale
• Dispatch
• Stock Count
• Daily Closing
• Manager Dashboard
• Reports

First coding vertical slice should start smaller:

Supplier Registration

↓

Grain Intake

↓

Moisture Test

↓

Weight Capture

↓

Packaging Suggestion

↓

Inventory Receipt

==========================================================
PART XII — FIRST VERTICAL SLICE
==========================================================

The first NexFarm coding milestone should prove:

A supplier can be registered.

A grain delivery can be started.

A moisture result can be recorded.

A weight can be captured.

A packaging suggestion can be generated.

An inventory receipt can be projected into a read model.

This first slice does not need live payments,
printing, QR hardware, real CAS hardware, or live sync.

Simulation values may be used.

==========================================================
PART XIII — MODULE COMPLETION STANDARD
==========================================================

NexFarm is not complete merely because screens render.

The module must demonstrate:

• supplier registration event creation
• grain intake event creation
• moisture event creation
• weight event creation
• packaging event creation
• inventory receipt event creation
• local queue persistence
• lifecycle progression
• timeline recording
• event bus publication
• state update
• read model projection
• UI update
• offline survival
• audit traceability

==========================================================
PART XIV — NON-NEGOTIABLE RULES
==========================================================

NexFarm must never:

• directly write backend records

• bypass the Kernel

• bypass the Event Queue

• directly post ledger entries

• handle NexaSmart cash-out logic

• treat NexaSmart withdrawals as NexFarm payments

• manually type CAS scale weights when hardware is available

• silently change inventory quantities

• delete supplier transactions

• convert simulation events into live events

• mix NexFarm M-Pesa balances with NexaSmart float

==========================================================
PART XV — FUTURE EXTENSIONS
==========================================================

Future NexFarm capabilities may include:

• live CAS scale adapter
• moisture meter adapter
• QR printer adapter
• rack scanning
• automated E-Zone optimization
• supplier portal
• customer portal
• DTB integration
• NexVox AI observation
• storage optimization
• crop production records
• internal harvest analytics
• multi-estate inventory visibility

==========================================================
CONCLUSION
==========================================================

NexFarm shall be implemented as a NexaPOS Alpha
business module following the UniFry reference
architecture.

It owns agricultural workflows and grain operations.

It consumes shared platform services for payments,
printing, notifications, QR, audit, synchronization,
finance, treasury and reporting.

The first coding phase must start with a small vertical
slice and expand only after that slice proves the
shared NexaPOS execution foundation works for
NexFarm.

==========================================================
END OF DOCUMENT
==========================================================