/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: nexfarm-projection.js
 * Layer: NexFarm Module
 * NEES: Business Module Execution Layer
 * ==========================================================
 *
 * Responsibility:
 * Project NexFarm events into derived read models.
 *
 * Depends On:
 * - None
 *
 * Used By:
 * - Read Model Engine
 * - NexFarm UI
 *
 * Must Never:
 * - Modify source events
 * - Execute kernel logic
 * - Synchronize events
 * - Store source events
 */

export const NEXFARM_SUPPLIER_DIRECTORY_PROJECTION =
  "NEXFARM_SUPPLIER_DIRECTORY_PROJECTION";

export const NEXFARM_SUPPLIER_DIRECTORY_READ_MODEL =
  "NEXFARM_SUPPLIER_DIRECTORY";

export function projectNexFarmSupplierDirectory({
  currentModel,
  event,
}) {
  if (event.eventType !== "SUPPLIER_REGISTERED") {
    return currentModel;
  }

  const supplier = {
    supplierId: event.payload.supplierId,
    firstName: event.payload.firstName,
    lastName: event.payload.lastName,
    nationalId: event.payload.nationalId,
    phone: event.payload.phone,
    status: "registered",
    createdAt: event.timestamp,
  };

  return {
    ...currentModel,
    suppliers: [
      ...(currentModel.suppliers ?? []),
      supplier,
    ],
    totalSuppliers:
      (currentModel.totalSuppliers ?? 0) + 1,
    lastUpdatedAt:
      new Date().toISOString(),
  };
}