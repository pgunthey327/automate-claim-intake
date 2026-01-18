import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import orchestrator from "./orchestrator/autonomousOrchestrator.js";
import mcpServer from "./mcp/mcpServer.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// =====================================================================
// Initialize MCP Server and Tools
// =====================================================================
console.log("🔧 Initializing MCP Server with tools...");
try {
  const registeredTools = mcpServer.getRegisteredTools();
  console.log("✓ MCP Server initialized successfully");
  console.log("✓ Registered tools:", Object.keys(registeredTools).join(", "));
} catch (error) {
  console.error("❌ Failed to initialize MCP Server:", error.message);
}

// =====================================================================
// API Endpoint: Process Claim
// =====================================================================
app.post("/api/process-claim", async (req, res) => {
  const { text, claimFormData } = req.body;

  try {
    console.log("\n📥 Received claim processing request");
    
    // Set LLM configuration
    process.env.baseUrl = process.env.LLM_BASE_URL || "http://localhost:11434";
    process.env.modelName = process.env.LLM_MODEL || "qwen3:0.6b";

    console.log(`✓ LLM Config: ${process.env.baseUrl} / ${process.env.modelName}`);

    // Start orchestration asynchronously
    // Return 202 immediately while processing happens in background
    res.status(202).json({
      message: "Claim processing started",
      status: "processing"
    });

    // Process claim asynchronously
    await orchestrator(text, claimFormData);
    
    console.log("✓ Claim processing completed");

  } catch (err) {
    console.error("❌ Claim processing error:", err.message);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      stage: "initialization"
    });
  }
});

// =====================================================================
// API Endpoint: Get Claim Results
// =====================================================================
app.get("/api/claim-results", (req, res) => {
  try {
    const resultsPath = path.join(process.cwd(), "output", "claim_results.json");
    
    if (!fs.existsSync(resultsPath)) {
      return res.status(404).json({ 
        success: false, 
        error: "No claim results found yet",
        message: "Processing may still be in progress"
      });
    }

    const data = fs.readFileSync(resultsPath, "utf-8");
    const results = JSON.parse(data);
    
    res.status(200).json({
      success: true,
      count: Array.isArray(results) ? results.length : 1,
      results: results
    });
  } catch (err) {
    console.error("❌ Error retrieving claim results:", err.message);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// =====================================================================
// API Endpoint: Get Claim Results by ID
// =====================================================================
app.get("/api/claim-results/:claimId", (req, res) => {
  try {
    const { claimId } = req.params;
    const resultsPath = path.join(process.cwd(), "output", "claim_results.json");

    if (!fs.existsSync(resultsPath)) {
      return res.status(404).json({ 
        success: false, 
        error: "No claim results found"
      });
    }

    const data = fs.readFileSync(resultsPath, "utf-8");
    let results = JSON.parse(data);

    // Normalize to array
    if (!Array.isArray(results)) {
      results = [results];
    }

    const claimResult = results.find(r => r.claimId === claimId);

    if (!claimResult) {
      return res.status(404).json({ 
        success: false, 
        error: `Claim ${claimId} not found`
      });
    }

    res.status(200).json({
      success: true,
      result: claimResult
    });
  } catch (err) {
    console.error("❌ Error retrieving claim result:", err.message);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// =====================================================================
// Health Check Endpoint
// =====================================================================
app.get("/api/health", (req, res) => {
  const tools = mcpServer.getRegisteredTools();
  res.status(200).json({
    status: "healthy",
    service: "Autonomous Claim Intake MCP Orchestrator",
    timestamp: new Date().toISOString(),
    tools: {
      registered: Object.keys(tools).length,
      list: Object.keys(tools)
    },
    llmConfig: {
      baseUrl: process.env.LLM_BASE_URL || "http://localhost:11434",
      model: process.env.LLM_MODEL || "qwen3:0.6b"
    }
  });
});

// =====================================================================
// Server Startup
// =====================================================================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║    Autonomous Claim Intake MCP Orchestrator Started           ║");
  console.log(`║    Server running on port ${PORT}`.padEnd(62) + "║");
  console.log("║    Endpoints:                                                ║");
  console.log("║      POST   /api/process-claim        - Submit claim          ║");
  console.log("║      GET    /api/claim-results        - Get all results       ║");
  console.log("║      GET    /api/claim-results/:id    - Get specific result   ║");
  console.log("║      GET    /api/health               - Health check          ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");
});
