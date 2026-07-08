/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: nexfarm-ui.js
 * Layer: NexFarm Module
 * NEES: Business Module Execution Layer
 * ==========================================================
 */

import {
  registerNexFarmSupplier,
} from "./nexfarm-service.js";

import {
  registerTrustedDevice,
} from "../../core/trusted-device-store.js";

export function renderNexFarmPrototype() {

  const app =
    document.getElementById("app");

  if (!app) {
    return;
  }

  app.innerHTML = `

    <section>

      <h2>NexFarm Prototype</h2>

      <p>Registered Suppliers:
        <strong id="supplier-count">0</strong>
      </p>

      <button id="register-supplier">

        Register Test Supplier

      </button>

      <ul id="supplier-list"></ul>

    </section>

  `;

  const supplierCount =
    document.getElementById("supplier-count");

  const supplierList =
    document.getElementById("supplier-list");

  const registerButton =
    document.getElementById("register-supplier");

  let totalSuppliers = 0;

  registerButton.addEventListener(

    "click",

    async () => {

      registerTrustedDevice({

        deviceId:
          "NEXFARM_TEST_DEVICE",

        deviceType:
          "simulator",

        deviceName:
          "NexFarm Prototype Device",

        trusted:
          true,

        registeredAt:
          new Date().toISOString(),

      });

      const result =
        await registerNexFarmSupplier({

          context: {

            identity: {

              identityId:
                "NEXFARM_TEST_IDENTITY",

              actorType:
                "employee",

            },

            deviceId:
              "NEXFARM_TEST_DEVICE",

          },

          supplier: {

            supplierId:
              crypto.randomUUID(),

            firstName:
              "John",

            lastName:
              "Farmer",

            nationalId:
              "12345678",

            phone:
              "0712345678",

          },

        });

      if (!result.accepted) {

        console.error(
          "Supplier registration failed.",
          JSON.stringify(result, null, 2),
        );

        return;

      }

      totalSuppliers += 1;

      supplierCount.textContent =
        totalSuppliers;

      const item =
        document.createElement("li");

      item.textContent =
        `Supplier ${totalSuppliers} registered`;

      supplierList.appendChild(item);

      console.log(
        "Supplier registered.",
        result,
      );

    },

  );

}