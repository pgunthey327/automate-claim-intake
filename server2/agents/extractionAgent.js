/**
 * Extraction Agent
 * Orchestrates the extraction phase of claim processing
 * Uses LLM to decide which tools to use and understand raw claim data
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

export const extractionAgent = async (rawClaimData) => {
  console.log("\n=== EXTRACTION AGENT ===");
  console.log("Input data:", rawClaimData);

  const extractionContext = {
    agentName: "ExtractionAgent",
    stage: "extraction",
    timestamp: new Date().toISOString(),
    steps: []
  };

  try {
    // Step 1: LLM decides the extraction strategy
    const strategySytemPrompt = `You are an expert claim extraction agent. Analyze the raw claim data and determine the best extraction strategy.
rawClaimData: ${JSON.stringify(rawClaimData)}

You have access to two tools:
1. documentParser - Parses documents and extracts structured data
2. dataConverter - Converts unstructured data to JSON schema

Based on the input data format, decide which tool(s) to use. Format your response as JSON with:
{
  "strategy": "description of extraction approach",
  "toolsToUse": ["tool1", "tool2"],
  "parameters": {
    "documentParser": { "document": {...}, "documentType": "claim_form" },
    "dataConverter": { "data": {...}, "targetSchema": ${JSON.stringify(claim_intake_schema)} }
  },
  "reasoning": "explanation of why these tools were chosen"
}`;

    console.log("Step 1: LLM analyzing extraction strategy...");
    const strategyDecision = await generateContent(strategySytemPrompt, "ExtractionAgent-Strategy");
    extractionContext.steps.push({
      step: "strategy_decision",
      decision: strategyDecision
    });

    console.log("Strategy decision:", strategyDecision);

    let extractedData = null;

    // Step 2: Execute tools based on LLM decision
    if (strategyDecision.toolsToUse && strategyDecision.toolsToUse.includes("documentParser")) {
      console.log("Step 2a: Using documentParser tool...");
      try {
        const parserResult = await mcpServer.callTool(
          "documentParser",
          strategyDecision.parameters.documentParser || { document: rawClaimData }
        );
        extractionContext.steps.push({
          step: "document_parsing",
          result: parserResult
        });
        console.log("Parser result:", parserResult);

        if (parserResult.success) {
          extractedData = parserResult.data;
        }
      } catch (error) {
        console.error("Document parser error:", error.message);
      }
    }

    // Step 3: Convert data to standard schema if needed
    if (strategyDecision.toolsToUse && strategyDecision.toolsToUse.includes("dataConverter")) {
      console.log("Step 2b: Using dataConverter tool...");
      try {
        const converterResult = await mcpServer.callTool(
          "dataConverter",
          strategyDecision.parameters.dataConverter || {
            data: extractedData || rawClaimData,
            targetSchema: claim_intake_schema
          }
        );
        extractionContext.steps.push({
          step: "data_conversion",
          result: converterResult
        });
        console.log("Converter result:", converterResult);

        if (converterResult.success) {
          extractedData = converterResult.data;
        }
      } catch (error) {
        console.error("Data converter error:", error.message);
      }
    }

    // Step 4: LLM validates extraction quality
    const validationPrompt = `Review the extracted claim data and assess its quality and completeness.
Provide JSON response with:
{
  "extractionQuality": "excellent/good/fair/poor",
  "completenessScore": 0-100,
  "missingCriticalFields": [],
  "confidenceLevel": 0-1,
  "summary": "brief summary of extracted data"
}`;

    console.log("Step 3: LLM validating extraction quality...");
    const qualityAssessment = await generateContent(validationPrompt, "ExtractionAgent-Quality");
    extractionContext.steps.push({
      step: "quality_assessment",
      assessment: qualityAssessment
    });

    console.log("Quality assessment:", qualityAssessment);

    extractionContext.result = {
      success: true,
      extractedData,
      quality: qualityAssessment,
      readyForNextStage: qualityAssessment.completenessScore >= 70
    };

  } catch (error) {
    console.error("Extraction agent error:", error);
    extractionContext.result = {
      success: false,
      error: error.message,
      extractedData: null,
      readyForNextStage: false
    };
  }

  console.log("=== EXTRACTION AGENT COMPLETE ===\n", extractionContext);
  return extractionContext;
};

export default extractionAgent;
