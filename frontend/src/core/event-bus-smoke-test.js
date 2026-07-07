/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: event-bus-smoke-test.js
 * Layer: System Event Bus
 * NEES: NEM-003A
 * ==========================================================
 *
 * Responsibility:
 * Verify that the System Event Bus can publish,
 * notify subscribers, record history, and return
 * a publication report.
 *
 * Depends On:
 * - event-bus.js
 * - event-channels.js
 * - event-history.js
 * - logger.js
 *
 * Used By:
 * - Development diagnostics
 *
 * Must Never:
 * - Execute business logic
 * - Replace formal tests
 * - Persist event history
 * - Synchronize external systems
 */

import {
  publishEvent,
  subscribeEvent,
} from "./event-bus/event-bus.js";

import { EventChannel } from "./event-bus/event-channels.js";
import { getEventHistoryCount } from "./event-bus/event-history.js";
import { log } from "./logger.js";

export function runEventBusSmokeTest() {
  let received = false;

  const unsubscribe = subscribeEvent(
    EventChannel.DIAGNOSTICS,
    (event) => {
      received = event.eventType === "EVENT_BUS_SMOKE_TEST";
    }
  );

  const report = publishEvent({
    channel: EventChannel.DIAGNOSTICS,
    eventType: "EVENT_BUS_SMOKE_TEST",
    payload: {
      purpose: "Verify System Event Bus runtime.",
    },
    metadata: {
      source: "event-bus-smoke-test",
    },
  });

  unsubscribe();

  const result = {
    passed:
      received === true &&
      report.published === true &&
      report.subscriberCount === 1 &&
      getEventHistoryCount() > 0,
    received,
    report,
    historyCount: getEventHistoryCount(),
  };

  log("Event Bus smoke test completed.", result);

  return result;
}