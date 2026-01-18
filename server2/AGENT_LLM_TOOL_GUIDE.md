# Agent-LLM-Tool Interaction Guide

## Overview

This document explains how agents interact with the LLM and tools in the claim intake system.

## Core Principles

### 1. **Only Agents Call LLM**
- Agents use `generateContent()` from helper.js to call LLM
- Agents receive JSON-formatted responses from LLM
- Agents use LLM to make intelligent decisions about which tools to use

### 2. **Tools Never Call LLM**
- Tools are pure functions focused on specific tasks
- Tools do not make any LLM calls
- Tools are stateless and deterministic

### 3. **Agents Make Tool Decisions**
- LLM helps agents decide which tools to use
- Agents extract parameters from LLM responses
- Agents execute tool calls via MCP server

### 4. **MCP Server Manages Tools**
- All tool registration happens in `mcp/mcpServer.js`
- Agents call tools via `mcpServer.callTool()`
- MCP server validates tool parameters

## Agent Interaction Pattern

### Step 1: Agent Receives Input
```javascript
const extractionAgent = async (rawClaimData) => {
  // Input: Raw claim data
}
```

### Step 2: Agent Calls LLM for Strategy
```javascript
const strategyDecision = await generateContent(
  "Analyze the raw claim data and decide which tools to use...",
  "AgentName-Step"
);
// Returns JSON with tool recommendations
```

### Step 3: Agent Extracts Tool Decisions
```javascript
{
  "toolsToUse": ["documentParser", "dataConverter"],
  "parameters": {
    "documentParser": { "document": {...} },
    "dataConverter": { "data": {...} }
  },
  "reasoning": "..."
}
```

### Step 4: Agent Calls Tools via MCP
```javascript
const parserResult = await mcpServer.callTool(
  "documentParser",
  { document: rawClaimData }
);
```

### Step 5: Agent Processes Tool Results
```javascript
if (parserResult.success) {
  extractedData = parserResult.data;
  // Use results for next step
}
```

### Step 6: Agent Calls LLM for Quality Assessment
```javascript
const qualityAssessment = await generateContent(
  "Review the tool output and assess quality...",
  "AgentName-Quality"
);
```

### Step 7: Agent Returns Results
```javascript
return {
  result: {
    success: true,
    data: processedData,
    readyForNextStage: true
  }
};
```

## Detailed Agent Flows

### Extraction Agent Flow

```
Input: Raw Claim Data
  ↓
LLM Call: "Decide extraction strategy"
  ├─ Tool Decision: documentParser?
  └─ Tool Decision: dataConverter?
  ↓
Tool Call: documentParser
  └─ Output: Extracted fields
  ↓
Tool Call: dataConverter (if needed)
  └─ Output: Standardized JSON
  ↓
LLM Call: "Assess extraction quality"
  ├─ Quality Score: 95%
  ├─ Completeness: 90%
  └─ Confidence: 0.9
  ↓
Output: Extracted Data + Quality Assessment
```

### Validation Agent Flow

```
Input: Extracted Data
  ↓
Tool Call: documentClassifier
  ├─ Claims Category: HEALTH_INSURANCE
  ├─ Severity: LOW
  └─ Completeness: COMPLETE
  ↓
Tool Call: schemaValidator
  ├─ Valid: true
  ├─ Errors: []
  └─ Warnings: []
  ↓
LLM Call: "Intelligently validate claim data"
  ├─ Consistency: OK
  ├─ Regulatory Compliance: OK
  └─ Anomalies: None
  ↓
Output: Validation Results + Pass/Fail Status
```

### Data Enrichment Agent Flow

```
Input: Extracted Data + Validation Results
  ↓
LLM Call: "Identify missing/incorrect data"
  ├─ Missing Fields: [email, phone]
  ├─ Suspicious Data: None
  └─ RAG Queries: ["policy coverage", "claim limits"]
  ↓
Tool Call: rag (for each query)
  ├─ Query: "policy coverage"
  └─ Results: Top 3 relevant docs
  ↓
LLM Call: "Synthesize enriched data using RAG results"
  ├─ Added Fields: {email, phone}
  ├─ Corrected Fields: {}
  └─ Quality Improvement: 15%
  ↓
Tool Call: dataConverter
  ├─ Convert to: enriched_claim_schema
  └─ Output: Enriched JSON
  ↓
Output: Enriched Data + Improvements Noted
```

### Fraud Screening Agent Flow

```
Input: Enriched Data
  ↓
Tool Call: rulesEngine
  ├─ Rules: "basic_fraud_rules"
  ├─ Passed: All checks passed
  └─ Flags: None
  ↓
Tool Call: riskCalculator
  ├─ Risk Score: 35/100
  ├─ Risk Level: LOW
  ├─ Factors: [amount, age, completeness, contact, type]
  └─ Details: Each factor breakdown
  ↓
LLM Call: "Perform fraud analysis"
  ├─ Fraud Risk: LOW
  ├─ Indicators: None detected
  ├─ Probability: 0.15
  └─ Action: APPROVE
  ↓
Output: Fraud Assessment + Risk Level
```

### Claim Routing Agent Flow

```
Input: All Previous Assessments
  ├─ Extracted Data
  ├─ Validation Results
  ├─ Enrichment Results
  └─ Fraud Screening Results
  ↓
Tool Call: riskCalculator (final assessment)
  └─ Final Risk Score: 35/100
  ↓
LLM Call: "Make final routing decision"
  ├─ Decision: APPROVE
  ├─ Queue: standard_processing
  ├─ Priority: standard
  ├─ Timeline: 5-7 days
  └─ Summary: "Claim approved for processing"
  ↓
Save Results to claim_results.json
  ├─ All assessment data
  ├─ Final decision
  ├─ Routing info
  └─ Timestamp
  ↓
Output: Complete Claim Result
```

## LLM Prompt Examples

### Strategy Decision Prompt (Extraction)
```
You are an expert claim extraction agent. Analyze the raw claim data and determine the best extraction strategy.
You have access to two tools:
1. documentParser - Parses documents and extracts structured data
2. dataConverter - Converts unstructured data to JSON schema

Based on the input data format, decide which tool(s) to use. Format your response as JSON with:
{
  "strategy": "description of extraction approach",
  "toolsToUse": ["tool1", "tool2"],
  "parameters": { ... },
  "reasoning": "explanation of why these tools were chosen"
}
```

### Fraud Analysis Prompt (Fraud Screening)
```
As a fraud detection expert, perform intelligent fraud analysis on this claim.
Consider:
1. The patterns and anomalies in the claim
2. The risk factors identified
3. The rules engine flags
4. Common fraud indicators
5. Context-specific risk factors

Provide JSON response with:
{
  "fraudRiskLevel": "LOW/MEDIUM/HIGH/CRITICAL",
  "fraudIndicators": [...],
  "overallFraudProbability": 0-1,
  "suspiciousPatterns": [],
  "recommendedAction": "APPROVE/FLAG_FOR_REVIEW/DENY",
  "reasoning": "detailed analysis",
  "needsInvestigation": true/false,
  "investigationPriority": "low/medium/high"
}
```

## Tool Execution Pattern via MCP

### Tool Registration
```javascript
// In mcpServer.js
mcp.registerTool("toolName", {
  description: "What the tool does",
  inputSchema: {
    type: "object",
    properties: { ... },
    required: [...]
  }
}, toolHandlerFunction);
```

### Tool Invocation by Agent
```javascript
// In agent
try {
  const result = await mcpServer.callTool("toolName", {
    param1: "value1",
    param2: "value2"
  });
  
  if (result.success) {
    // Process tool output
    const output = result.data;
  } else {
    // Handle error
    console.error(result.error);
  }
} catch (error) {
  // Handle execution error
}
```

### Tool Handler Pattern
```javascript
// In tool file
const myTool = async (params) => {
  try {
    // Validate inputs
    if (!params.requiredField) {
      throw new Error("requiredField is required");
    }

    // Process
    const result = performProcessing(params);

    // Return success
    return {
      success: true,
      data: result,
      message: "Processing completed"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

export default myTool;
```

## Error Handling

### Agent-Level Error Handling
```javascript
try {
  const result = await extractionAgent(data);
  
  if (!result.result.success) {
    console.error("Agent failed:", result.result.error);
    orchestrationLog.status = "FAILED_AT_EXTRACTION";
    return;
  }
  
  if (!result.result.readyForNextStage) {
    console.warn("Quality insufficient");
    return;
  }
} catch (error) {
  console.error("Uncaught error:", error);
}
```

### Tool-Level Error Handling
```javascript
// Tools catch and return errors
const result = await mcpServer.callTool("tool", params);

// Always check success flag
if (!result.success) {
  // Tool returned an error
  console.error("Tool error:", result.error);
} else {
  // Tool succeeded
  const output = result.data;
}
```

## Best Practices

### 1. LLM Prompt Design
- ✓ Be specific about output format (JSON)
- ✓ Provide tool names and descriptions
- ✓ Ask for reasoning/confidence
- ✓ Include constraints and requirements
- ✗ Don't ask LLM to call tools (agents do that)

### 2. Tool Implementation
- ✓ Focus on single responsibility
- ✓ Validate all inputs
- ✓ Return consistent result structure
- ✓ Include detailed error messages
- ✗ Don't make external API calls (except RAG)
- ✗ Don't call LLM from tools

### 3. Agent Implementation
- ✓ Use LLM for intelligent decisions
- ✓ Extract parameters carefully from LLM output
- ✓ Call appropriate tools based on decisions
- ✓ Process results and feed to next LLM call
- ✓ Maintain context from previous agents
- ✗ Don't hardcode tool selections

### 4. MCP Usage
- ✓ Always use mcpServer.callTool() for tool invocation
- ✓ Check success flag in results
- ✓ Handle errors gracefully
- ✓ Log tool calls for debugging

## Configuration

### LLM Configuration (in .env)
```
LLM_BASE_URL=http://localhost:11434
LLM_MODEL=qwen3:0.6b
```

### Tool Parameters

Each tool accepts specific parameters. See tool files for:
- Required vs optional params
- Expected data types
- Valid enum values
- Constraints and limits

## Monitoring & Debugging

### Enable Logging
All agents and tools log their operations to console showing:
- Step-by-step progress
- LLM prompts and responses
- Tool calls and results
- Decisions made
- Errors encountered

### Trace a Claim
1. Check console logs for processing details
2. Examine intermediate results in orchestrationLog
3. Review final claim_results.json for complete history
4. Check individual tool outputs for specifics

## Examples

### Complete Agent Execution Example
```javascript
// EXTRACTION AGENT EXAMPLE
const rawData = { claimNumber: "123", name: "John", amount: 5000 };

// Step 1: LLM decides strategy
const strategy = await generateContent(
  "Analyze this claim and decide which extraction tools to use",
  "ExtractionAgent"
);
// Returns: { toolsToUse: ["documentParser"], parameters: {...} }

// Step 2: Call tool via MCP
const parseResult = await mcpServer.callTool(
  "documentParser",
  strategy.parameters.documentParser
);
// Returns: { success: true, data: { claimNumber, claimant, ... } }

// Step 3: Optionally call another tool
const convertResult = await mcpServer.callTool(
  "dataConverter",
  { data: parseResult.data, targetSchema: "claim_intake_schema" }
);
// Returns: { success: true, data: { claim: {...}, claimant: {...} } }

// Step 4: LLM assesses quality
const quality = await generateContent(
  "Assess the extraction quality...",
  "ExtractionAgent-Quality"
);
// Returns: { extractionQuality: "excellent", completenessScore: 95 }

// Step 5: Return results
return {
  result: {
    success: true,
    extractedData: convertResult.data,
    quality: quality,
    readyForNextStage: true
  }
};
```

This pattern is used by all agents with variations based on their specific responsibilities.
