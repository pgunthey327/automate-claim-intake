/**
 * Autonomous Orchestrator
 * Orchestrates the entire claim intake process by coordinating all agents
 * Execution order: Extraction -> Validation -> Data Enrichment -> Fraud Screening -> Claim Routing
 */

import extractionAgent from "../agents/extractionAgent.js";
import validationAgent from "../agents/validationAgent.js";
import dataEnrichmentAgent from "../agents/dataEnrichmentAgent.js";
import fraudScreeningAgent from "../agents/fraudScreeningAgent.js";
import claimRoutingAgent from "../agents/routingAgent.js";

const autonomousOrchestrator = async (rawClaimText, claimFormData) => {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║      AUTONOMOUS CLAIM INTAKE ORCHESTRATOR STARTED           ║");
  console.log("║              Processing claim at: " + new Date().toISOString() + "║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const orchestrationLog = {
    startTime: new Date(),
    stages: {},
    agentTimestamps: {}
  };

  try {
    // ====================================================================
    // STAGE 1: EXTRACTION
    // ====================================================================
    console.log("\n┌─ STAGE 1: EXTRACTION ─────────────────────────────────────────┐");
    const rawClaimData = claimFormData || JSON.parse(rawClaimText);
    
    const extractionStartTime = new Date().toISOString();
    const extractionResult = await extractionAgent(rawClaimData);
    orchestrationLog.agentTimestamps.extractionAgent = extractionStartTime;
    orchestrationLog.stages.extraction = {
      success: extractionResult.result.success,
      duration: "completed",
      steps: extractionResult.steps
    };

    if (!extractionResult.result.success) {
      console.error("\n❌ Extraction failed. Aborting pipeline.");
      orchestrationLog.status = "FAILED_AT_EXTRACTION";
      return orchestrationLog;
    }

    if (!extractionResult.result.readyForNextStage) {
      console.warn("\n⚠️  Extraction quality insufficient. Flagging for manual review.");
      orchestrationLog.status = "INCOMPLETE_EXTRACTION";
      return orchestrationLog;
    }

    const extractedData = extractionResult.result.extractedData;
    console.log("└─ Extraction Complete ✓");

    // ====================================================================
    // STAGE 2: VALIDATION
    // ====================================================================
    console.log("\n┌─ STAGE 2: VALIDATION ─────────────────────────────────────────┐");
    
    const validationStartTime = new Date().toISOString();
    const validationResult = await validationAgent(extractedData);
    orchestrationLog.agentTimestamps.validationAgent = validationStartTime;
    orchestrationLog.stages.validation = {
      success: validationResult.result.success,
      duration: "completed",
      steps: validationResult.steps
    };

    if (!validationResult.result.success) {
      console.error("\n❌ Validation failed. Aborting pipeline.");
      orchestrationLog.status = "FAILED_AT_VALIDATION";
      return orchestrationLog;
    }

    const validationData = validationResult.result.validationData;
    console.log("└─ Validation Complete ✓");

    // ====================================================================
    // STAGE 3: DATA ENRICHMENT
    // ====================================================================
    console.log("\n┌─ STAGE 3: DATA ENRICHMENT ────────────────────────────────────┐");
    
    const enrichmentStartTime = new Date().toISOString();
    const enrichmentResult = await dataEnrichmentAgent(extractedData, validationData);
    orchestrationLog.agentTimestamps.dataEnrichmentAgent = enrichmentStartTime;
    orchestrationLog.stages.enrichment = {
      success: enrichmentResult.result.success,
      duration: "completed",
      steps: enrichmentResult.steps
    };

    if (!enrichmentResult.result.success) {
      console.error("\n❌ Data enrichment failed. Continuing with extracted data.");
      orchestrationLog.stages.enrichment.warning = "Using original extracted data";
    }

    const enrichedData = enrichmentResult.result.enrichedData || extractedData;
    console.log("└─ Data Enrichment Complete ✓");

    // ====================================================================
    // STAGE 4: FRAUD SCREENING
    // ====================================================================
    console.log("\n┌─ STAGE 4: FRAUD SCREENING ────────────────────────────────────┐");
    
    const fraudScreeningStartTime = new Date().toISOString();
    const fraudScreeningResult = await fraudScreeningAgent(enrichedData);
    orchestrationLog.agentTimestamps.fraudScreeningAgent = fraudScreeningStartTime;
    orchestrationLog.stages.fraudScreening = {
      success: fraudScreeningResult.result.success,
      duration: "completed",
      steps: fraudScreeningResult.steps
    };

    if (!fraudScreeningResult.result.success) {
      console.error("\n❌ Fraud screening failed. Proceeding with caution.");
      orchestrationLog.stages.fraudScreening.warning = "Fraud screening could not be completed";
    }

    const fraudScreeningData = fraudScreeningResult.result.fraudScreeningData;
    console.log("└─ Fraud Screening Complete ✓");

    // ====================================================================
    // STAGE 5: CLAIM ROUTING (Final Decision)
    // ====================================================================
    console.log("\n┌─ STAGE 5: CLAIM ROUTING ──────────────────────────────────────┐");
    
    const routingStartTime = new Date().toISOString();
    const routingResult = await claimRoutingAgent(
      enrichedData,
      validationResult.result,
      enrichmentResult.result,
      fraudScreeningResult.result,
      orchestrationLog.agentTimestamps,
      rawClaimData
    );
    orchestrationLog.agentTimestamps.routingAGent = routingStartTime;

    orchestrationLog.stages.routing = {
      success: routingResult.result.success,
      duration: "completed",
      steps: routingResult.steps
    };

    if (!routingResult.result.success) {
      console.error("\n❌ Claim routing failed.");
      orchestrationLog.status = "FAILED_AT_ROUTING";
      return orchestrationLog;
    }

    console.log("└─ Claim Routing Complete ✓");

    // ====================================================================
    // ORCHESTRATION COMPLETE
    // ====================================================================
    const endTime = new Date();
    const duration = Math.round((endTime - orchestrationLog.startTime) / 1000);

    orchestrationLog.status = "PROCESSING_COMPLETE";
    orchestrationLog.endTime = endTime;
    orchestrationLog.processingDurationSeconds = duration;
    orchestrationLog.finalClaimResult = routingResult.result.claimResult;

    console.log("\n╔══════════════════════════════════════════════════════════════╗");
    console.log("║        ORCHESTRATION COMPLETE ✓                             ║");
    console.log(`║        Total Processing Time: ${duration} seconds                      ║`);
    console.log("╚══════════════════════════════════════════════════════════════╝\n");

  } catch (error) {
    console.error("\n🚨 FATAL ERROR IN ORCHESTRATION:", error);
    orchestrationLog.status = "FATAL_ERROR";
    orchestrationLog.error = error.message;
    orchestrationLog.stack = error.stack;
  }

  return orchestrationLog;
};

export default autonomousOrchestrator;
