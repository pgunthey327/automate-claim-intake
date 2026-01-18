/**
 * Validation Agent
 * Orchestrates the validation phase of claim processing
 * Uses LLM to validate extracted data against schema and business rules
 */

import { generateContent } from "../helper/helper.js";
import mcpServer from "../mcp/mcpServer.js";

const claim_intake_schema = { "text": "string", 
    "claimFormData": { 
        "claimType": "string",
         "incidentDate": "string",
          "incidentLocation": "string",
           "description": "string",
            "claimAmount": "string",
            "name": "string",
             "id": "string" } }

export const validationAgent = async (extractedData) => {
  console.log("\n=== VALIDATION AGENT ===");
  console.log("Input data:", extractedData);

  const validationContext = {
    agentName: "ValidationAgent",
    stage: "validation",
    timestamp: new Date().toISOString(),
    steps: []
  };

  try {
    // Step 1: Classify the claim document
    console.log("Step 1: Classifying claim document...");
    try {
      const classifierResult = await mcpServer.callTool(
        "documentClassifier",
        {
          claimData: extractedData,
          categories: ["claimCategory", "severity", "urgency", "completeness"]
        }
      );
      validationContext.steps.push({
        step: "document_classification",
        result: classifierResult
      });
      console.log("Classification result:", classifierResult);
    } catch (error) {
      console.error("Classification error:", error.message);
    }

    // Step 2: Validate against schema
    console.log("Step 2: Validating against schema...");
    try {
      const schemaValidationResult = await mcpServer.callTool(
        "schemaValidator",
        {
          data: extractedData,
          schema: claim_intake_schema
        }
      );
      validationContext.steps.push({
        step: "schema_validation",
        result: schemaValidationResult
      });
      console.log("Schema validation result:", schemaValidationResult);
    } catch (error) {
      console.error("Schema validation error:", error.message);
    }

    // Step 3: LLM performs intelligent validation
    const validationPrompt = `As a claim validation expert, analyze the extracted claim data for:
1. Data consistency and logical coherence
2. Compliance with regulatory requirements
3. Identification of any anomalies or inconsistencies
4. Assessment of data credibility

Provide JSON response with:
{
  "isValid": true/false,
  "validationScore": 0-100,
  "validationErrors": [],
  "validationWarnings": [],
  "requiresManualReview": true/false,
  "reasoning": "detailed explanation",
  "recommendedAction": "PASS_VALIDATION/FLAG_FOR_REVIEW/REJECT"
}`;

    console.log("Step 3: LLM performing intelligent validation...");
    const intelligentValidation = await generateContent(validationPrompt, "ValidationAgent-Intelligent");
    validationContext.steps.push({
      step: "intelligent_validation",
      result: intelligentValidation
    });
    console.log("Intelligent validation:", intelligentValidation);

    // Step 4: Compile validation summary
    const validationSummary = {
      claimId: extractedData.claimId || extractedData.claim?.claimId || "UNKNOWN",
      validationPassed: intelligentValidation.isValid || false,
      validationScore: intelligentValidation.validationScore || 0,
      criticalErrors: intelligentValidation.validationErrors || [],
      warnings: intelligentValidation.validationWarnings || [],
      manualReviewNeeded: intelligentValidation.requiresManualReview || false,
      nextAction: intelligentValidation.recommendedAction || "PENDING"
    };

    validationContext.result = {
      success: true,
      validationData: validationSummary,
      readyForNextStage: intelligentValidation.isValid && !intelligentValidation.requiresManualReview
    };

  } catch (error) {
    console.error("Validation agent error:", error);
    validationContext.result = {
      success: false,
      error: error.message,
      validationData: null,
      readyForNextStage: false
    };
  }

  console.log("=== VALIDATION AGENT COMPLETE ===\n");
  return validationContext;
};

export default validationAgent;
