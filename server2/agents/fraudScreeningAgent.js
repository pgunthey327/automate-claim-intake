/**
 * Fraud Screening Agent
 * Orchestrates the fraud screening phase of claim processing
 * Uses LLM + business rules and risk calculator for fraud detection
 */

import { generateContent } from "../helper/helper.js";
import mcpServer from "../mcp/mcpServer.js";

export const fraudScreeningAgent = async (enrichedClaimData) => {
  console.log("\n=== FRAUD SCREENING AGENT ===");
  console.log("Input data:", enrichedClaimData);

  const fraudScreeningContext = {
    agentName: "FraudScreeningAgent",
    stage: "fraud_screening",
    timestamp: new Date().toISOString(),
    steps: []
  };

  try {
    // Step 1: Execute business rules
    console.log("Step 1: Executing business rules for basic checks...");
    try {
      const rulesResult = await mcpServer.callTool(
        "rulesEngine",
        {
          claimData: enrichedClaimData,
          ruleSet: "basic_fraud_rules"
        }
      );
      fraudScreeningContext.steps.push({
        step: "rules_engine",
        result: rulesResult
      });
      console.log("Rules engine result:", rulesResult);
    } catch (error) {
      console.error("Rules engine error:", error.message);
    }

    // Step 2: Calculate risk score
    console.log("Step 2: Calculating risk score...");
    try {
      const riskResult = await mcpServer.callTool(
        "riskCalculator",
        {
          claimData: enrichedClaimData,
          factors: ["claimAmount", "claimAge", "dataCompleteness", "contactValidation", "claimType"]
        }
      );
      fraudScreeningContext.steps.push({
        step: "risk_calculation",
        result: riskResult
      });
      console.log("Risk calculation result:", riskResult);
    } catch (error) {
      console.error("Risk calculation error:", error.message);
    }

    // Step 3: LLM performs intelligent fraud analysis
    const fraudAnalysisPrompt = `As a fraud detection expert, perform intelligent fraud analysis on this claim.
Consider:
1. The patterns and anomalies in the claim
2. The risk factors identified
3. The rules engine flags
4. Common fraud indicators
5. Context-specific risk factors

Provide JSON response with:
{
  "fraudRiskLevel": "LOW/MEDIUM/HIGH/CRITICAL",
  "fraudIndicators": [
    { "indicator": "name", "severity": "low/medium/high", "confidence": 0-1, "description": "details" }
  ],
  "overallFraudProbability": 0-1,
  "suspiciousPatterns": [],
  "recommendedAction": "APPROVE/FLAG_FOR_REVIEW/DENY",
  "reasoning": "detailed analysis",
  "needsInvestigation": true/false,
  "investigationPriority": "low/medium/high"
}`;

    console.log("Step 3: LLM performing intelligent fraud analysis...");
    const fraudAnalysis = await generateContent(fraudAnalysisPrompt, "FraudScreeningAgent-Analysis");
    fraudScreeningContext.steps.push({
      step: "fraud_analysis",
      result: fraudAnalysis
    });
    console.log("Fraud analysis result:", fraudAnalysis);

    // Step 4: Compile fraud screening summary
    const fraudScreeningSummary = {
      claimId: enrichedClaimData.claimId || enrichedClaimData.claim?.claimId || "UNKNOWN",
      fraudRiskLevel: fraudAnalysis.fraudRiskLevel || "MEDIUM",
      fraudProbability: fraudAnalysis.overallFraudProbability || 0.5,
      flaggedForReview: (fraudAnalysis.fraudRiskLevel === "HIGH" || fraudAnalysis.fraudRiskLevel === "CRITICAL"),
      fraudIndicators: fraudAnalysis.fraudIndicators || [],
      recommendedAction: fraudAnalysis.recommendedAction || "FLAG_FOR_REVIEW",
      needsInvestigation: fraudAnalysis.needsInvestigation || false,
      investigationPriority: fraudAnalysis.investigationPriority || "low"
    };

    fraudScreeningContext.result = {
      success: true,
      fraudScreeningData: fraudScreeningSummary,
      readyForNextStage: true // Always proceed to routing for final decision
    };

  } catch (error) {
    console.error("Fraud screening agent error:", error);
    fraudScreeningContext.result = {
      success: false,
      error: error.message,
      fraudScreeningData: null,
      readyForNextStage: false
    };
  }

  console.log("=== FRAUD SCREENING AGENT COMPLETE ===\n");
  return fraudScreeningContext;
};

export default fraudScreeningAgent;
