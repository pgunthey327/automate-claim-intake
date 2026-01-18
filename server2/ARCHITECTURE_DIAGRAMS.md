# System Architecture Diagrams

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATION                                     │
│                                                                                  │
│  POST /api/process-claim                                                        │
│  {                                                                               │
│    "claimFormData": {                                                           │
│      "claimNumber": "CLM-2024-001",                                            │
│      "claimantName": "John Doe",                                               │
│      "claimType": "health",                                                    │
│      "amount": 5000,                                                           │
│      ...                                                                        │
│    }                                                                            │
│  }                                                                              │
└──────────────────────────────┬──────────────────────────────────────────────────┘
                               │
                               ↓
        ┌──────────────────────────────────────────────────────┐
        │  SERVER.JS (Express)                                 │
        │  - Initialize MCP Server                             │
        │  - Register 7 Tools                                  │
        │  - Return 202 Accepted                               │
        └──────────────────┬───────────────────────────────────┘
                           │
                           ↓ (Async)
        ┌──────────────────────────────────────────────────────┐
        │  AUTONOMOUS ORCHESTRATOR                             │
        │  Coordinates 5-Stage Pipeline                        │
        └──────────────────┬───────────────────────────────────┘
                           │
        ┌──────────────────┴───────────────────┐
        │                                      │
        ↓                                      ↓
┌─────────────────────────────────────┐  ┌──────────────────────┐
│  EXTRACTION AGENT                   │  │  MCP SERVER          │
│                                     │  │  ┌────────────────┐  │
│ 1. LLM: "Analyze raw claim data"   │  │  │ Tool Registry  │  │
│    → Decision: Which tools to use?  │  │  │                │  │
│                                     │  │  │ 1. documentP.  │  │
│ 2. Call Tool: documentParser        │  │  │ 2. dataConv.   │  │
│    → Input: Raw claim               │  │  │ 3. schemVal.   │  │
│    → Output: Extracted fields       │  │  │ 4. docClass.   │  │
│                                     │  │  │ 5. rulesEng.   │  │
│ 3. Call Tool: dataConverter         │  │  │ 6. riskCalc.   │  │
│    → Input: Extracted data          │  │  │ 7. rag         │  │
│    → Output: Schema JSON            │  │  │                │  │
│                                     │  │  └────────────────┘  │
│ 4. LLM: "Assess extraction quality" │  │                      │
│    → Quality: 95%, Ready: YES       │  │  Agent calls:        │
│                                     │  │  await mcp.callTool()│
│ Output: Extracted Data              │  │                      │
└─────────┬───────────────────────────┘  └──────────────────────┘
          │
          ↓
┌─────────────────────────────────────┐
│  VALIDATION AGENT                   │
│                                     │
│ 1. Call Tool: documentClassifier    │
│    → Categories: TYPE, SEVERITY     │
│                                     │
│ 2. Call Tool: schemaValidator       │
│    → Valid: YES, Errors: NONE       │
│                                     │
│ 3. LLM: "Validate claim data"       │
│    → Consistency: OK                │
│    → Compliance: OK                 │
│                                     │
│ Output: Validation Results          │
└─────────┬───────────────────────────┘
          │
          ↓
┌─────────────────────────────────────┐
│  DATA ENRICHMENT AGENT              │
│                                     │
│ 1. LLM: "Identify missing data"     │
│    → Missing: [email, phone]        │
│    → RAG Queries: [...]             │
│                                     │
│ 2. Call Tool: rag                   │
│    → Query: "policy coverage"       │
│    → Results: Relevant docs         │
│                                     │
│ 3. LLM: "Synthesize enriched data"  │
│    → Added Fields: {email, phone}   │
│    → Quality: +15%                  │
│                                     │
│ 4. Call Tool: dataConverter         │
│    → Convert to: enriched_schema    │
│                                     │
│ Output: Enhanced Data               │
└─────────┬───────────────────────────┘
          │
          ↓
┌─────────────────────────────────────┐
│  FRAUD SCREENING AGENT              │
│                                     │
│ 1. Call Tool: rulesEngine           │
│    → Rule Set: "basic_fraud_rules"  │
│    → Flags: NONE                    │
│                                     │
│ 2. Call Tool: riskCalculator        │
│    → Risk Score: 35/100             │
│    → Risk Level: LOW                │
│                                     │
│ 3. LLM: "Fraud analysis"            │
│    → Probability: 0.15              │
│    → Action: APPROVE                │
│                                     │
│ Output: Fraud Assessment            │
└─────────┬───────────────────────────┘
          │
          ↓
┌─────────────────────────────────────┐
│  CLAIM ROUTING AGENT                │
│                                     │
│ 1. Compile all assessments          │
│    → Validation: PASSED             │
│    → Fraud Risk: LOW                │
│    → Data Quality: +15%             │
│                                     │
│ 2. Call Tool: riskCalculator        │
│    → Final Risk Score: 35/100       │
│                                     │
│ 3. LLM: "Make final decision"       │
│    → Decision: APPROVED             │
│    → Queue: standard_processing     │
│    → Priority: standard             │
│    → Timeline: 5-7 days             │
│                                     │
│ 4. Save Results                     │
│    → File: output/claim_results.json│
│                                     │
│ Output: Final Claim Result          │
└──────────┬────────────────────────────┘
           │
           ↓
    ┌──────────────────────────────────────┐
    │  claim_results.json                  │
    │  {                                   │
    │    "claimId": "CLM-2024-001",       │
    │    "claimStatus": "APPROVED",       │
    │    "decision": {                    │
    │      "action": "APPROVE",           │
    │      "queue": "std_processing",     │
    │      "priority": "standard"         │
    │    },                               │
    │    "assessment": { ... },           │
    │    "routing": { ... },              │
    │    "processedAt": "..."             │
    │  }                                  │
    └──────────────────────────────────────┘
           │
           ↓
    ┌──────────────────────────────────────┐
    │  Client: GET /api/claim-results      │
    │  Retrieves complete result           │
    └──────────────────────────────────────┘
```

---

## Agent-Tool Interaction Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                        EXTRACTION AGENT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STEP 1: LLM DECISION                                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Input to LLM:                                             │  │
│  │ "Analyze this raw claim data format and decide which     │  │
│  │  tools to use for extraction"                            │  │
│  │                                                           │  │
│  │ LLM Response (JSON):                                      │  │
│  │ {                                                         │  │
│  │   "toolsToUse": ["documentParser", "dataConverter"],     │  │
│  │   "parameters": {                                         │  │
│  │     "documentParser": { "document": {...} },             │  │
│  │     "dataConverter": { "data": {...} }                   │  │
│  │   },                                                      │  │
│  │   "reasoning": "..."                                      │  │
│  │ }                                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│  STEP 2: EXTRACT TOOL DECISIONS                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Agent extracts:                                           │  │
│  │ - toolsToUse = ["documentParser", "dataConverter"]       │  │
│  │ - parameters = {...}                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│  STEP 3: CALL TOOLS VIA MCP                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Agent Code:                                               │  │
│  │ const result1 = await mcpServer.callTool(                │  │
│  │   "documentParser",                                       │  │
│  │   parameters.documentParser                              │  │
│  │ );                                                        │  │
│  │                                                           │  │
│  │ const result2 = await mcpServer.callTool(                │  │
│  │   "dataConverter",                                        │  │
│  │   parameters.dataConverter                               │  │
│  │ );                                                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│  STEP 4: PROCESS RESULTS                                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ if (result1.success) {                                    │  │
│  │   extractedData = result1.data;  // Use parsed output    │  │
│  │ }                                                         │  │
│  │                                                           │  │
│  │ if (result2.success) {                                    │  │
│  │   extractedData = result2.data;  // Use converted output │  │
│  │ }                                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│  STEP 5: VALIDATE QUALITY WITH LLM                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ const quality = await generateContent(                   │  │
│  │   "Review extraction quality...",                         │  │
│  │   "ExtractionAgent-Quality"                              │  │
│  │ );                                                        │  │
│  │                                                           │  │
│  │ Returns: { extractionQuality, completeness, confidence } │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│  OUTPUT: Agent Result                                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ {                                                         │  │
│  │   result: {                                               │  │
│  │     success: true,                                        │  │
│  │     extractedData: {...},                                │  │
│  │     quality: {...},                                       │  │
│  │     readyForNextStage: true                              │  │
│  │   }                                                       │  │
│  │ }                                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Key Insight:
→ ONLY agents call LLM
→ Tools NEVER call LLM
→ Agents call tools via MCP.callTool()
→ Agents process tool outputs intelligently
```

---

## Tool Registration Pattern (MCP Server)

```
┌─────────────────────────────────────────────────────────────┐
│  MCP SERVER (mcpServer.js)                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  INITIALIZATION:                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ constructor() {                                     │   │
│  │   this.mcp = new McpServer({                        │   │
│  │     name: "claim-processing-mcp",                  │   │
│  │     version: "1.0.0"                               │   │
│  │   });                                              │   │
│  │   this.setupTools();                               │   │
│  │ }                                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  TOOL REGISTRATION:                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ setupTools() {                                      │   │
│  │                                                    │   │
│  │   // Tool 1                                        │   │
│  │   mcp.registerTool("documentParser", {             │   │
│  │     description: "Parses documents...",           │   │
│  │     inputSchema: { type: "object", ... }          │   │
│  │   }, documentParserHandler);                       │   │
│  │                                                    │   │
│  │   // Tool 2                                        │   │
│  │   mcp.registerTool("dataConverter", {              │   │
│  │     description: "Converts data...",              │   │
│  │     inputSchema: { type: "object", ... }          │   │
│  │   }, dataConverterHandler);                        │   │
│  │                                                    │   │
│  │   // ... Tool 3-7 registered similarly ...        │   │
│  │                                                    │   │
│  │ }                                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  AGENT INVOCATION:                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ // Agent calls:                                     │   │
│  │ const result = await mcpServer.callTool(            │   │
│  │   "documentParser",                                 │   │
│  │   { document: data, documentType: "claim_form" }   │   │
│  │ );                                                  │   │
│  │                                                    │   │
│  │ // MCP finds tool in registry                      │   │
│  │ // Validates parameters against schema             │   │
│  │ // Calls tool handler function                     │   │
│  │ // Returns { success, data, message/error }        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  REGISTERED TOOLS:                                          │
│  ├─ documentParser       ✓ registered                       │
│  ├─ dataConverter        ✓ registered                       │
│  ├─ schemaValidator      ✓ registered                       │
│  ├─ documentClassifier   ✓ registered                       │
│  ├─ rulesEngine          ✓ registered                       │
│  ├─ riskCalculator       ✓ registered                       │
│  └─ rag                  ✓ registered                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Transformation Through Pipeline

```
INPUT: Raw Claim Data
┌────────────────────────────────────────┐
│ {                                      │
│   "claimNumber": "CLM-2024-001",      │
│   "claimantName": "John Doe",         │
│   "claimType": "health",              │
│   "claimDate": "2024-01-15",          │
│   "amount": 5000,                     │
│   "description": "Medical procedure"  │
│ }                                      │
└────────────────────────────────────────┘
              ↓ EXTRACTION AGENT
┌────────────────────────────────────────┐
│ Extracted Data (Standardized JSON)     │
│ {                                      │
│   "claim": {                           │
│     "claimId": "CLM-2024-001",        │
│     "claimType": "HEALTH_INSURANCE",   │
│     "status": "PENDING_VALIDATION"     │
│   },                                   │
│   "claimant": {                        │
│     "name": "John Doe"                 │
│   },                                   │
│   "incident": {                        │
│     "date": "2024-01-10",             │
│     "amount": 5000,                    │
│     "description": "Medical procedure" │
│   }                                    │
│ }                                      │
└────────────────────────────────────────┘
         ↓ VALIDATION AGENT
┌────────────────────────────────────────┐
│ Validation Results Added:              │
│ ✓ All required fields present          │
│ ✓ No schema violations                 │
│ ✓ Data consistency OK                  │
│ Validation Score: 100%                 │
└────────────────────────────────────────┘
      ↓ DATA ENRICHMENT AGENT
┌────────────────────────────────────────┐
│ Enriched Data:                         │
│ + Added: email, phone, address         │
│ + Improved completeness: 90% → 100%    │
│ + Quality improvement: +15%            │
│ + Added policy details from RAG        │
└────────────────────────────────────────┘
     ↓ FRAUD SCREENING AGENT
┌────────────────────────────────────────┐
│ Fraud Assessment:                      │
│ ✓ Business rules: ALL PASSED           │
│ ✓ Risk score: 35/100 (LOW)             │
│ ✓ No fraud indicators detected         │
│ ✓ Fraud probability: 0.15              │
└────────────────────────────────────────┘
      ↓ CLAIM ROUTING AGENT
┌────────────────────────────────────────┐
│ Final Claim Result:                    │
│ {                                      │
│   "claimId": "CLM-2024-001",          │
│   "claimStatus": "APPROVED",           │
│   "decision": {                        │
│     "action": "APPROVE",               │
│     "queue": "standard_processing",    │
│     "priority": "standard",            │
│     "estimatedTime": "5-7 days"        │
│   },                                   │
│   "assessment": {                      │
│     "validationScore": 100,            │
│     "fraudRiskLevel": "LOW",           │
│     "enrichmentQuality": "+15%"        │
│   },                                   │
│   "processedAt": "2024-01-19T..."      │
│ }                                      │
└────────────────────────────────────────┘
         ↓ SAVED TO FILE
    claim_results.json
```

---

## Error Handling Flow

```
Claim Processing → Any Stage Fails
                        ↓
                ┌───────────────┐
                │  Try-Catch    │
                │  Block        │
                └───────┬───────┘
                        ↓
        ┌───────────────────────────────┐
        │ Log Error Details             │
        │ - Stage name                  │
        │ - Error message               │
        │ - Stack trace                 │
        └───────────┬───────────────────┘
                    ↓
        ┌───────────────────────────────┐
        │ Decide on Continuation        │
        │                               │
        │ Option 1: Stop Pipeline       │
        │ → Return failure status       │
        │                               │
        │ Option 2: Skip Stage          │
        │ → Continue with original data │
        │ → Add warning to results      │
        └───────────┬───────────────────┘
                    ↓
        ┌───────────────────────────────┐
        │ Return Partial Results        │
        │ - Stages completed: noted     │
        │ - Stages failed: documented   │
        │ - Error details: included     │
        └───────────────────────────────┘

Tools handle errors similarly:
Try-Catch → Return { success: false, error: "message" }
Agents check: if (!result.success) { handle error }
```

---

## API Endpoint Sequence

```
CLIENT                          SERVER
  │                               │
  ├─ POST /api/process-claim ───→ │
  │                               │
  │                               ├─ Initialize MCP
  │                               │
  │                               ├─ Start Orchestrator (async)
  │                               │
  │  ← 202 Accepted ──────────────┤
  │  {                            │
  │    "message": "processing",   │
  │    "status": "processing"     │
  │  }                            │
  │                               │
  │  (Claim processing continues in background)
  │                               │
  ├─ GET /api/claim-results ─────→ │
  │  (Wait for results)           │
  │                               │
  │  ← 200 OK ────────────────────┤
  │  {                            │
  │    "success": true,           │
  │    "count": 1,                │
  │    "results": [{...}]         │
  │  }                            │
  │                               │
  ├─ GET /api/health ────────────→ │
  │                               │
  │  ← 200 OK ────────────────────┤
  │  {                            │
  │    "status": "healthy",       │
  │    "tools": {                 │
  │      "registered": 7,         │
  │      "list": [...]            │
  │    }                           │
  │  }                            │
  │                               │
  └─ Done                         │
```

---

## Tool Result Structure

```
All tools return consistent structure:

SUCCESS CASE:
┌──────────────────────────────────┐
│ {                                │
│   "success": true,               │
│   "data": { ... },               │
│   "message": "Description"       │
│ }                                │
└──────────────────────────────────┘

ERROR CASE:
┌──────────────────────────────────┐
│ {                                │
│   "success": false,              │
│   "error": "Error message",      │
│   "data": null                   │
│ }                                │
└──────────────────────────────────┘

Agent Usage:
┌──────────────────────────────────┐
│ const result = await mcp.        │
│   callTool("toolName", params);  │
│                                  │
│ if (result.success) {            │
│   // Use result.data             │
│ } else {                          │
│   // Handle result.error         │
│ }                                │
└──────────────────────────────────┘
```

---

This visual reference complements the technical documentation for better understanding of the system architecture.
