/**
 * Data Enrichment Agent
 * Orchestrates the data enrichment phase of claim processing
 * Uses LLM + RAG to find missing or incorrect information
 */

import { generateContent } from "../helper/helper.js";
import mcpServer from "../mcp/mcpServer.js";
import rag from "./rag/rag.js";

export const dataEnrichmentAgent = async (claimData, validationResults) => {
  console.log("initialise RAG");
  await rag.initializeRAG();
  console.log("\n=== DATA ENRICHMENT AGENT ===");
  console.log("Input claim data:", claimData);
  console.log("Validation results:", validationResults);

  const enrichmentContext = {
    agentName: "DataEnrichmentAgent",
    stage: "data_enrichment",
    timestamp: new Date().toISOString(),
    steps: []
  };

  try {
    // Step 1: Identify missing or incorrect information
    const identificationPrompt = `Analyze the claim data and validation results.
Identify:
1. Missing critical information
2. Potentially incorrect or suspicious data
3. Inconsistencies that need clarification

Provide JSON response with:
{
  "missingFields": [
    { "field": "field_name", "importance": "critical/important/optional", "reason": "why it's needed" }
  ],
  "suspiciousData": [
    { "field": "field_name", "issue": "description", "confidence": 0-1 }
  ],
  "ragQueries": [
    "query for knowledge base"
  ],
  "enrichmentStrategy": "description of enrichment plan"
}`;

    console.log("Step 1: LLM identifying missing/incorrect data...");
    const identificationResult = await generateContent(identificationPrompt, "EnrichmentAgent-Identify");
    enrichmentContext.steps.push({
      step: "data_identification",
      result: identificationResult
    });
    console.log("Identification result:", identificationResult);

    // Step 2: Use RAG to find relevant information
    if (identificationResult.ragQueries && identificationResult.ragQueries.length > 0) {
      console.log("Step 2: Using RAG to find relevant information...");
      const ragResults = [];

      for (const query of identificationResult.ragQueries) {
        try {
          const ragResult = await rag.queryRAG(
            JSON.stringify({
              query,
              documentPath: "./documents",
              topK: 3
            })
          );
          ragResults.push({
            query,
            result: ragResult
          });
          console.log(`RAG result for "${query}":`, ragResult);
        } catch (error) {
          console.error(`RAG error for query "${query}":`, error.message);
        }
      }

      enrichmentContext.steps.push({
        step: "rag_retrieval",
        results: ragResults
      });
    }

    // Step 3: LLM synthesizes enriched data
    const synthesisPrompt = `Based on the original claim data, identified missing information, and knowledge base results,
synthesize an enriched version of the claim data.

Provide JSON response with:
{
  "enrichedData": { "enhanced claim data object" },
  "newlyAddedFields": { "field": "value with source" },
  "correctedFields": { "field": "new_value with reason" },
  "dataQualityImprovement": "percentage improvement",
  "confidence": 0-1,
  "additionalNotesForReview": "any concerns or uncertainty"
}`;

    console.log("Step 3: LLM synthesizing enriched data...");
    const synthesisResult = await generateContent(synthesisPrompt, "EnrichmentAgent-Synthesis");
    enrichmentContext.steps.push({
      step: "data_synthesis",
      result: synthesisResult
    });
    console.log("Synthesis result:", synthesisResult);

    // Step 4: Convert enriched data to schema
    let finalEnrichedData = synthesisResult.enrichedData || claimData;

    console.log("Step 4: Converting enriched data to schema...");
    try {
      const converterResult = await mcpServer.callTool(
        "dataConverter",
        {
          data: finalEnrichedData,
          targetSchema: "enriched_claim_schema"
        }
      );
      enrichmentContext.steps.push({
        step: "enriched_conversion",
        result: converterResult
      });
      console.log("Converter result:", converterResult);

      if (converterResult.success) {
        finalEnrichedData = converterResult.data;
      }
    } catch (error) {
      console.error("Enrichment data conversion error:", error.message);
    }

    enrichmentContext.result = {
      success: true,
      enrichedData: finalEnrichedData,
      improvements: {
        newFields: synthesisResult.newlyAddedFields || {},
        correctedFields: synthesisResult.correctedFields || {},
        qualityImprovement: synthesisResult.dataQualityImprovement || "0%"
      },
      readyForNextStage: synthesisResult.confidence > 0.6
    };

  } catch (error) {
    console.error("Data enrichment agent error:", error);
    enrichmentContext.result = {
      success: false,
      error: error.message,
      enrichedData: claimData,
      readyForNextStage: false
    };
  }

  console.log("=== DATA ENRICHMENT AGENT COMPLETE ===\n");
  return enrichmentContext;
};

export default dataEnrichmentAgent;
