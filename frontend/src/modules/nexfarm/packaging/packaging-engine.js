/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: packaging-engine.js
 * Layer: NexFarm Packaging Engine
 * NEES: Business Module Execution Layer
 * ==========================================================
 *
 * Responsibility:
 * Calculate suggested packaging breakdowns for
 * accepted NexFarm grain intake weight.
 *
 * Must Never:
 * - Create business events
 * - Execute Kernel logic
 * - Modify inventory directly
 * - Assign racks
 * - Create QR identities
 * - Approve payments
 */

export const NexFarmBagSizeKg = Object.freeze({
  LARGE_90KG:
    90,

  MEDIUM_50KG:
    50,

  SMALL_25KG:
    25,

  MINI_10KG:
    10,
});

export function suggestPackaging({
  weightKg = 0,
  bagSizes = [
    NexFarmBagSizeKg.LARGE_90KG,
    NexFarmBagSizeKg.MEDIUM_50KG,
    NexFarmBagSizeKg.SMALL_25KG,
    NexFarmBagSizeKg.MINI_10KG,
  ],
} = {}) {

  const normalizedWeight =
    Number(weightKg);

  if (
    Number.isNaN(normalizedWeight) ||
    normalizedWeight <= 0
  ) {
    return Object.freeze({
      accepted: false,
      reason: "INVALID_WEIGHT",
      weightKg,
      suggestedBags: [],
      totalPackagedKg: 0,
      eZoneKg: 0,
    });
  }

  let remainingKg =
    normalizedWeight;

  const suggestedBags =
    [];

  for (const bagSizeKg of bagSizes) {

    const quantity =
      Math.floor(remainingKg / bagSizeKg);

    if (quantity > 0) {
      suggestedBags.push({
        bagSizeKg,
        quantity,
        totalKg:
          quantity * bagSizeKg,
      });

      remainingKg =
        remainingKg -
        quantity * bagSizeKg;
    }

  }

  const eZoneKg =
    Number(remainingKg.toFixed(3));

  const totalPackagedKg =
    Number(
      suggestedBags
        .reduce(
          (total, bag) => total + bag.totalKg,
          0,
        )
        .toFixed(3),
    );

  return Object.freeze({
    accepted: true,
    weightKg:
      normalizedWeight,
    suggestedBags,
    totalPackagedKg,
    eZoneKg,
  });

}