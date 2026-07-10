/**
 * ==========================================================
 * NexaPOS Alpha 1.0
 * File: nexfarm-service.js
 * Layer: NexFarm Module
 * NEES: Business Module Execution Layer
 * ==========================================================
 *
 * Responsibility:
 * Execute NexFarm business operations through
 * the NexaPOS live operational pipeline.
 *
 * Depends On:
 * - nexfarm-events.js
 * - kernel-engine.js
 * - read-model-engine.js
 * - execution-engine.js
 * - nexfarm-projection.js
 * - packaging-engine.js
 * - qr-engine.js
 * - rack-engine.js
 * - drying-engine.js
 *
 * Used By:
 * - NexFarm UI
 * - Temporary integration tests
 *
 * Must Never:
 * - Validate events
 * - Execute security directly
 * - Store events directly
 * - Synchronize events
 */

import { executeKernel } from "../../core/kernel-engine.js";
import { updateReadModel } from "../../core/read-model-engine.js";

import {
  createSupplierRegisteredEvent,
  createGrainIntakeStartedEvent,
  createGrainTypeSelectedEvent,
  createMoistureTestRecordedEvent,
  createWeightCapturedEvent,
  createPricePreviewCreatedEvent,
  createSupplierAcceptedOfferEvent,
  createPackagingSuggestedEvent,
  createBagCreatedEvent,
  createQrAssignedEvent,
  createRackAssignedEvent,
  createSolarDryingAssignedEvent,
  createInternalDryingAssessmentRecordedEvent,
  createInternalLossReviewRequiredEvent,
  createInternalGrainLossRecordedEvent,
  createEZoneAssignedEvent,
} from "./nexfarm-events.js";

import {
  executeOperation,
} from "./execution/execution-engine.js";

import {
  suggestPackaging,
} from "./packaging/packaging-engine.js";

import {
  createBagQrPayload,
  encodeBagQrValue,
  createPrintableBagLabel,
} from "./storage/qr-engine.js";

import {
  suggestRackAssignment,
} from "./storage/rack-engine.js";

import {
  analyzeDryingResult,
} from "./storage/drying-engine.js";

import {
  NEXFARM_SUPPLIER_DIRECTORY_PROJECTION,
  NEXFARM_SUPPLIER_DIRECTORY_READ_MODEL,
} from "./nexfarm-projection.js";

/**
 * ==========================================================
 * Supplier Registration
 * ==========================================================
 */

export async function registerNexFarmSupplier({
  context = {},
  supplier = {},
} = {}) {

  const workflow =
    "NEXFARM_SUPPLIER_REGISTERED_WORKFLOW";

  const event =
    createSupplierRegisteredEvent({
      context,
      ...supplier,
    });

  const kernelResult =
    await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const projectionResult =
    updateReadModel({
      projectionName:
        NEXFARM_SUPPLIER_DIRECTORY_PROJECTION,

      readModelName:
        NEXFARM_SUPPLIER_DIRECTORY_READ_MODEL,

      event,

      initialState: {
        suppliers: [],
        totalSuppliers: 0,
      },
    });

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel: kernelResult,
      projection: projectionResult,
      state: {
        updated:
          projectionResult.projected === true,
      },
    });

  return {
    accepted:
      executionResult.accepted === true,

    kernel:
      kernelResult,

    projection:
      projectionResult,

    execution:
      executionResult,
  };

}

/**
 * ==========================================================
 * Grain Intake
 * ==========================================================
 */

export async function startGrainIntake({
  context = {},
  intake = {},
} = {}) {

  const workflow =
    "NEXFARM_GRAIN_INTAKE_STARTED_WORKFLOW";

  const event =
    createGrainIntakeStartedEvent({
      context,
      ...intake,
    });

  const kernelResult =
    await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel: kernelResult,
      projection: null,
      state: {
        updated: true,
        intakeStarted: true,
      },
    });

  return {
    accepted:
      executionResult.accepted === true,

    kernel:
      kernelResult,

    projection:
      null,

    execution:
      executionResult,
  };

}

export async function selectGrainType({
  context = {},
  intake = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_GRAIN_TYPE_SELECTED_WORKFLOW";

  const event =
    createGrainTypeSelectedEvent({
      context,
      ...intake,
    });

  const kernelResult =
    await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel: kernelResult,
      lifecycle,
      projection: null,
      state: {
        updated: true,
        grainTypeSelected: true,
      },
    });

  return {
    accepted:
      executionResult.accepted === true,

    kernel:
      kernelResult,

    projection:
      null,

    execution:
      executionResult,
  };

}

export async function recordMoistureTest({
  context = {},
  intake = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_MOISTURE_TEST_RECORDED_WORKFLOW";

  const event =
    createMoistureTestRecordedEvent({
      context,
      ...intake,
    });

  const kernelResult =
    await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel: kernelResult,
      lifecycle,
      projection: null,
      state: {
        updated: true,
        moistureTestRecorded: true,

        measurementStage:
          event.payload?.measurementStage ??
          null,
      },
    });

  return {
    accepted:
      executionResult.accepted === true,

    kernel:
      kernelResult,

    projection:
      null,

    execution:
      executionResult,
  };

}

export async function captureWeight({
  context = {},
  intake = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_WEIGHT_CAPTURED_WORKFLOW";

  const event =
    createWeightCapturedEvent({
      context,
      ...intake,
    });

  const kernelResult =
    await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel: kernelResult,
      lifecycle,
      projection: null,
      state: {
        updated: true,
        weightCaptured: true,

        measurementStage:
          event.payload?.measurementStage ??
          null,
      },
    });

  return {
    accepted:
      executionResult.accepted === true,

    kernel:
      kernelResult,

    projection:
      null,

    execution:
      executionResult,
  };

}

/**
 * ==========================================================
 * Supplier Commercial Flow
 * ==========================================================
 */

export async function createPricePreview({
  context = {},
  intake = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_PRICE_PREVIEW_CREATED_WORKFLOW";

  const event =
    createPricePreviewCreatedEvent({
      context,
      ...intake,
    });

  const kernelResult =
    await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel: kernelResult,
      lifecycle,
      projection: null,
      state: {
        updated: true,
        pricePreviewCreated: true,
      },
    });

  return {
    accepted:
      executionResult.accepted === true,

    kernel:
      kernelResult,

    projection:
      null,

    execution:
      executionResult,
  };

}

export async function acceptSupplierOffer({
  context = {},
  intake = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_SUPPLIER_ACCEPTED_OFFER_WORKFLOW";

  const event =
    createSupplierAcceptedOfferEvent({
      context,
      ...intake,
    });

  const kernelResult =
    await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel: kernelResult,
      lifecycle,
      projection: null,
      state: {
        updated: true,
        supplierAcceptedOffer: true,
      },
    });

  return {
    accepted:
      executionResult.accepted === true,

    kernel:
      kernelResult,

    projection:
      null,

    execution:
      executionResult,
  };

}

/**
 * ==========================================================
 * Packaging
 * ==========================================================
 */

export async function suggestNexFarmPackaging({
  context = {},
  intake = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_PACKAGING_SUGGESTED_WORKFLOW";

  const packagingInput = {
    weightKg:
      intake.weightKg,
  };

  if (Array.isArray(intake.bagSizes)) {
    packagingInput.bagSizes =
      intake.bagSizes;
  }

  const packagingResult =
    suggestPackaging(packagingInput);

  if (!packagingResult.accepted) {
    return {
      accepted: false,
      kernel: null,
      projection: null,
      execution: null,
      packaging: packagingResult,
    };
  }

  const event =
    createPackagingSuggestedEvent({
      context,
      ...intake,

      suggestedBags:
        packagingResult.suggestedBags,

      totalPackagedKg:
        packagingResult.totalPackagedKg,

      eZoneKg:
        packagingResult.eZoneKg,
    });

  const kernelResult =
    await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
      packaging: packagingResult,
    };
  }

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel: kernelResult,
      lifecycle,
      projection: null,
      state: {
        updated: true,
        packagingSuggested: true,

        totalPackagedKg:
          packagingResult.totalPackagedKg,

        eZoneKg:
          packagingResult.eZoneKg,
      },
    });

  return {
    accepted:
      executionResult.accepted === true,

    kernel:
      kernelResult,

    projection:
      null,

    execution:
      executionResult,

    packaging:
      packagingResult,
  };

}

export async function createNexFarmBag({
  context = {},
  bag = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_BAG_CREATED_WORKFLOW";

  const event =
    createBagCreatedEvent({
      context,
      ...bag,
    });

  const kernelResult =
    await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel: kernelResult,
      lifecycle,
      projection: null,
      state: {
        updated: true,
        bagCreated: true,
      },
    });

  return {
    accepted:
      executionResult.accepted === true,

    kernel:
      kernelResult,

    projection:
      null,

    execution:
      executionResult,
  };

}

/**
 * ==========================================================
 * QR Identity
 * ==========================================================
 */

export async function assignQrToNexFarmBag({
  context = {},
  bag = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_QR_ASSIGNED_WORKFLOW";

  const qrPayloadResult =
    createBagQrPayload({
      bagId:
        bag.bagId,

      labelCode:
        bag.labelCode ??
        bag.bagId,

      intakeId:
        bag.intakeId,

      grainType:
        bag.grainType,

      bagSizeKg:
        bag.bagSizeKg,

      actualWeightKg:
        bag.actualWeightKg,

      estateId:
        bag.estateId ??
        null,
    });

  if (!qrPayloadResult.accepted) {
    return {
      accepted: false,
      kernel: null,
      projection: null,
      execution: null,
      qr: qrPayloadResult,
    };
  }

  const qrValueResult =
    encodeBagQrValue({
      payload:
        qrPayloadResult.payload,
    });

  if (!qrValueResult.accepted) {
    return {
      accepted: false,
      kernel: null,
      projection: null,
      execution: null,
      qr: qrValueResult,
    };
  }

  const labelResult =
    createPrintableBagLabel({
      payload:
        qrPayloadResult.payload,

      qrValue:
        qrValueResult.qrValue,
    });

  if (!labelResult.accepted) {
    return {
      accepted: false,
      kernel: null,
      projection: null,
      execution: null,
      qr: labelResult,
    };
  }

  const labelCode =
    bag.labelCode ??
    bag.bagId;

  const event =
    createQrAssignedEvent({
      context,
      ...bag,
      labelCode,

      qrPayload:
        qrPayloadResult.payload,

      qrValue:
        qrValueResult.qrValue,

      printableLabel:
        labelResult.label,
    });

  const kernelResult =
    await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,

      qr: {
        payload:
          qrPayloadResult,

        value:
          qrValueResult,

        label:
          labelResult,
      },
    };
  }

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel: kernelResult,
      lifecycle,
      projection: null,
      state: {
        updated: true,
        qrAssigned: true,
      },
    });

  return {
    accepted:
      executionResult.accepted === true,

    kernel:
      kernelResult,

    projection:
      null,

    execution:
      executionResult,

    qr: {
      payload:
        qrPayloadResult,

      value:
        qrValueResult,

      label:
        labelResult,
    },
  };

}

/**
 * ==========================================================
 * Rack Storage
 * ==========================================================
 */

export async function assignRackToNexFarmBag({
  context = {},
  bag = {},
  rack = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_RACK_ASSIGNED_WORKFLOW";

  const rackResult =
    suggestRackAssignment({
      grainType:
        bag.grainType,

      bagSizeKg:
        bag.bagSizeKg,

      availableLocations:
        rack.availableLocations ??
        [],
    });

  if (!rackResult.accepted) {
    return {
      accepted: false,
      kernel: null,
      projection: null,
      execution: null,
      rack: rackResult,
    };
  }

  const event =
    createRackAssignedEvent({
      context,
      ...bag,

      rackSection:
        rackResult.location.rackSection,

      row:
        rackResult.location.row,

      column:
        rackResult.location.column,

      locationCode:
        rackResult.location.locationCode,
    });

  const kernelResult =
    await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
      rack: rackResult,
    };
  }

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel: kernelResult,
      lifecycle,
      projection: null,
      state: {
        updated: true,
        rackAssigned: true,
      },
    });

  return {
    accepted:
      executionResult.accepted === true,

    kernel:
      kernelResult,

    projection:
      null,

    execution:
      executionResult,

    rack:
      rackResult,
  };

}

/**
 * ==========================================================
 * Solar Drying Assignment
 * ==========================================================
 */

export async function assignSolarDrying({
  context = {},
  drying = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_SOLAR_DRYING_ASSIGNED_WORKFLOW";

  const event =
    createSolarDryingAssignedEvent({
      context,
      ...drying,
    });

  const kernelResult =
    await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel: kernelResult,
      lifecycle,
      projection: null,
      state: {
        updated: true,
        solarDryingAssigned: true,

        dryingCycle:
          event.payload?.dryingCycle ??
          1,
      },
    });

  return {
    accepted:
      executionResult.accepted === true,

    kernel:
      kernelResult,

    projection:
      null,

    execution:
      executionResult,
  };

}

/**
 * ==========================================================
 * Internal Drying Assessment
 * ==========================================================
 */

export async function recordInternalDryingAssessment({
  context = {},
  drying = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_INTERNAL_DRYING_ASSESSMENT_RECORDED_WORKFLOW";

  const dryingResult =
    analyzeDryingResult({
      beforeDryingWeightKg:
        drying.beforeDryingWeightKg,

      afterDryingWeightKg:
        drying.afterDryingWeightKg,

      moistureBefore:
        drying.moistureBefore,

      moistureAfter:
        drying.moistureAfter,

      dryingStartedAt:
        drying.dryingStartedAt,

      dryingEndedAt:
        drying.dryingEndedAt,

      acceptableLossPercentMin:
        drying.acceptableLossPercentMin ??
        0,

      acceptableLossPercentMax:
        drying.acceptableLossPercentMax ??
        5,

      targetMoisturePercent:
        drying.targetMoisturePercent ??
        14,
    });

  if (!dryingResult.accepted) {
    return {
      accepted: false,
      kernel: null,
      projection: null,
      execution: null,
      drying: dryingResult,
      assessmentDecision: null,
    };
  }

  const analysis =
    dryingResult.analysis;

  const grainCondition =
    String(
      drying.grainCondition ??
      "acceptable",
    )
      .trim()
      .toLowerCase();

  const unsafeGrainConditions =
    new Set([
      "rain_damaged",
      "mouldy",
      "mould_or_rot",
      "contaminated",
      "pest_damaged",
      "spoiled",
      "rotten",
      "unsafe",
    ]);

  let assessmentDecision =
    "ready_for_storage_preparation";

  if (
    unsafeGrainConditions.has(
      grainCondition,
    )
  ) {
    assessmentDecision =
      "internal_grain_loss";
  } else if (
    analysis.abnormalLoss === true
  ) {
    assessmentDecision =
      "loss_review_required";
  } else if (
    analysis.moistureAfter >
    analysis.targetMoisturePercent
  ) {
    assessmentDecision =
      "return_to_drying";
  } else if (
    analysis.dryingDurationMinutes ===
    null
  ) {
    assessmentDecision =
      "retest_required";
  }

  const event =
    createInternalDryingAssessmentRecordedEvent({
      context,

      intakeId:
        drying.intakeId,

      grainType:
        drying.grainType,

      dryingZoneId:
        drying.dryingZoneId,

      dryingCycle:
        drying.dryingCycle ??
        1,

      beforeDryingWeightKg:
        analysis.beforeDryingWeightKg,

      afterDryingWeightKg:
        analysis.afterDryingWeightKg,

      moistureBefore:
        analysis.moistureBefore,

      moistureAfter:
        analysis.moistureAfter,

      dryingStartedAt:
        analysis.dryingStartedAt,

      dryingEndedAt:
        analysis.dryingEndedAt,

      dryingDurationMinutes:
        analysis.dryingDurationMinutes,

      weightLossKg:
        analysis.weightLossKg,

      weightLossPercent:
        analysis.weightLossPercent,

      moistureDropPercent:
        analysis.moistureDropPercent,

      acceptableLossRange:
        analysis.acceptableLossRange,

      targetMoisturePercent:
        analysis.targetMoisturePercent,

      abnormalLoss:
        analysis.abnormalLoss,

      grainCondition,

      assessmentDecision,

      conditionNotes:
        drying.conditionNotes ??
        null,

      evidenceReference:
        drying.evidenceReference ??
        null,

      assessedAt:
        drying.assessedAt ??
        new Date().toISOString(),
    });

  const kernelResult =
    await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
      drying: dryingResult,
      assessmentDecision,
    };
  }

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel: kernelResult,
      lifecycle,
      projection: null,
      state: {
        updated: true,

        internalDryingAssessmentRecorded:
          true,

        assessmentDecision,

        storagePreparationReady:
          assessmentDecision ===
          "ready_for_storage_preparation",

        returnToDrying:
          assessmentDecision ===
          "return_to_drying",

        retestRequired:
          assessmentDecision ===
          "retest_required",

        lossReviewRequired:
          assessmentDecision ===
          "loss_review_required",

        internalGrainLoss:
          assessmentDecision ===
          "internal_grain_loss",

        packagingBlocked:
          assessmentDecision !==
          "ready_for_storage_preparation",

        rackAssignmentBlocked:
          assessmentDecision !==
          "ready_for_storage_preparation",
      },
    });

  return {
    accepted:
      executionResult.accepted === true,

    kernel:
      kernelResult,

    projection:
      null,

    execution:
      executionResult,

    drying:
      dryingResult,

    assessmentDecision,
  };

}

/**
 * ==========================================================
 * Internal Loss Review
 * ==========================================================
 */

export async function requireInternalLossReview({
  context = {},
  review = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_INTERNAL_LOSS_REVIEW_REQUIRED_WORKFLOW";

  const event =
    createInternalLossReviewRequiredEvent({
      context,
      ...review,
    });

  const kernelResult =
    await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel: kernelResult,
      lifecycle,
      projection: null,
      state: {
        updated: true,

        internalLossReviewRequired:
          true,

        reviewStatus:
          event.payload?.reviewStatus ??
          "pending",

        packagingBlocked:
          true,

        rackAssignmentBlocked:
          true,
      },
    });

  return {
    accepted:
      executionResult.accepted === true,

    kernel:
      kernelResult,

    projection:
      null,

    execution:
      executionResult,
  };

}

/**
 * ==========================================================
 * Internal Grain Loss
 * ==========================================================
 */

export async function recordInternalGrainLoss({
  context = {},
  loss = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_INTERNAL_GRAIN_LOSS_RECORDED_WORKFLOW";

  const event =
    createInternalGrainLossRecordedEvent({
      context,
      ...loss,
    });

  const kernelResult =
    await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel: kernelResult,
      lifecycle,
      projection: null,
      state: {
        updated: true,

        internalGrainLossRecorded:
          true,

        lossReason:
          event.payload?.lossReason ??
          null,

        lossQuantityKg:
          event.payload?.lossQuantityKg ??
          null,

        approvalStatus:
          event.payload?.approvalStatus ??
          "pending",

        packagingBlocked:
          true,

        rackAssignmentBlocked:
          true,

        batchClosedAsLoss:
          true,
      },
    });

  return {
    accepted:
      executionResult.accepted === true,

    kernel:
      kernelResult,

    projection:
      null,

    execution:
      executionResult,
  };

}

/**
 * ==========================================================
 * E-Zone Assignment
 * ==========================================================
 */

export async function assignEZone({
  context = {},
  eZone = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_EZONE_ASSIGNED_WORKFLOW";

  const event =
    createEZoneAssignedEvent({
      context,
      ...eZone,
    });

  const kernelResult =
    await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel: kernelResult,
      lifecycle,
      projection: null,
      state: {
        updated: true,
        eZoneAssigned: true,

        eZoneKg:
          event.payload?.eZoneKg ??
          null,

        sourceReason:
          event.payload?.sourceReason ??
          null,
      },
    });

  return {
    accepted:
      executionResult.accepted === true,

    kernel:
      kernelResult,

    projection:
      null,

    execution:
      executionResult,
  };

}