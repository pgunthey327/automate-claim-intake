/**
 * Claim Routing Agent
 * Orchestrates the final routing phase of claim processing
 * Makes final decision and routes claim based on all assessments
 */

import { generateContent } from "../helper/helper.js";
import mcpServer from "../mcp/mcpServer.js";
import fs from "fs";
import path from "path";

/**
 * Build comprehensive summary from all assessment data
 */
const buildSummary = (routingDecision, validationResults, enrichmentResults, fraudScreeningResults, assessmentSummary) => {
  const summaryParts = [];

  // Add routing decision
  if (routingDecision.summary) {
    summaryParts.push(routingDecision.summary);
  }

  // Add reasoning
  if (routingDecision.reasoning) {
    summaryParts.push(`Reasoning: ${routingDecision.reasoning}`);
  }

  // Add validation status
  if (validationResults.validationData) {
    const validationStatus = validationResults.validationData.validationPassed ? "PASSED" : "FAILED";
    summaryParts.push(`Validation: ${validationStatus} (Score: ${validationResults.validationData.validationScore || 0}/100)`);
    if (validationResults.validationData.criticalErrors?.length > 0) {
      summaryParts.push(`Validation Errors: ${validationResults.validationData.criticalErrors.join(", ")}`);
    }
  }

  // Add fraud screening status
  if (fraudScreeningResults.fraudScreeningData) {
    const fraudData = fraudScreeningResults.fraudScreeningData;
    summaryParts.push(`Fraud Risk: ${fraudData.fraudRiskLevel} (Probability: ${(fraudData.fraudProbability * 100).toFixed(1)}%)`);
    if (fraudData.fraudIndicators?.length > 0) {
      const indicators = fraudData.fraudIndicators.map(i => i.indicator).join(", ");
      summaryParts.push(`Fraud Indicators: ${indicators}`);
    }
  }

  // Add enrichment improvements
  if (enrichmentResults.improvements) {
    const improvements = enrichmentResults.improvements;
    if (improvements.newFields && Object.keys(improvements.newFields).length > 0) {
      summaryParts.push(`Fields Added During Enrichment: ${Object.keys(improvements.newFields).join(", ")}`);
    }
    if (improvements.qualityImprovement) {
      summaryParts.push(`Data Quality Improvement: ${improvements.qualityImprovement}`);
    }
  }

  // Add routing decision details
  if (routingDecision.routingDecision) {
    summaryParts.push(`Final Decision: ${routingDecision.routingDecision}`);
  }
  if (routingDecision.assignedQueue) {
    summaryParts.push(`Assigned Queue: ${routingDecision.assignedQueue}`);
  }
  if (routingDecision.processingPriority) {
    summaryParts.push(`Processing Priority: ${routingDecision.processingPriority}`);
  }
  if (routingDecision.estimatedProcessingTime) {
    summaryParts.push(`Estimated Processing Time: ${routingDecision.estimatedProcessingTime}`);
  }

  // Add additional info requirements
  if (routingDecision.requiresAdditionalInfo && routingDecision.additionalInfoNeeded?.length > 0) {
    summaryParts.push(`Additional Information Required: ${routingDecision.additionalInfoNeeded.join(", ")}`);
  }

  // Add flags
  if (routingDecision.shouldBeFlagged) {
    const reason = routingDecision.flagReason || "Requires special review";
    summaryParts.push(`⚠️ FLAGGED FOR REVIEW: ${reason}`);
  }

  return summaryParts.join(" | ");
};

export const claimRoutingAgent = async (
  claimData,
  validationResults,
  enrichmentResults,
  fraudScreeningResults,
  agentTimestamps = {},
  originalClaimData = {}
) => {
  console.log("\n=== CLAIM ROUTING AGENT ===");

  const routingContext = {
    agentName: "ClaimRoutingAgent",
    stage: "claim_routing",
    timestamp: new Date().toISOString(),
    steps: []
  };

  try {
    // Step 1: Compile all assessment data
    console.log("Step 1: Compiling all assessment data...");
    const assessmentSummary = {
      claimId: claimData.claimId || claimData.claim?.claimId || `CLAIM-${Date.now()}`,
      validationStatus: validationResults.validationData?.validationPassed || false,
      enrichmentQuality: enrichmentResults.improvements?.qualityImprovement || "0%",
      fraudRiskLevel: fraudScreeningResults.fraudScreeningData?.fraudRiskLevel || "MEDIUM",
      fraudProbability: fraudScreeningResults.fraudScreeningData?.fraudProbability || 0.5
    };

    routingContext.steps.push({
      step: "assessment_compilation",
      summary: assessmentSummary
    });

    // Step 2: Quality check of claim data
    console.log("Step 2: Performing quality check...");
    try {
      const qualityCheckResult = await mcpServer.callTool(
        "qualityChecker",
        {
          claimData: assessmentSummary,
          qualityThresholds: { minimum: 70 }
        }
      );
      routingContext.steps.push({
        step: "quality_check",
        result: qualityCheckResult
      });
      console.log("Quality check result:", qualityCheckResult);
    } catch (error) {
      console.error("Quality check error:", error.message);
    }

    // Step 3: LLM makes routing decision
    const routingDecisionPrompt = `As a claim routing expert, make a final routing decision considering:
1. Validation results: ${JSON.stringify(validationResults.validationData)}
2. Enrichment improvements made
3. Fraud screening findings: ${JSON.stringify(fraudScreeningResults.fraudScreeningData)}
4. Overall risk assessment

Determine the best action for this claim:

Provide JSON response with:
{
  "routingDecision": "APPROVE/DENY/PENDING_ADDITIONAL_INFO/FLAG_FOR_SPECIAL_REVIEW",
  "assignedQueue": "standard_processing/special_review/fraud_investigation/manual_review",
  "processingPriority": "expedited/standard/delayed",
  "requiresAdditionalInfo": true/false,
  "additionalInfoNeeded": ["list of fields"],
  "shouldBeFlagged": true/false,
  "flagReason": "if flagged, the reason",
  "estimatedProcessingTime": "in days",
  "summary": "concise summary of decision",
  "reasoning": "detailed reasoning for the decision"
}`;

    console.log("Step 3: LLM making routing decision...");
    const routingDecision = await generateContent(routingDecisionPrompt, "RoutingAgent-Decision");
    routingContext.steps.push({
      step: "routing_decision",
      result: routingDecision
    });
    console.log("Routing decision:", routingDecision);

    // Step 4: Create final claim result in simplified format
    const claimResult = {
      extractionAgent: agentTimestamps.extractionAgent || new Date().toISOString(),
      validationAgent: agentTimestamps.validationAgent || new Date().toISOString(),
      fraudScreeningAgent: agentTimestamps.fraudScreeningAgent || new Date().toISOString(),
      dataEnrichmentAgent: agentTimestamps.dataEnrichmentAgent || new Date().toISOString(),
      routingAGent: agentTimestamps.routingAGent || new Date().toISOString(),
      
      // Claim data fields
      claimType: originalClaimData.claimType || claimData.claimType || "",
      incidentDate: originalClaimData.incidentDate || claimData.incidentDate || "",
      incidentLocation: originalClaimData.incidentLocation || claimData.incidentLocation || "",
      description: originalClaimData.description || claimData.description || "",
      claimAmount: originalClaimData.claimAmount || originalClaimData.amount || claimData.amount || "",
      agreeTerms: originalClaimData.agreeTerms || false,
      name: originalClaimData.name || originalClaimData.claimantName || claimData.claimantName || "",
      id: originalClaimData.id || "",
      claimId: assessmentSummary.claimId,
      
      // Summary field contains all decision details
      summary: buildSummary(routingDecision, validationResults, enrichmentResults, fraudScreeningResults, assessmentSummary)
    };

    routingContext.steps.push({
      step: "result_compilation",
      result: claimResult
    });

    // Step 5: Save claim result to file
    console.log("Step 4: Saving claim result...");
    try {

      const resultsFile = path.join(process.cwd(), "output", "claim_results.json");
      console.log("Results file path:", resultsFile);
      let allResults = {};

      // Load existing results if file exists
      if (fs.existsSync(resultsFile)) {
        const existingData = fs.readFileSync(resultsFile, "utf-8");
        try {
          allResults = JSON.parse(existingData);
        } catch {
          allResults = {};
        }
      }
        // Check if user already has results
        const userId = originalClaimData.id;
        if (allResults[userId]) {
            // If it's not an array, convert to array
            if (!Array.isArray(allResults[userId])) {
            allResults[userId] = [allResults[userId]];
            }
            // Generate claim ID based on array length
            const claimNumber = allResults[userId].length + 1;
            const claimId = `CLM${String(claimNumber).padStart(3, '0')}`;
            claimResult.claimId = claimId;
            // Append new result to array
            allResults[userId].push(claimResult);
        } else {
            // Create new entry with array containing the result
            const claimId = "CLM001";
            claimResult.claimId = claimId;
            allResults[userId] = [claimResult];
        }
        
        fs.writeFileSync(resultsFile, JSON.stringify(allResults, null, 2));
        console.log("Results saved to claim_results.json");

      routingContext.steps.push({
        step: "result_persistence",
        filePath: resultsFile,
        status: "saved"
      });
    } catch (error) {
      console.error("Error saving claim result:", error.message);
      routingContext.steps.push({
        step: "result_persistence",
        status: "failed",
        error: error.message
      });
    }

    routingContext.result = {
      success: true,
      claimResult,
      processingComplete: true
    };

  } catch (error) {
    console.error("Claim routing agent error:", error);
    routingContext.result = {
      success: false,
      error: error.message,
      claimResult: null,
      processingComplete: false
    };
  }

  console.log("=== CLAIM ROUTING AGENT COMPLETE ===\n");
  return routingContext;
};

export default claimRoutingAgent;
