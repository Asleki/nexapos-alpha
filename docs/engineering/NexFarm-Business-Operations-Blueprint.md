# ==========================================================
# NexaPOS Alpha 1.0
# NexFarm Business Operations Blueprint
# ==========================================================

Document:
Business Operations Blueprint

Module:
NexFarm

Status:
Engineering Foundation

Version:
Alpha 1.0

Purpose:
Define the complete operational behaviour of the
NexFarm business before implementation inside
NexaPOS Alpha 1.0.

This document describes the business itself.
It does not describe software architecture.

==========================================================
PART I — WHAT IS NEXFARM
==========================================================

NexFarm is the agricultural business unit of
Nexa Kenya Limited.

Its primary responsibility is to purchase,
process, store and sell agricultural products
while maintaining complete traceability,
inventory accuracy and financial accountability.

Phase 1 focuses on:

• Grain procurement
• Grain storage
• Grain sales

Primary grains include:

• Maize
• Beans

Future expansion includes:

• Sorghum
• Millet
• Green Grams
• Groundnuts
• Other agricultural products

NexFarm operates as part of the larger Nexa
ecosystem and integrates with shared platform
services while maintaining independent business
operations.

==========================================================
PART II — BUSINESS OBJECTIVES
==========================================================

The objectives of NexFarm are:

• Create fair markets for farmers.

• Purchase grain transparently.

• Eliminate manual calculation errors.

• Maintain complete inventory traceability.

• Digitize procurement.

• Support cashless business operations.

• Provide accurate operational reporting.

• Supply other Nexa subsidiaries where required.

==========================================================
PART III — OPERATIONAL MODEL
==========================================================

A typical supplier journey follows the sequence
below.

Supplier Arrives

↓

Supplier Identification

↓

Registration (if required)

↓

Grain Inspection

↓

Moisture Testing

↓

Digital Weighing

↓

Price Calculation

↓

Packaging Recommendation

↓

Official Bag Assignment

↓

QR Assignment

↓

Inventory Registration

↓

Rack / Solar / E-Zone Allocation

↓

Supplier Purchase Summary

↓

Digital Payment Request

↓

Payment Confirmation

↓

Transaction Complete

==========================================================
PART IV — BUSINESS ACTORS
==========================================================

Primary actors include:

External

• New Supplier
• Existing Supplier
• Grain Customer
• Transport Driver

Internal

• Grain Operations Officer
• Warehouse Officer
• Estate Manager
• Finance Officer
• Administrator
• Auditor

System

• NexaPOS Alpha
• Shared Platform Services

==========================================================
PART V — SUPPLIER MANAGEMENT
==========================================================

----------------------------------------------------------
New Supplier
----------------------------------------------------------

A new supplier provides:

• First Name
• Last Name
• National ID
• Phone Number

The system validates the information.

After successful validation:

• Supplier ID is generated.
• Sensitive information is masked.
• Supplier profile becomes available for
  future transactions.

Future identification uses:

• Supplier ID

or

• Phone verification.

----------------------------------------------------------
Existing Supplier
----------------------------------------------------------

Existing suppliers identify themselves using:

• Supplier ID

or

• Phone Number.

The system retrieves the supplier profile
without repeating registration.

==========================================================
PART VI — GRAIN PROCUREMENT
==========================================================

Each grain type follows its own independent
processing workflow.

Example:

Supplier delivers:

120 kg Maize

65 kg Beans

The system creates two procurement workflows.

Workflow A

Maize

Workflow B

Beans

Each workflow maintains independent:

• Inspection
• Moisture
• Pricing
• Packaging
• Inventory
• Traceability

After every workflow completes, the system
creates one consolidated supplier purchase
summary.

==========================================================
PART VII — QUALITY CONTROL
==========================================================

Every grain delivery passes through:

Visual Inspection

↓

Moisture Testing

↓

Digital Weighing

Rejected grain never enters inventory.

Accepted grain continues to procurement.

==========================================================
PART VIII — WEIGHING
==========================================================

Weights are captured directly from the approved
CAS weighing system.

Manual typing of weights is prohibited.

Every captured weight becomes part of the
official procurement record.

==========================================================
PART IX — PACKAGING ENGINE
==========================================================

Packaging decisions are generated by NexaPOS.

Staff never calculate packaging manually.

Example:

120 kg

↓

90 kg Bag

25 kg Bag

5 kg E-Zone

Example:

210 kg

↓

90 kg

↓

90 kg

↓

25 kg

↓

5 kg E-Zone

Packaging recommendations are deterministic and
repeatable.

==========================================================
PART X — OFFICIAL NEXFARM BAGS
==========================================================

Only official NexFarm bags become inventory.

Supported bag sizes include:

• 10 kg
• 25 kg
• 50 kg
• 90 kg

Each bag receives:

• Bag ID
• QR Code
• Grain Type
• Bag Size
• Purchase Batch
• Supplier ID
• Weight
• Date
• Status

Farmer bags never become inventory.

==========================================================
PART XI — QR TRACEABILITY
==========================================================

Every official bag receives a unique identity.

Example:

NF-M-90-000245

Scanning a QR retrieves:

• Grain Type
• Bag Size
• Supplier
• Moisture
• Purchase Batch
• Rack Location
• Current Status

Every inventory movement preserves traceability.

==========================================================
PART XII — E-ZONE MANAGEMENT
==========================================================

E-Zone stores:

• Partial bags
• Overflow grain
• Underweight bags

Example:

Supplier delivers:

20 kg

Existing E-Zone:

5 kg

System recommends:

20 kg

+

5 kg

↓

Create one complete 25 kg bag.

E-Zone optimization follows system
recommendations rather than manual estimation.

==========================================================
PART XIII — SOLAR DRYING
==========================================================

Grain requiring drying follows:

Moisture Test

↓

Payment Calculation

↓

Solar Assignment

↓

Drying

↓

Retest

↓

Reweigh

↓

Rack Assignment

The supplier is paid only once.

Subsequent activities are inventory movements.

==========================================================
PART XIV — RACK MANAGEMENT
==========================================================

Every rack stores one grain type and one bag
size only.

Example:

Rack A

90 kg Maize

Rack B

50 kg Maize

Rack C

25 kg Beans

Rack D

10 kg Beans

Rack locations use standardized addressing.

Example:

M:R2 B4

==========================================================
PART XV — SUPPLIER PAYMENT
==========================================================

After all grain workflows are complete,
NexaPOS generates one consolidated purchase
summary.

Example:

Maize

120 kg

Beans

65 kg

↓

Total Amount Payable

↓

Supplier Confirms

↓

Payment Request Created

↓

Shared Payment Platform

↓

Payment Confirmed

↓

Transaction Completed

NexFarm performs digital supplier payments using
its own business accounts.

These operations are completely independent of
NexaSmart Cash operations.

==========================================================
PART XVI — INVENTORY
==========================================================

Inventory begins only after:

• Procurement complete.
• Packaging complete.
• QR assigned.
• Storage location assigned.

Inventory maintains:

• Quantity
• Bag Identity
• Grain Type
• Rack Location
• Status
• Traceability

==========================================================
PART XVII — GRAIN SALES
==========================================================

Customer selects grain.

↓

Inventory identifies available bags.

↓

Staff scan bag QR.

↓

Inventory reserved.

↓

Payment requested.

↓

Payment confirmed.

↓

Dispatch.

↓

Inventory updated.

==========================================================
PART XVIII — DAILY CLOSING
==========================================================

Daily closing includes:

• Procurement verification.
• Inventory reconciliation.
• E-Zone review.
• Solar transfer verification.
• Rack verification.
• Daily reporting.
• Synchronization.

==========================================================
PART XIX — SHARED PLATFORM SERVICES
==========================================================

NexFarm consumes:

• Authentication
• Authorization
• Payment Platform
• Receipt & Printing
• Notification Service
• QR Service
• Device Service
• Audit Service
• Synchronization Service
• Reporting Service

NexFarm never implements these services itself.

==========================================================
PART XX — BUSINESS OWNERSHIP
==========================================================

NexFarm owns:

• Supplier management
• Grain procurement
• Inspection
• Moisture pricing
• Packaging rules
• Official bag creation
• E-Zone
• Solar drying
• Rack management
• Inventory operations
• Grain sales
• Dispatch
• Agricultural reporting

Everything else is delegated to the shared
platform services.

==========================================================
FOUNDATION PRINCIPLE
==========================================================

NexFarm is an agricultural operations module,
not merely an inventory system.

Its responsibility is to manage the complete
lifecycle of grain procurement, storage,
traceability and sales while integrating with
the shared NexaPOS Alpha execution foundation
without duplicating platform services.

==========================================================
END OF DOCUMENT
==========================================================