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
 * Coordinate:
 * - Immutable NexFarm event creation
 * - Kernel execution
 * - Lifecycle execution
 * - Supplier-directory projection updates
 * - Drying-custody projection updates
 * - Packaging suggestions
 * - Bag identity creation
 * - QR preparation
 * - Logical rack assignment
 * - Internal drying, loss-review, and loss recording
 *
 * Drying-custody events are projected into a derived
 * operational read model for:
 * - Active drying batches
 * - Drying-cycle history
 * - Returned moisture and weight
 * - Drying duration
 * - Moisture and weight-loss observations
 * - Storage-preparation readiness
 * - Loss-review states
 * - Internal grain-loss closure
 * - Future NexVox AI L1 observation
 *
 * Architectural Boundaries:
 * - Supplier registration remains optional.
 * - Grain intake can begin without supplier registration.
 * - Supplier pricing and acceptance happen only within
 *   the commercial intake flow.
 * - Post-acquisition drying is an internal NexFarm
 *   custody, quality, safety, and loss-control process.
 * - Drying must never reopen supplier pricing or payment.
 * - NexVox AI may observe derived results only.
 *
 * Depends On:
 * - nexfarm-events.js
 * - kernel-engine.js
 * - read-model-engine.js
 * - execution-engine.js
 * - nexfarm-projection.js
 * - drying-projection.js
 * - drying-read-model.js
 * - packaging-engine.js
 * - qr-engine.js
 * - rack-engine.js
 * - drying-engine.js
 *
 * Used By:
 * - NexFarm UI
 * - Temporary integration tests
 * - Future NexFarm operational workflows
 *
 * Must Never:
 * - Validate Kernel event schemas
 * - Execute security directly
 * - Store source events directly
 * - Synchronize events
 * - Process supplier payments
 * - Approve internal loss
 * - Approve rack admission through AI
 * - Let NexVox execute business operations
 */

import {
  executeKernel,
} from "../../core/kernel-engine.js";

import {
  updateReadModel,
} from "../../core/read-model-engine.js";

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

import {
  NEXFARM_DRYING_CUSTODY_PROJECTION,
} from "./storage/drying-projection.js";

import {
  NEXFARM_DRYING_CUSTODY_READ_MODEL,
  createInitialNexFarmDryingReadModel,
} from "./storage/drying-read-model.js";

/**
 * ==========================================================
 * Internal Service Helpers
 * ==========================================================
 */

/**
 * Return a normalized measurement-stage value.
 */
function normalizeMeasurementStage(
  measurementStage,
) {

  return String(
    measurementStage ?? "",
  )
    .trim()
    .toLowerCase();

}

/**
 * Determine whether a moisture or weight observation
 * represents grain returning from solar drying.
 */
function isDryingReturnMeasurement(
  measurementStage,
) {

  const normalizedStage =
    normalizeMeasurementStage(
      measurementStage,
    );

  return (
    normalizedStage ===
      "after_solar_drying" ||
    normalizedStage ===
      "returned_from_drying" ||
    normalizedStage ===
      "drying_return"
  );

}

/**
 * Project a drying-related event into the derived
 * NexFarm Drying Custody Read Model.
 *
 * Events remain the source of truth. This helper only
 * coordinates projection execution.
 */
function updateDryingCustodyReadModel(
  event,
) {

  return updateReadModel({
    projectionName:
      NEXFARM_DRYING_CUSTODY_PROJECTION,

    readModelName:
      NEXFARM_DRYING_CUSTODY_READ_MODEL,

    event,

    initialState:
      createInitialNexFarmDryingReadModel(),
  });

}

/**
 * Determine whether a downstream storage-preparation
 * event explicitly belongs to a drying cycle.
 */
function hasDryingCycleReference(
  payload = {},
) {

  return Boolean(
    payload.sourceDryingCycleId ??
    payload.dryingCycleId ??
    payload.dryingCycleNumber ??
    payload.dryingCycle,
  );

}

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
      kernel:
        kernelResult,
      projection:
        projectionResult,
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
  lifecycle = null,
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
      kernel:
        kernelResult,
      lifecycle,
      projection: null,
      state: {
        updated: true,
        intakeStarted: true,

        supplierId:
          event.payload?.supplierId ??
          null,

        temporarySupplierReference:
          event.payload
            ?.temporarySupplierReference ??
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
      kernel:
        kernelResult,
      lifecycle,
      projection: null,
      state: {
        updated: true,
        grainTypeSelected: true,

        grainType:
          event.payload?.grainType ??
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

  const returnedFromDrying =
    isDryingReturnMeasurement(
      event.payload?.measurementStage,
    );

  const projectionResult =
    returnedFromDrying
      ? updateDryingCustodyReadModel(
          event,
        )
      : null;

  const projectionAccepted =
    !returnedFromDrying ||
    projectionResult?.projected === true;

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel:
        kernelResult,
      lifecycle,
      projection:
        projectionResult,
      state: {
        updated:
          projectionAccepted,

        moistureTestRecorded:
          true,

        moisturePercentage:
          event.payload
            ?.moisturePercentage ??
          null,

        measurementStage:
          event.payload
            ?.measurementStage ??
          null,

        dryingReturnMeasurement:
          returnedFromDrying,

        dryingCustodyUpdated:
          projectionResult?.projected ===
          true,
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

  const returnedFromDrying =
    isDryingReturnMeasurement(
      event.payload?.measurementStage,
    );

  const projectionResult =
    returnedFromDrying
      ? updateDryingCustodyReadModel(
          event,
        )
      : null;

  const projectionAccepted =
    !returnedFromDrying ||
    projectionResult?.projected === true;

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel:
        kernelResult,
      lifecycle,
      projection:
        projectionResult,
      state: {
        updated:
          projectionAccepted,

        weightCaptured:
          true,

        weightKg:
          event.payload?.weightKg ??
          null,

        measurementStage:
          event.payload
            ?.measurementStage ??
          null,

        dryingReturnMeasurement:
          returnedFromDrying,

        dryingCustodyUpdated:
          projectionResult?.projected ===
          true,
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
      kernel:
        kernelResult,
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
      kernel:
        kernelResult,
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

    grainType:
      intake.grainType,

    sourceType:
      intake.sourceType ??
      "intake",

    sourceReferences:
      intake.sourceReferences ??
      [],

    bagSizes:
      intake.bagSizes,

    bagStockSnapshot:
      intake.bagStockSnapshot,

    rackCapacitySnapshot:
      intake.rackCapacitySnapshot,

    eZoneSectionAvailable:
      intake.eZoneSectionAvailable ??
      true,

    rules:
      intake.packagingRules,

    createdAt:
      intake.createdAt,
  };

  if (Array.isArray(intake.bagSizes)) {
    packagingInput.bagSizes =
      intake.bagSizes;
  }

  const packagingResult =
    suggestPackaging(
      packagingInput,
    );

  if (!packagingResult.accepted) {
    return {
      accepted: false,
      kernel: null,
      projection: null,
      execution: null,
      packaging:
        packagingResult,
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
      kernel:
        kernelResult,
      projection: null,
      execution: null,
      packaging:
        packagingResult,
    };
  }

  const dryingRelated =
    hasDryingCycleReference(
      event.payload,
    );

  const projectionResult =
    dryingRelated
      ? updateDryingCustodyReadModel(
          event,
        )
      : null;

  const projectionAccepted =
    !dryingRelated ||
    projectionResult?.projected === true;

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel:
        kernelResult,
      lifecycle,
      projection:
        projectionResult,
      state: {
        updated:
          projectionAccepted,

        packagingSuggested:
          true,

        totalPackagedKg:
          packagingResult
            .totalPackagedKg,

        eZoneKg:
          packagingResult.eZoneKg,

        sourceDryingCycleId:
          event.payload
            ?.sourceDryingCycleId ??
          null,

        dryingCustodyUpdated:
          projectionResult?.projected ===
          true,
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
      kernel:
        kernelResult,
      projection: null,
      execution: null,
    };
  }

  const dryingRelated =
    hasDryingCycleReference(
      event.payload,
    );

  const projectionResult =
    dryingRelated
      ? updateDryingCustodyReadModel(
          event,
        )
      : null;

  const projectionAccepted =
    !dryingRelated ||
    projectionResult?.projected === true;

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel:
        kernelResult,
      lifecycle,
      projection:
        projectionResult,
      state: {
        updated:
          projectionAccepted,

        bagCreated:
          true,

        bagId:
          event.payload?.bagId ??
          null,

        sourceDryingCycleId:
          event.payload
            ?.sourceDryingCycleId ??
          null,

        dryingCustodyUpdated:
          projectionResult?.projected ===
          true,
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
      qr:
        qrPayloadResult,
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
      qr:
        qrValueResult,
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
      qr:
        labelResult,
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
      kernel:
        kernelResult,
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
      kernel:
        kernelResult,
      lifecycle,
      projection: null,
      state: {
        updated: true,
        qrAssigned: true,

        bagId:
          event.payload?.bagId ??
          null,

        labelCode:
          event.payload?.labelCode ??
          null,

        bagIdentityFallback:
          event.payload?.bagId ??
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
      rack:
        rackResult,
    };
  }

  const event =
    createRackAssignedEvent({
      context,
      ...bag,

      rackSection:
        rackResult.location
          .rackSection,

      row:
        rackResult.location.row,

      column:
        rackResult.location.column,

      locationCode:
        rackResult.location
          .locationCode,
    });

  const kernelResult =
    await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel:
        kernelResult,
      projection: null,
      execution: null,
      rack:
        rackResult,
    };
  }

  const dryingRelated =
    hasDryingCycleReference(
      event.payload,
    );

  const projectionResult =
    dryingRelated
      ? updateDryingCustodyReadModel(
          event,
        )
      : null;

  const projectionAccepted =
    !dryingRelated ||
    projectionResult?.projected === true;

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel:
        kernelResult,
      lifecycle,
      projection:
        projectionResult,
      state: {
        updated:
          projectionAccepted,

        rackAssigned:
          true,

        locationCode:
          rackResult.location
            .locationCode,

        sourceDryingCycleId:
          event.payload
            ?.sourceDryingCycleId ??
          null,

        dryingCustodyUpdated:
          projectionResult?.projected ===
          true,
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
      kernel:
        kernelResult,
      projection: null,
      execution: null,
    };
  }

  const projectionResult =
    updateDryingCustodyReadModel(
      event,
    );

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel:
        kernelResult,
      lifecycle,
      projection:
        projectionResult,
      state: {
        updated:
          projectionResult.projected ===
          true,

        solarDryingAssigned:
          true,

        dryingCycleId:
          event.payload
            ?.dryingCycleId ??
          null,

        dryingCycleNumber:
          event.payload
            ?.dryingCycleNumber ??
          event.payload?.dryingCycle ??
          1,

        dryingCycle:
          event.payload?.dryingCycle ??
          event.payload
            ?.dryingCycleNumber ??
          1,

        dryingZoneId:
          event.payload?.dryingZoneId ??
          null,

        dryingStartedAt:
          event.payload
            ?.dryingStartedAt ??
          null,

        expectedReviewAt:
          event.payload
            ?.expectedReviewAt ??
          null,

        dryingCustodyUpdated:
          projectionResult.projected ===
          true,
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
        drying.beforeDryingWeightKg ??
        drying.weightAtEntryKg,

      afterDryingWeightKg:
        drying.afterDryingWeightKg ??
        drying.weightAtReturnKg,

      moistureBefore:
        drying.moistureBefore ??
        drying.moistureAtEntryPercent,

      moistureAfter:
        drying.moistureAfter ??
        drying.moistureAtReturnPercent,

      dryingStartedAt:
        drying.dryingStartedAt ??
        drying.enteredAt,

      dryingEndedAt:
        drying.dryingEndedAt ??
        drying.returnedAt,

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
      drying:
        dryingResult,
      assessmentDecision:
        null,
    };
  }

  const analysis =
    dryingResult.analysis;

  const grainCondition =
    String(
      drying.grainCondition ??
      drying.conditionStatus ??
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

      dryingCycleId:
        drying.dryingCycleId ??
        null,

      dryingCycleNumber:
        drying.dryingCycleNumber ??
        drying.dryingCycle ??
        1,

      dryingCycle:
        drying.dryingCycle ??
        drying.dryingCycleNumber ??
        1,

      grainType:
        drying.grainType,

      dryingZoneId:
        drying.dryingZoneId,

      weightAtEntryKg:
        analysis.beforeDryingWeightKg,

      beforeDryingWeightKg:
        analysis.beforeDryingWeightKg,

      weightAtReturnKg:
        analysis.afterDryingWeightKg,

      afterDryingWeightKg:
        analysis.afterDryingWeightKg,

      moistureAtEntryPercent:
        analysis.moistureBefore,

      moistureBefore:
        analysis.moistureBefore,

      moistureAtReturnPercent:
        analysis.moistureAfter,

      moistureAfter:
        analysis.moistureAfter,

      enteredAt:
        analysis.dryingStartedAt,

      dryingStartedAt:
        analysis.dryingStartedAt,

      returnedAt:
        analysis.dryingEndedAt,

      dryingEndedAt:
        analysis.dryingEndedAt,

      durationMinutes:
        analysis.dryingDurationMinutes,

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

      conditionStatus:
        grainCondition,

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
      kernel:
        kernelResult,
      projection: null,
      execution: null,
      drying:
        dryingResult,
      assessmentDecision,
    };
  }

  const projectionResult =
    updateDryingCustodyReadModel(
      event,
    );

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel:
        kernelResult,
      lifecycle,
      projection:
        projectionResult,
      state: {
        updated:
          projectionResult.projected ===
          true,

        internalDryingAssessmentRecorded:
          true,

        dryingCustodyUpdated:
          projectionResult.projected ===
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

        weightLossKg:
          analysis.weightLossKg,

        weightLossPercent:
          analysis.weightLossPercent,

        moistureDropPercent:
          analysis.moistureDropPercent,

        dryingDurationMinutes:
          analysis.dryingDurationMinutes,
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
      kernel:
        kernelResult,
      projection: null,
      execution: null,
    };
  }

  const projectionResult =
    updateDryingCustodyReadModel(
      event,
    );

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel:
        kernelResult,
      lifecycle,
      projection:
        projectionResult,
      state: {
        updated:
          projectionResult.projected ===
          true,

        internalLossReviewRequired:
          true,

        dryingCustodyUpdated:
          projectionResult.projected ===
          true,

        reviewStatus:
          event.payload
            ?.reviewStatus ??
          "pending",

        reviewReason:
          event.payload
            ?.reviewReason ??
          null,

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
      projectionResult,

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
      kernel:
        kernelResult,
      projection: null,
      execution: null,
    };
  }

  const projectionResult =
    updateDryingCustodyReadModel(
      event,
    );

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel:
        kernelResult,
      lifecycle,
      projection:
        projectionResult,
      state: {
        updated:
          projectionResult.projected ===
          true,

        internalGrainLossRecorded:
          true,

        dryingCustodyUpdated:
          projectionResult.projected ===
          true,

        lossReason:
          event.payload?.lossReason ??
          null,

        lossQuantityKg:
          event.payload
            ?.lossQuantityKg ??
          null,

        approvalStatus:
          event.payload
            ?.approvalStatus ??
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
      projectionResult,

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
      kernel:
        kernelResult,
      projection: null,
      execution: null,
    };
  }

  const dryingRelated =
    hasDryingCycleReference(
      event.payload,
    );

  const projectionResult =
    dryingRelated
      ? updateDryingCustodyReadModel(
          event,
        )
      : null;

  const projectionAccepted =
    !dryingRelated ||
    projectionResult?.projected === true;

  const executionResult =
    await executeOperation({
      workflow,
      event,
      kernel:
        kernelResult,
      lifecycle,
      projection:
        projectionResult,
      state: {
        updated:
          projectionAccepted,

        eZoneAssigned:
          true,

        eZoneKg:
          event.payload?.eZoneKg ??
          null,

        moisturePercentage:
          event.payload
            ?.moisturePercentage ??
          null,

        eZoneLocationId:
          event.payload
            ?.eZoneLocationId ??
          null,

        sourceReason:
          event.payload
            ?.sourceReason ??
          null,

        sourceDryingCycleId:
          event.payload
            ?.sourceDryingCycleId ??
          null,

        assignedAt:
          event.payload?.assignedAt ??
          null,

        expectedReviewAt:
          event.payload
            ?.expectedReviewAt ??
          null,

        dryingCustodyUpdated:
          projectionResult?.projected ===
          true,
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