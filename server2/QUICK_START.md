# Quick Start Guide

## 5-Minute Setup

### Prerequisites
- Node.js 18+
- Ollama running locally (or configure remote LLM)
- npm or yarn

### 1. Install Dependencies
```bash
cd server2
npm install
```

### 2. Start LLM Server (Ollama)

Terminal 1:
```bash
# If not already running
ollama serve
```

Terminal 2 (optional - pull model if not already available):
```bash
ollama pull qwen3:0.6b
```

### 3. Configure Environment

Create `server2/.env`:
```env
PORT=3001
LLM_BASE_URL=http://localhost:11434
LLM_MODEL=qwen3:0.6b
```

### 4. Start the Server

Terminal 3:
```bash
cd server2
npm start
```

Should see:
```
╔══════════════════════════════════════════════════════════════╗
║    Autonomous Claim Intake MCP Orchestrator Started           ║
║    Server running on port 3001                               ║
║    ✓ MCP Server initialized successfully                     ║
║    ✓ Registered tools: documentParser, dataConverter, ...    ║
╚══════════════════════════════════════════════════════════════╝
```

### 5. Test the System

#### Option A: Using curl

```bash
curl -X POST http://localhost:3001/api/process-claim \
  -H "Content-Type: application/json" \
  -d '{
    "claimFormData": {
      "claimNumber": "CLM-2024-001",
      "claimantName": "John Doe",
      "claimType": "health",
      "claimDate": "2024-01-15",
      "amount": 5000,
      "description": "Medical procedure",
      "incidentDate": "2024-01-10",
      "email": "john@example.com",
      "phone": "555-0123",
      "address": "123 Main St, City, State 12345"
    }
  }'
```

#### Option B: Using VS Code REST Client

Create `server2/test.http`:
```http
### Process Claim
POST http://localhost:3001/api/process-claim
Content-Type: application/json

{
  "claimFormData": {
    "claimNumber": "CLM-2024-001",
    "claimantName": "John Doe",
    "claimType": "health",
    "claimDate": "2024-01-15",
    "amount": 5000,
    "description": "Medical procedure",
    "incidentDate": "2024-01-10",
    "email": "john@example.com",
    "phone": "555-0123",
    "address": "123 Main St"
  }
}

### Get All Results
GET http://localhost:3001/api/claim-results

### Get Specific Claim
GET http://localhost:3001/api/claim-results/CLM-2024-001

### Health Check
GET http://localhost:3001/api/health
```

### 6. View Results

```bash
curl http://localhost:3001/api/claim-results
```

Or check file:
```bash
cat server2/output/claim_results.json
```

## Processing Flow

When you submit a claim:

1. **Server receives request** (202 Accepted)
2. **Orchestrator starts processing** in background

3. **Stage 1: EXTRACTION**
   - Parse claim documents
   - Convert to standard schema
   - LLM validates extraction quality

4. **Stage 2: VALIDATION**
   - Classify claim type/severity/urgency
   - Validate against schema
   - LLM performs intelligent validation

5. **Stage 3: DATA ENRICHMENT**
   - Identify missing information
   - Query knowledge base (RAG)
   - Enhance data quality
   - LLM synthesizes improvements

6. **Stage 4: FRAUD SCREENING**
   - Execute business rules
   - Calculate risk score
   - LLM performs fraud analysis

7. **Stage 5: CLAIM ROUTING**
   - Compile all assessments
   - LLM makes final decision
   - Assign to appropriate queue
   - Save results to claim_results.json

## Example Response

After processing completes, check results:

```bash
curl http://localhost:3001/api/claim-results
```

```json
{
  "success": true,
  "count": 1,
  "results": [
    {
      "claimId": "CLM-2024-001",
      "processedAt": "2024-01-19T10:30:00.000Z",
      "processingStage": "ROUTING_COMPLETE",
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
        "dataEnrichmentQuality": "15% improvement",
        "fraudRiskLevel": "LOW",
        "fraudProbability": 0.15
      },
      "routing": {
        "requiresAdditionalInfo": false,
        "flaggedForReview": false
      },
      "summary": "Claim approved for processing"
    }
  ]
}
```

## Understanding the System

### 5 Agents
| Agent | Input | Output |
|-------|-------|--------|
| **Extraction** | Raw claim | Structured data |
| **Validation** | Extracted data | Validation result |
| **Enrichment** | Validated data | Enhanced data |
| **Fraud Screening** | Enriched data | Fraud assessment |
| **Routing** | All assessments | Final decision |

### 7 Tools
| Tool | Purpose |
|------|---------|
| documentParser | Parse documents |
| dataConverter | Convert data formats |
| schemaValidator | Validate schemas |
| documentClassifier | Classify claims |
| rulesEngine | Execute business rules |
| riskCalculator | Calculate risk scores |
| rag | Query knowledge base |

### Key Principles
- ✓ **Only agents call LLM** (via helper.js)
- ✓ **Tools never call LLM** (pure functions)
- ✓ **MCP manages tools** (centralized registry)
- ✓ **Agents make decisions** (with LLM guidance)
- ✓ **Sequential processing** (stage by stage)

## Troubleshooting

### Error: "Cannot connect to LLM"
```
Error: connect ECONNREFUSED 127.0.0.1:11434
```
**Solution:** Make sure Ollama is running
```bash
ollama serve
```

### Error: "Model not found"
```
Error: model not found
```
**Solution:** Pull the model
```bash
ollama pull qwen3:0.6b
```

### Error: "MCP Server not initialized"
**Solution:** Restart server and check mcp/mcpServer.js imports

### Slow Processing
- LLM inference is CPU/GPU bound
- First request is slowest (model loading)
- Check Ollama logs for performance

### No Results
- Results are saved asynchronously
- Wait a few seconds then try GET /api/claim-results
- Check server logs for errors
- Verify output/ directory exists

## Next Steps

1. **Explore the code:**
   - Read [README_ARCHITECTURE.md](README_ARCHITECTURE.md)
   - Read [AGENT_LLM_TOOL_GUIDE.md](AGENT_LLM_TOOL_GUIDE.md)

2. **Customize agents:**
   - Modify LLM prompts in agent files
   - Add new decision criteria
   - Customize tool parameters

3. **Extend tools:**
   - Add new tools in tools/ directory
   - Register in mcp/mcpServer.js
   - Use in agents

4. **Add more rules:**
   - Modify rulesEngine.js for more business rules
   - Adjust risk factors in riskCalculator.js
   - Update classification logic in documentClassifier.js

5. **Integrate RAG:**
   - Replace mock RAG with real vector database
   - Add actual PDF documents in documents/
   - Use similarity search instead of keyword matching

## Development Mode

```bash
npm run dev
```

Uses nodemon for auto-restart on file changes.

## Production Deployment

```bash
npm install --production
npm start
```

Remember to set environment variables:
```bash
export PORT=3001
export LLM_BASE_URL=https://your-llm-server.com
export LLM_MODEL=your-model-name
```

## API Reference

### POST /api/process-claim
Submit claim for processing

**Request:**
```json
{
  "claimFormData": { /* claim object */ }
}
```

**Response:** 202 Accepted
```json
{
  "message": "Claim processing started",
  "status": "processing"
}
```

---

### GET /api/claim-results
Get all processed claims

**Response:** 200 OK
```json
{
  "success": true,
  "count": 1,
  "results": [ /* claims */ ]
}
```

---

### GET /api/claim-results/:claimId
Get specific claim result

**Response:** 200 OK
```json
{
  "success": true,
  "result": { /* claim */ }
}
```

---

### GET /api/health
Health check

**Response:** 200 OK
```json
{
  "status": "healthy",
  "service": "...",
  "tools": { "registered": 7, "list": [...] }
}
```

## File Structure

```
server2/
├── server.js                    ← Main Express server
├── README_ARCHITECTURE.md       ← System design
├── AGENT_LLM_TOOL_GUIDE.md     ← Implementation guide
├── QUICK_START.md              ← This file
├── package.json
├── .env                        ← Configuration
│
├── mcp/
│   └── mcpServer.js            ← MCP & tool registration
│
├── agents/
│   ├── extractionAgent.js
│   ├── validationAgent.js
│   ├── dataEnrichmentAgent.js
│   ├── fraudScreeningAgent.js
│   └── routingAgent.js
│
├── tools/
│   ├── documentParser.js
│   ├── dataConverter.js
│   ├── schemaValidatorTool.js
│   ├── documentClassfier.js
│   ├── rulesEngine.js
│   └── riskCalculator.js
│
├── orchestrator/
│   └── autonomousOrchestrator.js  ← Main orchestrator
│
├── helper/
│   └── helper.js                ← LLM interface
│
├── documents/                   ← Knowledge base
└── output/
    └── claim_results.json      ← Results storage
```

## Support

For questions or issues:
1. Check console logs for detailed error messages
2. Review README_ARCHITECTURE.md for system overview
3. Check AGENT_LLM_TOOL_GUIDE.md for implementation details
4. Verify LLM is running and accessible
5. Check environment variables in .env

Happy claim processing! 🎉
