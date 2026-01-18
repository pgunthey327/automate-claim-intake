/**
 * Claim Routing Agent
 * Orchestrates the final routing phase of claim processing
 * Makes final decision and routes claim based on all assessments
 */

import { generateContent } from "../helper/helper.js";
import mcpServer from "../mcp/mcpServer.js";
import fs from "fs";
import path from "path";

export const claimRoutingAgent = async (
  claimData,
  validationResults,
  enrichmentResults,
  fraudScreeningResults
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

    // Step 2: Final risk assessment using risk calculator
    console.log("Step 2: Final risk assessment...");
    try {
      const finalRiskResult = await mcpServer.callTool(
        "riskCalculator",
        {
          claimData: assessmentSummary,
          factors: ["validationStatus", "fraudRiskLevel", "enrichmentQuality"]
        }
      );
      routingContext.steps.push({
        step: "final_risk_assessment",
        result: finalRiskResult
      });
      console.log("Final risk assessment:", finalRiskResult);
    } catch (error) {
      console.error("Final risk assessment error:", error.message);
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

    // Step 4: Create final claim result
    const claimResult = {
      claimId: assessmentSummary.claimId,
      processedAt: new Date().toISOString(),
      processingStage: "ROUTING_COMPLETE",
      claimStatus: routingDecision.routingDecision || "PENDING",
      decision: {
        action: routingDecision.routingDecision || "PENDING_ADDITIONAL_INFO",
        queue: routingDecision.assignedQueue || "standard_processing",
        priority: routingDecision.processingPriority || "standard",
        estimatedProcessingTime: routingDecision.estimatedProcessingTime || "5-7 days"
      },
      assessment: {
        validationPassed: validationResults.validationData?.validationPassed || false,
        validationScore: validationResults.validationData?.validationScore || 0,
        dataEnrichmentQuality: enrichmentResults.improvements?.qualityImprovement || "0%",
        fraudRiskLevel: fraudScreeningResults.fraudScreeningData?.fraudRiskLevel || "MEDIUM",
        fraudProbability: fraudScreeningResults.fraudScreeningData?.fraudProbability || 0.5
      },
      routing: {
        requiresAdditionalInfo: routingDecision.requiresAdditionalInfo || false,
        additionalInfoNeeded: routingDecision.additionalInfoNeeded || [],
        flaggedForReview: routingDecision.shouldBeFlagged || false,
        flagReason: routingDecision.flagReason || null
      },
      summary: routingDecision.summary || "Claim processed successfully",
      reasoning: routingDecision.reasoning || "Standard processing",
      originalClaimData: claimData,
      enrichedData: enrichmentResults.enrichedData || claimData
    };

    routingContext.steps.push({
      step: "result_compilation",
      result: claimResult
    });

    // Step 5: Save claim result to file
    console.log("Step 4: Saving claim result...");
    try {
      const outputDir = "./output";
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const resultsFile = path.join(outputDir, "claim_results.json");
      let allResults = [];

      // Load existing results if file exists
      if (fs.existsSync(resultsFile)) {
        const existingData = fs.readFileSync(resultsFile, "utf-8");
        try {
          allResults = JSON.parse(existingData);
          if (!Array.isArray(allResults)) {
            allResults = [allResults];
          }
        } catch {
          allResults = [];
        }
      }

      // Add new result
      allResults.push(claimResult);

      // Save to file
      fs.writeFileSync(resultsFile, JSON.stringify(allResults, null, 2));
      console.log(`Claim result saved to ${resultsFile}`);

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
