import fs from "fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { initializeRAG, queryRAG } from "./rag.js";
import extractTool from "./tools/extractTool.js";
import validateTool from "./tools/validateTool.js";
import summaryTool from "./tools/summaryTool.js";
import fraudCheckTool from "./tools/fraudCheckTool.js";
import { generateContent } from "./helper.js";
// Initialize MCP server
const mcp = new McpServer({ name: "ClaimAI-Autonomous" });

// Register all tools
mcp.registerTool("extract_claim_fields",{}, extractTool);
mcp.registerTool("validate_claim",{}, validateTool);
mcp.registerTool("summarize_claim",{}, summaryTool);
mcp.registerTool("fraud_check",{}, fraudCheckTool);



// Helper: check if a tool is registered
function isToolRegistered(toolName) {
  // MCP exposes registered tools via `mcp._tools` (or `mcp.tools` in some versions)
  return Object.keys(mcp._registeredTools).includes(toolName);
}

  // Initialize RAG
  console.log("Initializing RAG...");
  await initializeRAG();
  console.log("RAG ready.");

export default async function autonomousAgent(userText, claimFormData) {

  // ───────────────────────────────────────────────
  // Enrich user text using RAG
  // ───────────────────────────────────────────────
  const enrichedText = await queryRAG(userText);

  let context = { results: {}, enrichedText };
  console.log(userText, enrichedText);
  let steps = 0;
  const maxSteps = 5;

  let times = {
     extract_claim_fields: "",
  validate_claim: "" ,
  fraud_check:  "",
  summarize_claim: "" ,
  };

  // List of tools and descriptions for LLM
let toolDescriptions = {
  extract_claim_fields: { name: "extract_claim_fields", description: "Extract structured fields from claim text"},
  validate_claim: { name: "validate_claim", description: "Validate extracted claim fields for missing info"},
  fraud_check: { name: "fraud_check", description: "Detect potential fraud in claim"},
  summarize_claim: { name: "summarize_claim", description: "Summarize claim in 1-2 sentences"},
  // { name: "save_to_db", description: "Save claim to database" }
};

  while (steps < maxSteps) {
    steps++;

    // Ask LLM which tool to call next
  const prompt = `
    You are an autonomous claim intake agent. Your task is to get the context from USER_INPUT, RESULT_SO_FAR and check the list of AVAILABLE_TOOLS.
    The Output should be a JSON object with "tool" and "input" fields where tool means which tool to call next and input means the input to provide to that tool.
    Respond with {"tool":"STOP", input: {}} if AVAILABLE_TOOLS is empty otherwise select a tool from AVAILABLE_TOOLS and provide its input.

    USER_INPUT: ${context.enrichedText}

    RESULT_SO_FAR: ${JSON.stringify(context.results)}

    AVAILABLE_TOOLS: ${JSON.stringify(Object.keys(toolDescriptions))}
  `;

    const decision = await generateContent(prompt, "autonomousOrchestrator");
    if (decision.tool === "STOP") break;

    if (!decision.tool || !isToolRegistered(decision.tool)) {
      console.error("Invalid tool requested by agent:", decision.tool);
      break;
    }
    delete toolDescriptions[decision.tool];
    // Call the selected tool via MCP
    const output = await mcp._registeredTools[decision.tool].handler(decision.input); // Get the registered tool function
    context.results[decision.tool] = output;
    times[decision.tool] = new Date().toISOString();
  }
 toolDescriptions = {
  extract_claim_fields: { name: "extract_claim_fields", description: "Extract structured fields from claim text"},
  validate_claim: { name: "validate_claim", description: "Validate extracted claim fields for missing info"},
  fraud_check: { name: "fraud_check", description: "Detect potential fraud in claim"},
  summarize_claim: { name: "summarize_claim", description: "Summarize claim in 1-2 sentences"},
  // { name: "save_to_db", description: "Save claim to database" }
};
  
  // Read existing results and append new result to array
  const newResult = {...times, ...claimFormData, summary: context?.results?.fraud_check?.reason || context?.results?.fraud_check?.summary|| context?.results?.summarize_claim?.summary || "" };
  let allResults = {};
  
  try {
    const existingData = fs.readFileSync("claim_results.json", "utf-8");
    allResults = JSON.parse(existingData);
  } catch (e) {
    // File doesn't exist or is empty, start fresh
    allResults = {};
  }
  
  // Check if user already has results
  const userId = claimFormData.id;
  if (allResults[userId]) {
    // If it's not an array, convert to array
    if (!Array.isArray(allResults[userId])) {
      allResults[userId] = [allResults[userId]];
    }
    // Generate claim ID based on array length
    const claimNumber = allResults[userId].length + 1;
    const claimId = `CLM${String(claimNumber).padStart(3, '0')}`;
    newResult.claimId = claimId;
    // Append new result to array
    allResults[userId].push(newResult);
  } else {
    // Create new entry with array containing the result
    const claimId = "CLM001";
    newResult.claimId = claimId;
    allResults[userId] = [newResult];
  }
  
  fs.writeFileSync("claim_results.json", JSON.stringify(allResults, null, 2));
  console.log("Results saved to claim_results.json");
}
