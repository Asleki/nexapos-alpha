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
 *
 * Used By:
 * - NexFarm UI
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
  createEZoneAssignedEvent,
} from "./nexfarm-events.js";

import { executeOperation } from "./execution/execution-engine.js";

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

export async function registerNexFarmSupplier({
  context = {},
  supplier = {},
} = {}) {

  const workflow =
    "NEXFARM_SUPPLIER_REGISTERED_WORKFLOW";

  const event = createSupplierRegisteredEvent({
    context,
    ...supplier,
  });

  const kernelResult = await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const projectionResult = updateReadModel({
    projectionName: NEXFARM_SUPPLIER_DIRECTORY_PROJECTION,
    readModelName: NEXFARM_SUPPLIER_DIRECTORY_READ_MODEL,
    event,
    initialState: {
      suppliers: [],
      totalSuppliers: 0,
    },
  });

  const executionResult = await executeOperation({
    workflow,
    event,
    kernel: kernelResult,
    projection: projectionResult,
    state: {
      updated: projectionResult.projected === true,
    },
  });

  return {
    accepted: executionResult.accepted === true,
    kernel: kernelResult,
    projection: projectionResult,
    execution: executionResult,
  };

}

export async function startGrainIntake({
  context = {},
  intake = {},
} = {}) {

  const workflow =
    "NEXFARM_GRAIN_INTAKE_STARTED_WORKFLOW";

  const event = createGrainIntakeStartedEvent({
    context,
    ...intake,
  });

  const kernelResult = await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult = await executeOperation({
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
    accepted: executionResult.accepted === true,
    kernel: kernelResult,
    projection: null,
    execution: executionResult,
  };

}

export async function selectGrainType({
  context = {},
  intake = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_GRAIN_TYPE_SELECTED_WORKFLOW";

  const event = createGrainTypeSelectedEvent({
    context,
    ...intake,
  });

  const kernelResult = await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult = await executeOperation({
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
    accepted: executionResult.accepted === true,
    kernel: kernelResult,
    projection: null,
    execution: executionResult,
  };

}

export async function recordMoistureTest({
  context = {},
  intake = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_MOISTURE_TEST_RECORDED_WORKFLOW";

  const event = createMoistureTestRecordedEvent({
    context,
    ...intake,
  });

  const kernelResult = await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult = await executeOperation({
    workflow,
    event,
    kernel: kernelResult,
    lifecycle,
    projection: null,
    state: {
      updated: true,
      moistureTestRecorded: true,
    },
  });

  return {
    accepted: executionResult.accepted === true,
    kernel: kernelResult,
    projection: null,
    execution: executionResult,
  };

}

export async function captureWeight({
  context = {},
  intake = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_WEIGHT_CAPTURED_WORKFLOW";

  const event = createWeightCapturedEvent({
    context,
    ...intake,
  });

  const kernelResult = await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult = await executeOperation({
    workflow,
    event,
    kernel: kernelResult,
    lifecycle,
    projection: null,
    state: {
      updated: true,
      weightCaptured: true,
    },
  });

  return {
    accepted: executionResult.accepted === true,
    kernel: kernelResult,
    projection: null,
    execution: executionResult,
  };

}

export async function createPricePreview({
  context = {},
  intake = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_PRICE_PREVIEW_CREATED_WORKFLOW";

  const event = createPricePreviewCreatedEvent({
    context,
    ...intake,
  });

  const kernelResult = await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult = await executeOperation({
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
    accepted: executionResult.accepted === true,
    kernel: kernelResult,
    projection: null,
    execution: executionResult,
  };

}

export async function acceptSupplierOffer({
  context = {},
  intake = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_SUPPLIER_ACCEPTED_OFFER_WORKFLOW";

  const event = createSupplierAcceptedOfferEvent({
    context,
    ...intake,
  });

  const kernelResult = await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult = await executeOperation({
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
    accepted: executionResult.accepted === true,
    kernel: kernelResult,
    projection: null,
    execution: executionResult,
  };

}

export async function suggestNexFarmPackaging({
  context = {},
  intake = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_PACKAGING_SUGGESTED_WORKFLOW";

  const packagingResult =
    suggestPackaging({
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
    });

  if (!packagingResult.accepted) {
    return {
      accepted: false,
      kernel: null,
      projection: null,
      execution: null,
      packaging: packagingResult,
    };
  }

  const event = createPackagingSuggestedEvent({
    context,
    ...intake,
    suggestedBags:
      packagingResult.suggestedBags,
    totalPackagedKg:
      packagingResult.totalPackagedKg,
    eZoneKg:
      packagingResult.eZoneKg,
  });

  const kernelResult = await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
      packaging: packagingResult,
    };
  }

  const executionResult = await executeOperation({
    workflow,
    event,
    kernel: kernelResult,
    lifecycle,
    projection: null,
    state: {
      updated: true,
      packagingSuggested: true,
    },
  });

  return {
    accepted: executionResult.accepted === true,
    kernel: kernelResult,
    projection: null,
    execution: executionResult,
    packaging: packagingResult,
  };

}

export async function createNexFarmBag({
  context = {},
  bag = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_BAG_CREATED_WORKFLOW";

  const event = createBagCreatedEvent({
    context,
    ...bag,
  });

  const kernelResult = await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult = await executeOperation({
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
    accepted: executionResult.accepted === true,
    kernel: kernelResult,
    projection: null,
    execution: executionResult,
  };

}

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
        bag.estateId ?? null,
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

  const event = createQrAssignedEvent({
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

  const kernelResult = await executeKernel(event);

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

  const executionResult = await executeOperation({
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
    accepted: executionResult.accepted === true,
    kernel: kernelResult,
    projection: null,
    execution: executionResult,
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
        rack.availableLocations ?? [],
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

  const event = createRackAssignedEvent({
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

  const kernelResult = await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
      rack: rackResult,
    };
  }

  const executionResult = await executeOperation({
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
    accepted: executionResult.accepted === true,
    kernel: kernelResult,
    projection: null,
    execution: executionResult,
    rack: rackResult,
  };

}

export async function assignSolarDrying({
  context = {},
  drying = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_SOLAR_DRYING_ASSIGNED_WORKFLOW";

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
    });

  if (!dryingResult.accepted) {
    return {
      accepted: false,
      kernel: null,
      projection: null,
      execution: null,
      drying: dryingResult,
    };
  }

  const event = createSolarDryingAssignedEvent({
    context,
    ...drying,
  });

  const kernelResult = await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
      drying: dryingResult,
    };
  }

  const executionResult = await executeOperation({
    workflow,
    event,
    kernel: kernelResult,
    lifecycle,
    projection: null,
    state: {
      updated: true,
      solarDryingAssigned: true,
    },
  });

  return {
    accepted: executionResult.accepted === true,
    kernel: kernelResult,
    projection: null,
    execution: executionResult,
    drying: dryingResult,
  };

}

export async function assignEZone({
  context = {},
  eZone = {},
  lifecycle = null,
} = {}) {

  const workflow =
    "NEXFARM_EZONE_ASSIGNED_WORKFLOW";

  const event = createEZoneAssignedEvent({
    context,
    ...eZone,
  });

  const kernelResult = await executeKernel(event);

  if (!kernelResult.accepted) {
    return {
      accepted: false,
      kernel: kernelResult,
      projection: null,
      execution: null,
    };
  }

  const executionResult = await executeOperation({
    workflow,
    event,
    kernel: kernelResult,
    lifecycle,
    projection: null,
    state: {
      updated: true,
      eZoneAssigned: true,
    },
  });

  return {
    accepted: executionResult.accepted === true,
    kernel: kernelResult,
    projection: null,
    execution: executionResult,
  };

}