/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: unifry-ui.js
 * Layer: UniFry Module
 * NEES: Business Module Execution Layer
 * ==========================================================
 *
 * Responsibility:
 * Render the first UniFry vertical slice UI.
 *
 * Depends On:
 * - unifry-service.js
 * - read-model-store.js
 *
 * Used By:
 * - main.js
 *
 * Must Never:
 * - Validate events
 * - Execute security
 * - Store events directly
 * - Synchronize events
 */

import { createUniFryOrder } from "./unifry-service.js";
import { getReadModel } from "../../core/read-model-store.js";

const DEFAULT_CONTEXT = {
  identity: {
    identityId: "SYSTEM_TEST",
    actorType: "system",
    displayName: "UniFry Prototype",
    estateId: "SIMULATION_ESTATE",
    businessUnit: "UniFry",
  },
  deviceId: "SIMULATED_DEVICE",
};

function renderOrders(container) {
  const model = getReadModel("UNIFRY_ACTIVE_ORDERS") ?? {
    orders: [],
    totalOrders: 0,
  };

  container.innerHTML = `
    <section class="app-shell" aria-label="UniFry prototype">
      <p class="eyebrow">UniFry Prototype</p>
      <h1>Active Orders</h1>

      <p>Total orders: ${model.totalOrders}</p>

      <button id="create-unifry-order" type="button">
        Create Fries Order
      </button>

      <ul>
        ${model.orders
          .map((order) => `
            <li>
              ${order.quantity} × ${order.itemName}
              — ${order.currency} ${order.amount}
              — ${order.status}
            </li>
          `)
          .join("")}
      </ul>
    </section>
  `;

  document
    .getElementById("create-unifry-order")
    ?.addEventListener("click", async () => {
      await createUniFryOrder({
        context: DEFAULT_CONTEXT,
        order: {
          itemName: "Fries",
          quantity: 1,
          amount: 150,
          currency: "KES",
        },
      });

      renderOrders(container);
    });
}

export function renderUniFryPrototype() {
  const app = document.getElementById("app");

  if (!app) {
    return;
  }

  renderOrders(app);
}