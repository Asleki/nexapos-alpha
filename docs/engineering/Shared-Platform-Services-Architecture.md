# ==========================================================
# NexaPOS Alpha 1.0
# Shared Platform Services Architecture
# ==========================================================

Document Type:
Engineering Architecture Specification

Status:
Active

Version:
Alpha 1.0

Purpose:
Define the shared platform services used by every
NexaPOS Alpha business module.

==========================================================
PART I — PURPOSE
==========================================================

NexaPOS Alpha consists of multiple business modules.

Examples:

• UniFry
• NexFarm
• NexaSmart Cash
• Finance
• Human Resources
• Administration

Instead of every module implementing payments,
printing, notifications, authentication, auditing and
other shared capabilities independently, these
capabilities are centralized into reusable Platform
Services.

Business modules decide WHAT should happen.

Platform Services decide HOW platform capabilities
are executed.

==========================================================
PART II — PLATFORM LAYERS
==========================================================

NexVox AI Layer

• Observation
• Simulation
• Analytics
• Forecasting
• Optimization

↓

Business Modules

• UniFry
• NexFarm
• NexaSmart Cash
• Finance
• Human Resources
• Administration

↓

Shared Platform Services

• Identity
• Authentication
• Authorization
• Payment Platform
• Receipt & Printing
• Notification
• QR
• Device
• Audit
• Synchronization
• Reporting
• Configuration

↓

Platform Execution Foundation

• Kernel
• Execution Engine
• Workflow
• Lifecycle
• Timeline
• Event Bus
• Reactive State
• Projection Engine
• Read Models

↓

Infrastructure

• IndexedDB
• Supabase
• Google Apps Script
• Google Sheets
• Cloud Storage

==========================================================
PART III — SHARED PLATFORM SERVICES
==========================================================

----------------------------------------------------------
Identity Service
----------------------------------------------------------

Responsible for:

• Nexa ID
• Device Identity
• Session Identity
• Actor Identity

Must Never:

• Execute payments
• Execute business workflows

----------------------------------------------------------
Authentication Service
----------------------------------------------------------

Responsible for:

• Login
• Logout
• Session creation
• Session validation
• Session expiration

----------------------------------------------------------
Authorization Service
----------------------------------------------------------

Responsible for:

• Role validation
• Permission validation
• Estate scope
• Business scope
• Feature access

----------------------------------------------------------
Payment Platform
----------------------------------------------------------

Responsible for:

• Payment initiation
• Payment verification
• Payment approval
• Payment confirmation
• Payment references
• Payment reconciliation

Supported methods include:

• Business Till
• Business Paybill
• Business QR
• DTB Account Transfer
• Card
• Future Nexa Wallet
• Future NexaPay

Business modules never communicate directly with
payment providers.

Business modules request:

Payment Request

Platform returns:

Payment Approved

or

Payment Declined

----------------------------------------------------------
Receipt & Printing Service
----------------------------------------------------------

Responsible for generating:

• Customer Receipts
• Supplier Receipts
• Kitchen Tickets
• Dispatch Notes
• Stock Receipts
• Financial Reports
• Payroll Reports

Business modules never communicate directly with
printers.

----------------------------------------------------------
Notification Service
----------------------------------------------------------

Responsible for:

• Success notifications
• Error notifications
• Warning notifications
• Queue notifications
• Approval notifications

Future support:

• SMS
• Email
• WhatsApp
• Push Notifications

----------------------------------------------------------
QR Service
----------------------------------------------------------

Responsible for:

• QR generation
• QR validation
• QR decoding
• QR lifecycle management

Future support:

• NexTag

----------------------------------------------------------
Device Service
----------------------------------------------------------

Responsible for:

• Device registration
• Device trust
• Device validation
• Device health
• Device lifecycle

----------------------------------------------------------
Audit Service
----------------------------------------------------------

Responsible for:

• Immutable audit logs
• Compliance history
• Investigation support
• Activity history

Business modules never write audit records directly.

----------------------------------------------------------
Synchronization Service
----------------------------------------------------------

Responsible for:

• Offline synchronization
• Conflict resolution
• Queue synchronization
• Retry scheduling
• Recovery

----------------------------------------------------------
Reporting Service
----------------------------------------------------------

Responsible for:

• Shared reporting
• Dashboard aggregation
• Export generation
• Analytics support

----------------------------------------------------------
Configuration Service
----------------------------------------------------------

Responsible for:

• Runtime configuration
• Feature flags
• Estate configuration
• Module configuration

==========================================================
PART IV — MODULE RELATIONSHIP
==========================================================

Business Module

↓

Platform Service

↓

Kernel

↓

Execution Engine

↓

Workflow

↓

Lifecycle

↓

Timeline

↓

Event Bus

↓

Reactive State

↓

Projection

↓

Read Models

Example:

UniFry

↓

Payment Platform

↓

Execution Pipeline

Example:

NexFarm

↓

Receipt & Printing Service

↓

Execution Pipeline

==========================================================
PART V — OWNERSHIP
==========================================================

Business Modules own:

• Business rules
• Business workflows
• Business events
• Operational decisions

Platform Services own:

• Payments
• Printing
• Notifications
• Authentication
• Authorization
• QR
• Synchronization
• Auditing
• Device management
• Reporting
• Configuration

This separation prevents duplication across
business modules.

==========================================================
PART VI — FUTURE PLATFORM SERVICES
==========================================================

Future shared services may include:

• NexVox AI Gateway
• Simulation Service
• Digital Signature Service
• Media Service
• Geolocation Service
• Cold Storage Service
• Machine Vision Service (NexTag)
• AI Inference Gateway

Future services should extend the platform without
changing business module architecture.

==========================================================
CONCLUSION
==========================================================

Shared Platform Services provide the reusable
foundation upon which every NexaPOS Alpha business
module operates.

Business modules remain focused on domain-specific
operations while cross-cutting platform capabilities
are centralized into reusable services.

This architecture promotes consistency,
maintainability, scalability, and long-term evolution
of the NexaPOS ecosystem.

==========================================================
END OF DOCUMENT
==========================================================