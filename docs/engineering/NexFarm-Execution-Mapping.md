# ==========================================================
# NexaPOS Alpha 1.0
# NexFarm Execution Mapping
# ==========================================================

Document:
Execution Mapping

Module:
NexFarm

Status:
Engineering Blueprint

Version:
Alpha 1.0

Purpose:
Map every major NexFarm business operation
onto the shared NexaPOS Alpha execution
foundation.

This document does not redefine the business.
It defines how business operations are executed
through the NexaPOS platform.

==========================================================
EXECUTION FOUNDATION
==========================================================

Every NexFarm operation follows the same
execution pipeline.

Business Action

↓

Business Event

↓

System Kernel

↓

Execution Engine

↓

Workflow Engine

↓

Lifecycle Engine

↓

Timeline Integration

↓

Event Bus

↓

Reactive State

↓

Projection Engine

↓

Read Model

↓

User Interface

↓

Shared Platform Services (where required)

↓

Operation Complete

Every business workflow must pass through this
foundation.

==========================================================
1. SUPPLIER REGISTRATION
==========================================================

Business Action

New supplier arrives.

↓

Customer enters:

• Name
• National ID
• Phone

↓

Validation

↓

Business Event

SUPPLIER_REGISTERED

↓

Kernel

↓

Execution Engine

↓

Workflow Engine

↓

Lifecycle

Registration Started

↓

Registration Completed

↓

Timeline

Registration recorded.

↓

Event Bus

Supplier Registered Event published.

↓

State

Supplier state updated.

↓

Projection

Supplier Projection updated.

↓

Read Model

Supplier Directory updated.

↓

UI

Supplier profile displayed.

==========================================================
2. EXISTING SUPPLIER LOOKUP
==========================================================

Business Action

Supplier enters:

Supplier ID

or

Phone Number

↓

Business Event

SUPPLIER_PROFILE_REQUESTED

↓

Kernel

↓

Workflow

↓

Supplier Lookup

↓

Projection

↓

Supplier Read Model

↓

UI

Supplier profile loaded.

==========================================================
3. GRAIN DELIVERY
==========================================================

Business Action

Supplier delivers grain.

↓

Business Event

GRAIN_DELIVERY_STARTED

↓

Kernel

↓

Execution

↓

Workflow

↓

Lifecycle

Delivery Started

↓

Timeline

↓

Event Bus

↓

State

↓

Projection

↓

Read Model

Current Delivery

==========================================================
4. GRAIN INSPECTION
==========================================================

Business Action

Visual inspection.

↓

Business Event

GRAIN_INSPECTED

↓

Kernel

↓

Workflow

↓

Inspection Result

↓

Accepted

or

Rejected

↓

Timeline

↓

Projection

↓

Read Model

Inspection Status

==========================================================
5. MOISTURE TEST
==========================================================

Business Action

Moisture measured.

↓

Business Event

MOISTURE_RECORDED

↓

Kernel

↓

Workflow

↓

Pricing Rules

↓

Timeline

↓

Projection

↓

Read Model

Moisture Result

==========================================================
6. DIGITAL WEIGHING
==========================================================

Business Action

CAS Scale sends weight.

↓

Business Event

WEIGHT_CAPTURED

↓

Kernel

↓

Workflow

↓

Weight Validation

↓

Timeline

↓

Projection

↓

Read Model

Weight Record

==========================================================
7. PACKAGING ENGINE
==========================================================

Business Action

Packaging calculated.

↓

Business Event

PACKAGING_GENERATED

↓

Kernel

↓

Workflow

↓

Packaging Engine

↓

Timeline

↓

Projection

↓

Read Model

Packaging Plan

Example

120 kg

↓

90 kg

25 kg

5 kg E-Zone

==========================================================
8. OFFICIAL BAG CREATION
==========================================================

Business Action

Official bags created.

↓

Business Event

BAG_CREATED

↓

Kernel

↓

Workflow

↓

QR Assignment

↓

Timeline

↓

Projection

↓

Read Model

Bag Inventory

==========================================================
9. E-ZONE MANAGEMENT
==========================================================

Business Action

Partial grain stored.

↓

Business Event

EZONE_UPDATED

↓

Kernel

↓

Workflow

↓

E-Zone Calculation

↓

Timeline

↓

Projection

↓

Read Model

E-Zone Inventory

==========================================================
10. SOLAR DRYING
==========================================================

Business Action

Wet grain assigned.

↓

Business Event

SOLAR_DRYING_ASSIGNED

↓

Kernel

↓

Workflow

↓

Timeline

↓

Projection

↓

Read Model

Solar Inventory

After drying

↓

SOLAR_TRANSFER_COMPLETED

↓

Rack Assignment

==========================================================
11. RACK ASSIGNMENT
==========================================================

Business Action

Bag assigned to rack.

↓

Business Event

RACK_ASSIGNED

↓

Kernel

↓

Workflow

↓

Timeline

↓

Projection

↓

Read Model

Rack Inventory

==========================================================
12. SUPPLIER PAYMENT
==========================================================

Business Action

Purchase summary confirmed.

↓

Business Event

SUPPLIER_PAYMENT_REQUESTED

↓

Kernel

↓

Execution

↓

Workflow

↓

Shared Payment Platform

↓

NexFarm M-Pesa Business Account

↓

Payment Success

↓

Business Event

SUPPLIER_PAYMENT_CONFIRMED

↓

Timeline

↓

Event Bus

↓

State

↓

Projection

↓

Supplier Read Model

↓

Finance Read Model

↓

Receipt Service

↓

Notification Service

==========================================================
13. INVENTORY RECEIPT
==========================================================

Business Action

Inventory accepted.

↓

Business Event

INVENTORY_RECEIVED

↓

Kernel

↓

Workflow

↓

Timeline

↓

Projection

Inventory Projection

↓

Read Model

Available Stock

==========================================================
14. GRAIN SALE
==========================================================

Business Action

Customer purchases grain.

↓

Business Event

SALE_CREATED

↓

Kernel

↓

Workflow

↓

Inventory Validation

↓

Bag Selection

↓

QR Scan

↓

Shared Payment Platform

↓

NexFarm M-Pesa Business Account

↓

Payment Confirmed

↓

Inventory Deduction

↓

Projection

↓

Read Model

Inventory Updated

==========================================================
15. DISPATCH
==========================================================

Business Action

Grain leaves warehouse.

↓

Business Event

DISPATCH_COMPLETED

↓

Kernel

↓

Workflow

↓

Timeline

↓

Projection

↓

Read Model

Dispatch History

==========================================================
16. STOCK COUNT
==========================================================

Business Action

Physical inventory counted.

↓

Business Event

STOCK_COUNT_COMPLETED

↓

Kernel

↓

Workflow

↓

Variance Analysis

↓

Projection

↓

Read Model

Inventory Status

==========================================================
17. DAILY CLOSING
==========================================================

Business Action

Estate closes.

↓

Business Event

NEXFARM_DAY_CLOSED

↓

Kernel

↓

Workflow

↓

Closing Checklist

↓

Inventory Verification

↓

Daily Reports

↓

Synchronization

↓

Read Models Updated

==========================================================
18. DAILY TREASURY FLOW
==========================================================

Customer Payments

↓

NexFarm M-Pesa Business Account

↓

Business Event

DAILY_TREASURY_SWEEP_STARTED

↓

60% Daily Sweep

↓

NexFarm DTB Business Account

↓

Business Event

DAILY_TREASURY_SWEEP_COMPLETED

↓

Finance Projection

↓

Treasury Read Model

==========================================================
19. MONTH-END FINANCIAL FLOW
==========================================================

26th

PAYROLL_PREPARATION_STARTED

↓

Bills Prepared

↓

27th

PAYROLL_EXECUTED

↓

Bills Paid

↓

Using

NexFarm DTB Business Account

↓

28th

MONTHLY_PARENT_SWEEP_STARTED

↓

70% Operating Surplus

↓

Nexa Kenya Limited

Standard Chartered Business Account

↓

MONTHLY_PARENT_SWEEP_COMPLETED

↓

Finance Projection

↓

Executive Dashboard

↓

NexVox AI L1 Observation Layer

(Advisory Only)

==========================================================
20. SHARED PLATFORM SERVICES
==========================================================

NexFarm delegates these responsibilities to
shared platform services:

• Authentication
• Authorization
• Payment Platform
• Notification Service
• Receipt Service
• QR Service
• Audit Service
• Synchronization Service
• Reporting Service
• Finance Ledger Engine
• Treasury Engine

==========================================================
ENGINEERING PRINCIPLE
==========================================================

NexFarm owns agricultural business logic.

The NexaPOS Alpha platform owns execution,
security, payments, synchronization,
reporting, treasury integration, and all
cross-module infrastructure.

This separation ensures that new business
modules can reuse the same execution
foundation without duplicating platform
services.

==========================================================
END OF DOCUMENT
==========================================================