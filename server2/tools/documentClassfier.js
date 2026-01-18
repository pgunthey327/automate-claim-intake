/**
 * Document Classifier Tool
 * Classifies and categorizes claim form data
 * No LLM calls - purely classification logic based on patterns
 */

const documentClassifier = async (params) => {
  const { claimData, categories } = params;

  try {
    if (!claimData || typeof claimData !== "object") {
      throw new Error("Claim data must be a valid object");
    }

    const classification = {
      claimId: claimData.claimId || claimData.claimNumber || "unknown",
      classifications: {},
      confidence: 0.75,
      details: []
    };

    // Classify by claim type
    const claimType = (claimData.claimType || claimData.type || "").toLowerCase();
    if (claimType.includes("health") || claimType.includes("medical")) {
      classification.classifications.claimCategory = "HEALTH_INSURANCE";
      classification.details.push("Classified as health insurance claim");
    } else if (claimType.includes("auto") || claimType.includes("vehicle")) {
      classification.classifications.claimCategory = "AUTO_INSURANCE";
      classification.details.push("Classified as auto insurance claim");
    } else if (claimType.includes("property") || claimType.includes("home")) {
      classification.classifications.claimCategory = "PROPERTY_INSURANCE";
      classification.details.push("Classified as property insurance claim");
    } else if (claimType.includes("liability")) {
      classification.classifications.claimCategory = "LIABILITY_INSURANCE";
      classification.details.push("Classified as liability insurance claim");
    } else {
      classification.classifications.claimCategory = "OTHER";
      classification.details.push("Classified as other claim type");
    }

    // Classify by severity based on amount
    const amount = parseFloat(claimData.amount) || 0;
    if (amount === 0) {
      classification.classifications.severity = "LOW";
      classification.details.push("Amount indicates low severity claim");
    } else if (amount < 1000) {
      classification.classifications.severity = "LOW";
      classification.details.push("Amount indicates low severity claim");
    } else if (amount < 10000) {
      classification.classifications.severity = "MEDIUM";
      classification.details.push("Amount indicates medium severity claim");
    } else if (amount < 50000) {
      classification.classifications.severity = "HIGH";
      classification.details.push("Amount indicates high severity claim");
    } else {
      classification.classifications.severity = "CRITICAL";
      classification.details.push("Amount indicates critical severity claim");
    }

    // Classify urgency based on incident date
    if (claimData.incidentDate) {
      const incidentDate = new Date(claimData.incidentDate);
      const daysSinceIncident = Math.floor(
        (new Date() - incidentDate) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceIncident <= 7) {
        classification.classifications.urgency = "HIGH";
        classification.details.push("Recent incident - high urgency");
      } else if (daysSinceIncident <= 30) {
        classification.classifications.urgency = "MEDIUM";
        classification.details.push("Moderate time since incident");
      } else {
        classification.classifications.urgency = "LOW";
        classification.details.push("Significant time elapsed since incident");
      }
    }

    // Classify completeness
    const requiredFields = ["claimantName", "claimType", "amount", "description"];
    const providedFields = requiredFields.filter(field => claimData[field]);
    const completeness = Math.floor((providedFields.length / requiredFields.length) * 100);

    if (completeness === 100) {
      classification.classifications.completeness = "COMPLETE";
      classification.details.push("All required fields provided");
    } else if (completeness >= 75) {
      classification.classifications.completeness = "MOSTLY_COMPLETE";
      classification.details.push(`${completeness}% of required fields provided`);
    } else {
      classification.classifications.completeness = "INCOMPLETE";
      classification.details.push(`Only ${completeness}% of required fields provided`);
    }

    return {
      success: true,
      data: classification,
      message: "Claim data classified successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      classifications: null
    };
  }
};

export default documentClassifier;
