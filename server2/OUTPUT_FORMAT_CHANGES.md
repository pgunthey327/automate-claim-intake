# Output Format Changes - Summary

## Changes Made

The routing agent output format has been modified to store results in a simplified, flat structure with all detailed information consolidated into a `summary` field.

### Old Format (Complex Nested Structure)
```json
{
  "claimId": "CLM-001",
  "processedAt": "2026-01-18T...",
  "processingStage": "ROUTING_COMPLETE",
  "claimStatus": "APPROVED",
  "decision": { ... },
  "assessment": { ... },
  "routing": { ... },
  "originalClaimData": { ... },
  "enrichedData": { ... }
}
```

### New Format (Simplified with Summary Field)
```json
{
  "extractionAgent": "2026-01-16T04:39:48.695Z",
  "validationAgent": "2026-01-16T04:40:14.607Z",
  "fraudScreeningAgent": "2026-01-16T04:41:57.021Z",
  "dataEnrichmentAgent": "2026-01-16T04:40:51.807Z",
  "routingAGent": "2026-01-15T22:06:49.560Z",
  "claimType": "Property Damage",
  "incidentDate": "2026-01-13",
  "incidentLocation": "Pune",
  "description": "My House is damaged.",
  "damageAmount": "3000",
  "agreeTerms": true,
  "name": "John Doe",
  "id": "2",
  "claimId": "CLM002",
  "summary": "All assessment details, fraud indicators, validation scores, routing decisions, etc."
}
```

## Files Modified

### 1. orchestrator/autonomousOrchestrator.js
**Changes:**
- Added `agentTimestamps` object to track when each agent starts
- Capture timestamp at the start of each agent execution
- Pass `agentTimestamps` and `originalClaimData` to routing agent
- Timestamps for: extractionAgent, validationAgent, dataEnrichmentAgent, fraudScreeningAgent, routingAGent

**Key Code:**
```javascript
orchestrationLog.agentTimestamps = {};

// Before each agent:
const extractionStartTime = new Date().toISOString();
const extractionResult = await extractionAgent(rawClaimData);
orchestrationLog.agentTimestamps.extractionAgent = extractionStartTime;

// To routing agent:
const routingResult = await claimRoutingAgent(
  enrichedData,
  validationResult.result,
  enrichmentResult.result,
  fraudScreeningResult.result,
  orchestrationLog.agentTimestamps,  // <-- timestamps passed
  rawClaimData                        // <-- original data passed
);
```

### 2. agents/routingAgent.js
**Changes:**
- Added `buildSummary()` helper function
- Modified function signature to accept `agentTimestamps` and `originalClaimData`
- Changed `claimResult` structure to simplified format
- All timestamps extracted from `agentTimestamps`
- All claim data extracted from `originalClaimData`
- All assessment details moved to `summary` field via `buildSummary()`

**Key Code:**
```javascript
export const claimRoutingAgent = async (
  claimData,
  validationResults,
  enrichmentResults,
  fraudScreeningResults,
  agentTimestamps = {},      // <-- new parameter
  originalClaimData = {}     // <-- new parameter
) => {
  // ...
  const claimResult = {
    extractionAgent: agentTimestamps.extractionAgent || new Date().toISOString(),
    validationAgent: agentTimestamps.validationAgent || new Date().toISOString(),
    fraudScreeningAgent: agentTimestamps.fraudScreeningAgent || new Date().toISOString(),
    dataEnrichmentAgent: agentTimestamps.dataEnrichmentAgent || new Date().toISOString(),
    routingAGent: agentTimestamps.routingAGent || new Date().toISOString(),
    
    claimType: originalClaimData.claimType || claimData.claimType || "",
    incidentDate: originalClaimData.incidentDate || claimData.incidentDate || "",
    incidentLocation: originalClaimData.incidentLocation || claimData.incidentLocation || "",
    description: originalClaimData.description || claimData.description || "",
    damageAmount: originalClaimData.damageAmount || originalClaimData.amount || claimData.amount || "",
    agreeTerms: originalClaimData.agreeTerms || false,
    name: originalClaimData.name || originalClaimData.claimantName || claimData.claimantName || "",
    id: originalClaimData.id || "",
    claimId: assessmentSummary.claimId,
    
    summary: buildSummary(routingDecision, validationResults, enrichmentResults, fraudScreeningResults, assessmentSummary)
  };
};
```

## Summary Field Contents

The `summary` field now contains:
- Original routing decision summary
- Reasoning for decision
- Validation status and score
- Validation errors (if any)
- Fraud risk level and probability
- Fraud indicators (if detected)
- Fields added during enrichment
- Data quality improvements
- Final routing decision
- Assigned queue
- Processing priority
- Estimated processing time
- Additional information requirements
- Flags and flag reasons

**Example:**
```
"Based on the provided information... | Reasoning: Claim meets all requirements | Validation: PASSED (Score: 100/100) | Fraud Risk: LOW (Probability: 15.0%) | Final Decision: APPROVE | Assigned Queue: standard_processing | Processing Priority: standard | Estimated Processing Time: 5-7 days"
```

## Benefits

1. **Simpler Structure**: Flat JSON structure, easier to work with
2. **Complete Information**: All data preserved in summary field
3. **Consistent Format**: Same format for all claims
4. **Better Storage**: Takes less space while retaining full information
5. **Clear Timestamps**: Agent execution timestamps tracked and included

## Testing

To test the new format:

```bash
cd server2
npm start

# Submit a claim
curl -X POST http://localhost:3001/api/process-claim \
  -H "Content-Type: application/json" \
  -d '{
    "claimFormData": {
      "claimType": "Auto Accident",
      "incidentDate": "2026-01-10",
      "incidentLocation": "Pune",
      "description": "Car damaged in accident",
      "damageAmount": "5000",
      "name": "John Doe",
      "id": "1"
    }
  }'

# View results
curl http://localhost:3001/api/claim-results | jq
```

The output should now follow the simplified format with agent timestamps and a comprehensive summary field.
