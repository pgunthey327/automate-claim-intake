# Autonomous Claim Intake MCP Orchestrator

## Architecture Overview

This is an agentic AI solution for automated claim intake processing using Model Context Protocol (MCP) to manage a system of specialized agents and tools.

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLAIM PROCESSING PIPELINE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CLIENT                                                   │  │
│  │  POST /api/process-claim { text, claimFormData }         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  SERVER (Express + MCP)                                  │  │
│  │  - Initializes MCP Server                                │  │
│  │  - Registers Tools                                        │  │
│  │  - Invokes Orchestrator                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  AUTONOMOUS ORCHESTRATOR                                 │  │
│  │  Sequential Stage Execution                              │  │
│  │                                                           │  │
│  │  Stage 1: EXTRACTION                                    │  │
│  │  Stage 2: VALIDATION                                    │  │
│  │  Stage 3: DATA ENRICHMENT                               │  │
│  │  Stage 4: FRAUD SCREENING                               │  │
│  │  Stage 5: CLAIM ROUTING (Final Decision)                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  MCP SERVER MANAGING TOOLS AND AGENT COMMUNICATION       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  AGENTS (5 Total)             TOOLS (7 Total)            │  │
│  ├─────────────────────────────┬──────────────────────────┤  │
│  │ 1. ExtractionAgent          │ 1. documentParser        │  │
│  │ 2. ValidationAgent          │ 2. dataConverter         │  │
│  │ 3. DataEnrichmentAgent      │ 3. schemaValidator       │  │
│  │ 4. FraudScreeningAgent      │ 4. documentClassifier    │  │
│  │ 5. ClaimRoutingAgent        │ 5. rulesEngine           │  │
│  │                              │ 6. riskCalculator        │  │
│  │ LLM Calls via helper.js      │ 7. rag                   │  │
│  └─────────────────────────────┴──────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. MCP Server (`mcp/mcpServer.js`)

Manages registration and execution of all tools.

**Features:**
- Registers 7 tools with their schemas
- Provides interface for agents to call tools
- Maintains tool registry

**Key Methods:**
```javascript
mcp.registerTool(name, schema, handlerFunction)
mcpServer.callTool(toolName, parameters)
mcpServer.getRegisteredTools()
```

### 2. Agents (5 Total)

Each agent uses LLM to make decisions and call appropriate tools:

#### Agent 1: Extraction Agent (`agents/extractionAgent.js`)
**Purpose:** Extract structured data from raw claim
**LLM Responsibilities:**
- Analyze raw claim data format
- Decide extraction strategy
- Validate extraction quality

**Tools Used:**
- `documentParser` - Parse documents
- `dataConverter` - Convert to JSON schema

**Output:** Extracted claim data in standard format

---

#### Agent 2: Validation Agent (`agents/validationAgent.js`)
**Purpose:** Validate extracted data against schema
**LLM Responsibilities:**
- Perform intelligent validation checks
- Assess data consistency and regulatory compliance
- Identify anomalies

**Tools Used:**
- `documentClassifier` - Classify claim data
- `schemaValidator` - Validate against schema

**Output:** Validation results with pass/fail status

---

#### Agent 3: Data Enrichment Agent (`agents/dataEnrichmentAgent.js`)
**Purpose:** Find and fill missing information
**LLM Responsibilities:**
- Identify missing/incorrect fields
- Generate RAG queries for knowledge base
- Synthesize enriched data

**Tools Used:**
- `rag` - Query knowledge base
- `dataConverter` - Convert to enriched schema

**Output:** Enhanced claim data with improvements noted

---

#### Agent 4: Fraud Screening Agent (`agents/fraudScreeningAgent.js`)
**Purpose:** Detect potential fraud indicators
**LLM Responsibilities:**
- Perform intelligent fraud analysis
- Identify suspicious patterns
- Assess fraud probability

**Tools Used:**
- `rulesEngine` - Execute business rules
- `riskCalculator` - Calculate risk score

**Output:** Fraud assessment with risk level

---

#### Agent 5: Claim Routing Agent (`agents/routingAgent.js`)
**Purpose:** Make final routing decision
**LLM Responsibilities:**
- Consider all previous assessments
- Make routing decision
- Provide summary and reasoning

**Tools Used:**
- `riskCalculator` - Final risk assessment

**Output:** Claim result with routing decision, saved to file

### 3. Tools (7 Total)

Tools perform specific functions without calling LLM:

| Tool | Purpose | No LLM | Input | Output |
|------|---------|--------|-------|--------|
| **documentParser** | Parse documents & extract fields | ✓ | Document content | Structured data |
| **dataConverter** | Convert data to schema | ✓ | Data + target schema | Formatted JSON |
| **schemaValidator** | Validate against schema | ✓ | Data + schema | Validation results |
| **documentClassifier** | Classify claim data | ✓ | Claim data | Classifications |
| **rulesEngine** | Execute business rules | ✓ | Claim data + rule set | Rule evaluation |
| **riskCalculator** | Calculate risk score | ✓ | Claim data + factors | Risk assessment |
| **rag** | Query knowledge base | ✓ | Query string | Relevant documents |

### 4. Helper (`helper/helper.js`)

LLM interface for agents:
```javascript
generateContent(prompt, callerName)
// Makes HTTP call to LLM (Ollama format)
// Returns parsed JSON response
```

### 5. Orchestrator (`orchestrator/autonomousOrchestrator.js`)

Executes all agents in sequence:

```
Input: Raw Claim Data
  ↓
Stage 1: EXTRACTION
  - Extract structured data
  - Validate extraction quality
  ↓
Stage 2: VALIDATION
  - Classify claim
  - Validate against schema
  ↓
Stage 3: DATA ENRICHMENT
  - Identify missing info
  - Query knowledge base
  - Synthesize enriched data
  ↓
Stage 4: FRAUD SCREENING
  - Execute business rules
  - Calculate risk score
  - Analyze fraud patterns
  ↓
Stage 5: CLAIM ROUTING
  - Make final decision
  - Assign to queue
  - Save results
  ↓
Output: Claim Result (saved to claim_results.json)
```

## Installation & Setup

### 1. Install Dependencies

```bash
cd server2
npm install
```

### 2. Environment Configuration

Create `.env` file:

```env
PORT=3001
LLM_BASE_URL=http://localhost:11434
LLM_MODEL=qwen3:0.6b
```

### 3. LLM Setup

Ensure Ollama or compatible LLM server is running:

```bash
ollama serve
```

In another terminal, pull model:

```bash
ollama pull qwen3:0.6b
```

### 4. Start Server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

## API Usage

### Submit Claim for Processing

```bash
POST /api/process-claim
Content-Type: application/json

{
  "claimFormData": {
    "claimNumber": "CLM-2024-001",
    "claimantName": "John Doe",
    "claimType": "medical",
    "claimDate": "2024-01-15",
    "amount": 5000,
    "description": "Medical treatment claim",
    "incidentDate": "2024-01-10",
    "email": "john@example.com",
    "phone": "+1-555-0123"
  }
}
```

**Response (202 Accepted):**
```json
{
  "message": "Claim processing started",
  "status": "processing"
}
```

### Get All Claim Results

```bash
GET /api/claim-results
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "results": [
    {
      "claimId": "CLM-2024-001",
      "claimStatus": "PENDING_ADDITIONAL_INFO",
      "assessment": { ... },
      "routing": { ... },
      ...
    }
  ]
}
```

### Get Specific Claim Result

```bash
GET /api/claim-results/CLM-2024-001
```

### Health Check

```bash
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "Autonomous Claim Intake MCP Orchestrator",
  "tools": {
    "registered": 7,
    "list": ["documentParser", "dataConverter", ...]
  },
  "llmConfig": { ... }
}
```

## Data Flow Example

### Input Claim:
```json
{
  "claimNumber": "CLM-2024-001",
  "claimantName": "John Doe",
  "claimType": "health",
  "claimDate": "2024-01-15",
  "amount": 5000,
  "description": "Medical treatment",
  "incidentDate": "2024-01-10"
}
```

### Processing Stages:

**Stage 1 - Extraction:**
- documentParser extracts fields
- dataConverter converts to standard schema
- Output: Structured claim data

**Stage 2 - Validation:**
- documentClassifier categorizes as HEALTH_INSURANCE, LOW severity
- schemaValidator checks all required fields
- LLM validates consistency
- Output: PASSED validation (100% complete)

**Stage 3 - Data Enrichment:**
- LLM identifies missing contact info
- RAG queries knowledge base for policy details
- dataConverter enriches with additional data
- Output: Enhanced data with 90% quality improvement

**Stage 4 - Fraud Screening:**
- rulesEngine checks business rules (all passed)
- riskCalculator computes risk score (35/100 - LOW)
- LLM analyzes fraud patterns
- Output: LOW fraud risk, no investigation needed

**Stage 5 - Claim Routing:**
- Final risk assessment (35/100)
- LLM makes routing decision
- Output: APPROVED, assigned to standard_processing queue

### Final Result (claim_results.json):
```json
{
  "claimId": "CLM-2024-001",
  "claimStatus": "APPROVED",
  "decision": {
    "action": "APPROVE",
    "queue": "standard_processing",
    "priority": "standard",
    "estimatedProcessingTime": "5-7 days"
  },
  "assessment": {
    "validationPassed": true,
    "validationScore": 100,
    "fraudRiskLevel": "LOW",
    "fraudProbability": 0.15
  },
  "routing": {
    "requiresAdditionalInfo": false,
    "flaggedForReview": false
  },
  "processedAt": "2024-01-19T10:30:00.000Z"
}
```

## Key Design Principles

1. **Agent-Only LLM Calls**: Only agents call LLM (via helper.js), never tools
2. **Tool Independence**: Tools are stateless and focused on single responsibilities
3. **MCP Centralization**: All tool access goes through MCP server
4. **Sequential Processing**: Stages execute in order for consistency
5. **Rich Context**: Each agent has full context from previous stages
6. **Asynchronous Processing**: Server returns immediately, processes in background
7. **Comprehensive Logging**: Detailed logs at each stage for debugging

## Project Structure

```
server2/
├── server.js                          # Express server with API endpoints
├── package.json                       # Dependencies
├── helper/
│   └── helper.js                      # LLM interface
├── mcp/
│   └── mcpServer.js                   # MCP server & tool registration
├── agents/
│   ├── extractionAgent.js             # Agent 1
│   ├── validationAgent.js             # Agent 2
│   ├── dataEnrichmentAgent.js         # Agent 3
│   ├── fraudScreeningAgent.js         # Agent 4
│   ├── routingAgent.js                # Agent 5
│   └── rag/
│       ├── loader.js                  # RAG document loader
│       ├── rag.js                     # RAG query interface
│       └── pdfUtil.js                 # PDF utilities
├── tools/
│   ├── documentParser.js              # Tool 1
│   ├── dataConverter.js               # Tool 2
│   ├── schemaValidatorTool.js         # Tool 3
│   ├── documentClassfier.js           # Tool 4
│   ├── rulesEngine.js                 # Tool 5
│   ├── riskCalculator.js              # Tool 6
│   └── qualityChecker.js
├── orchestrator/
│   └── autonomousOrchestrator.js      # Main orchestrator
├── documents/                         # Knowledge base for RAG
└── output/
    └── claim_results.json             # Processing results
```

## Extending the System

### Adding a New Tool

1. Create tool file in `tools/`
2. Implement handler function
3. Register in `mcp/mcpServer.js`

```javascript
// In mcpServer.js
import myNewTool from "../tools/myNewTool.js";

this.mcp.registerTool("myNewTool", {
  description: "Description",
  inputSchema: { ... }
}, myNewTool);
```

### Adding a New Agent

1. Create agent file in `agents/`
2. Use other agents as template
3. Add to orchestrator in proper sequence

```javascript
// In orchestrator
const myAgentResult = await myNewAgent(inputData);
```

## Monitoring & Debugging

### Logs

All stages output detailed logs showing:
- Stage progress
- LLM prompts and responses
- Tool calls and results
- Final decisions and reasoning

### claim_results.json

Stores complete processing history including:
- All assessment scores
- Decisions made
- Data enrichments applied
- Final routing decision

## Performance Considerations

- **Parallel Tool Calls**: Tools can be called in parallel within an agent
- **Streaming**: RAG can be optimized with streaming for large documents
- **Caching**: LLM responses can be cached for common queries
- **Batching**: Multiple claims can be processed concurrently

## Security Considerations

1. **Input Validation**: All inputs validated before processing
2. **Schema Enforcement**: Strict schema validation throughout
3. **Logging**: No sensitive data logged to console
4. **Error Handling**: Graceful error handling without data loss
5. **Access Control**: Add authentication/authorization as needed

## Future Enhancements

- [ ] Vector database for RAG (replace mock implementation)
- [ ] Claim appeal and reconsideration flows
- [ ] Machine learning model integration
- [ ] Real-time fraud updates
- [ ] Multi-language support
- [ ] Webhook notifications
- [ ] Admin dashboard
- [ ] Analytics and reporting

## Support & Documentation

For detailed information about specific components, see:
- Agent implementation: Check individual agent files
- Tool specifications: Check individual tool files
- API contract: See server.js endpoint definitions
- MCP usage: See mcpServer.js registration patterns
