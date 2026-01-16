import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import autonomousAgent from "./autonomousOrchestrator.js";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/process-claim", (req, res) => {
  const { text, claimFormData } = req.body;

  try {
 console.log(text);
    process.env.baseUrl = "http://localhost:11434";
    process.env.modelName = "qwen3:0.6b";
    autonomousAgent(text, claimFormData);
    res.status(202).send();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/claim-results", (req, res) => {
  try {
    const data = fs.readFileSync("claim_results.json", "utf-8");
    res.status(200).json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(process.env.PORT || 3001, () =>
  console.log(`Autonomous MCP Orchestrator running on port ${process.env.PORT || 3001}`)
);
