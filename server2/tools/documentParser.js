/**
 * Document Parser Tool
 * Parses claim form documents and extracts structured data
 * No LLM calls - purely parsing logic
 */

const documentParser = async (params) => {
  const { document, documentType = "claim_form" } = params;

  try {
    if (!document) {
      throw new Error("Document content is required");
    }

    // Parse JSON if document is a string
    let parsedDoc = document;
    if (typeof document === "string") {
      try {
        parsedDoc = JSON.parse(document);
      } catch {
        // If not JSON, treat as plain text
        parsedDoc = { rawText: document };
      }
    }

    // Extract key fields from document
    const extractedData = {
      documentType,
      claimNumber: parsedDoc.claimNumber || null,
      claimantName: parsedDoc.claimantName || parsedDoc.name || null,
      claimDate: parsedDoc.claimDate || parsedDoc.date || null,
      claimType: parsedDoc.claimType || parsedDoc.type || null,
      amount: parsedDoc.amount || parsedDoc.claimAmount || null,
      description: parsedDoc.description || parsedDoc.details || null,
      incidentDate: parsedDoc.incidentDate || null,
      incidentLocation: parsedDoc.incidentLocation || parsedDoc.location || null,
      policyNumber: parsedDoc.policyNumber || null,
      contactInfo: parsedDoc.contactInfo || {
        email: parsedDoc.email || null,
        phone: parsedDoc.phone || null,
        address: parsedDoc.address || null
      },
      rawData: parsedDoc
    };

    return {
      success: true,
      data: extractedData,
      message: "Document parsed successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

export default documentParser;
