/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: lifecycle-smoke-test.js
 * Layer: NexFarm Lifecycle
 * NEES: NEM-004A
 * ==========================================================
 *
 * Responsibility:
 * Verify NexFarm lifecycle execution.
 *
 * Depends On:
 * - intake-lifecycle.js
 * - bag-lifecycle.js
 *
 * Used By:
 * - Development diagnostics
 *
 * Must Never:
 * - Execute production workflows
 * - Publish events
 * - Modify inventory
 * - Replace formal testing
 */

import {
  executeIntakeLifecycle,
} from "./intake-lifecycle.js";

import {
  executeBagLifecycle,
} from "./bag-lifecycle.js";

import {
  IntakeStatus,
} from "./intake-status.js";

import {
  BagStatus,
} from "./bag-status.js";

export function runNexFarmLifecycleSmokeTest() {

  const intakeResult =
    executeIntakeLifecycle({

      event: {
        eventType:
          "SUPPLIER_REGISTERED",
      },

      lifecycle: {

        context: {

          currentStatus:
            IntakeStatus.INITIAL,

        },

      },

    });

  const bagResult =
    executeBagLifecycle({

      currentStatus:
        BagStatus.INITIAL,

      nextStatus:
        BagStatus.CREATED,

    });

  return {

    passed:

      intakeResult.accepted === true &&

      bagResult.accepted === true,

    intake:

      intakeResult,

    bag:

      bagResult,

  };

}