/**
 * Data Converter Tool
 * Converts unstructured data to structured JSON format
 * No LLM calls - purely transformation logic
 */

const dataConverter = async (params) => {
  const { data, targetSchema = "claim_intake_schema" } = params;

  try {
    if (!data || typeof data !== "object") {
      throw new Error("Data must be a valid object");
    }

    let convertedData = {};

    if (targetSchema === "claim_intake_schema") {
      // Convert to standard claim intake schema
      convertedData = {
        claim: {
          claimId: data.claimNumber || data.claim_id || null,
          claimType: data.claimType || data.claim_type || "General",
          status: data.status || "PENDING_VALIDATION",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        claimant: {
          name: data.claimantName || data.name || null,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          policyNumber: data.policyNumber || data.policy_number || null
        },
        incident: {
          date: data.incidentDate || data.incident_date || null,
          location: data.incidentLocation || data.incident_location || null,
          description: data.description || data.details || null,
          amount: parseFloat(data.amount) || null
        },
        metadata: {
          sourceFormat: data.sourceFormat || "unknown",
          parsedBy: "documentParser",
          confidence: 0.8
        }
      };
    } else if (targetSchema === "enriched_claim_schema") {
      // Convert to enriched schema with additional fields
      convertedData = {
        ...data,
        enrichmentMetadata: {
          enrichedAt: new Date().toISOString(),
          enrichmentSource: "rag",
          missingFields: [],
          correctedFields: []
        }
      };
    } else if (targetSchema === "routing_schema") {
      // Convert to routing decision schema
      convertedData = {
        claimId: data.claimId || data.claim_id || null,
        routingDecision: data.routingDecision || "PENDING",
        requiresAdditionalInfo: data.requiresAdditionalInfo || false,
        flaggedForReview: data.flaggedForReview || false,
        riskScore: data.riskScore || 0,
        assignedQueue: data.assignedQueue || "DEFAULT",
        summary: data.summary || "",
        nextSteps: data.nextSteps || []
      };
    }

    return {
      success: true,
      data: convertedData,
      schema: targetSchema,
      message: `Data converted to ${targetSchema} successfully`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

export default dataConverter;
