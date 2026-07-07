# ==========================================================
# NexaPOS Alpha 1.0
# UniFry Reference Architecture
# ==========================================================

Document Type:
Engineering Reference Standard

Purpose:
Defines the official engineering reference architecture
used to build the first complete NexaPOS Alpha business
module (UniFry).

Status:
Reference Implementation

Applies To:
- UniFry
- NexFarm
- NexaSmart Cash
- Finance
- Human Resources
- Administration
- Future NexaPOS Modules

----------------------------------------------------------
1. PURPOSE
----------------------------------------------------------

UniFry is the first complete business module built on the
NexaPOS Alpha platform.

It establishes the engineering patterns every future
business module must follow.

Future modules should inherit this architecture instead of
creating new implementation patterns.

----------------------------------------------------------
2. ENGINEERING PRINCIPLES
----------------------------------------------------------

Every module shall:

• have a single responsibility per file

• isolate business logic from platform logic

• execute through the shared execution pipeline

• never bypass Kernel execution

• never directly manipulate read models

• never synchronize external systems directly

• be independently smoke-tested

----------------------------------------------------------
3. MODULE STRUCTURE
----------------------------------------------------------

modules/

└── module-name/

    ├── execution/

    ├── integration/

    │   ├── lifecycle/

    │   ├── timeline/

    │   ├── event-bus/

    │   └── state/

    ├── lifecycle/

    ├── workflow/

    ├── module-bootstrap.js

    ├── module-events.js

    ├── module-projection.js

    ├── module-service.js

    └── module-ui.js

----------------------------------------------------------
4. EXECUTION PIPELINE
----------------------------------------------------------

User Action

↓

Module UI

↓

Module Service

↓

Kernel Engine

↓

Execution Engine

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

Reactive UI

----------------------------------------------------------
5. LAYER RESPONSIBILITIES
----------------------------------------------------------

Module UI

Responsible for:

• user interaction

• rendering

• collecting input

Must Never:

• execute business rules

• manipulate read models

• publish events

----------------------------------------------------------

Module Service

Responsible for:

• creating business events

• invoking Kernel

• invoking Execution Engine

Must Never:

• orchestrate platform integrations

----------------------------------------------------------

Kernel Engine

Responsible for:

• validation

• permissions

• security

• event acceptance

----------------------------------------------------------

Execution Engine

Responsible for:

• platform orchestration

• coordinating every integration layer

Must Never:

• contain business rules

----------------------------------------------------------

Workflow Integration

Responsible for:

• workflow coordination

• workflow execution

----------------------------------------------------------

Lifecycle Integration

Responsible for:

• lifecycle progression

• transition validation

----------------------------------------------------------

Timeline Integration

Responsible for:

• recording lifecycle history

• timeline entries

----------------------------------------------------------

Event Bus Integration

Responsible for:

• publishing operational events

• notifying subscribers

----------------------------------------------------------

Reactive State Integration

Responsible for:

• updating application state

• propagating observable changes

----------------------------------------------------------

Projection Engine

Responsible for:

• updating read models

• maintaining projections

----------------------------------------------------------

Read Models

Responsible for:

• supplying UI data

• reporting

• dashboards

----------------------------------------------------------
6. STANDARD FILE PATTERN
----------------------------------------------------------

Every new integration should follow:

Context

↓

Integration / Engine

↓

Report

↓

Smoke Test

----------------------------------------------------------
7. SMOKE TEST POLICY
----------------------------------------------------------

Every engineering milestone must include:

• smoke test

• isolated verification

• no UI dependency

• no external services

Smoke tests are temporary verification tools.

After successful validation:

main.js

must be restored to its clean production state before
committing.

----------------------------------------------------------
8. MAIN.JS POLICY
----------------------------------------------------------

main.js must remain responsible only for:

• application startup

• runtime initialization

• offline initialization

• synchronization initialization

• module registration

• UI bootstrap

Temporary smoke tests may be added only during
development.

They must be removed before committing.

----------------------------------------------------------
9. ENGINEERING WORKFLOW
----------------------------------------------------------

Every milestone follows the same sequence.

Build

↓

Smoke Test

↓

Debug

↓

Re-test

↓

Restore main.js

↓

Commit

↓

Proceed

----------------------------------------------------------
10. ARCHITECTURAL PRINCIPLES
----------------------------------------------------------

Business modules must never duplicate platform
orchestration.

Instead they should invoke:

Execution Engine

↓

Platform Pipeline

This ensures every business module shares the same
execution behaviour.

----------------------------------------------------------
11. FUTURE MODULES
----------------------------------------------------------

The following modules shall inherit this architecture.

• UniFry

• NexFarm

• NexaSmart Cash

• Finance

• Human Resources

• Administration

Future modules should extend the platform rather than
modify its foundation.

----------------------------------------------------------
12. CONCLUSION
----------------------------------------------------------

UniFry serves as the official reference implementation
for NexaPOS Alpha.

It demonstrates the engineering conventions,
execution pipeline, integration patterns,
testing workflow, and architectural discipline that
future NexaPOS modules must follow.

Any deviation from this reference architecture should
be deliberate, documented, reviewed, and justified
through future engineering specifications.

==========================================================
END OF DOCUMENT
==========================================================