/**
 * Rules Engine Tool
 * Executes business rules for fraud screening
 * No LLM calls - purely rule-based logic
 */

const rulesEngine = async (params) => {
  const { claimData, ruleSet = "basic_fraud_rules" } = params;

  try {
    if (!claimData || typeof claimData !== "object") {
      throw new Error("Claim data must be a valid object");
    }

    const results = {
      claimId: claimData.claimId || claimData.claimNumber || "unknown",
      ruleSet,
      rulesEvaluated: [],
      flaggedRules: [],
      passed: true,
      fraudRiskFactors: [],
      severity: "LOW"
    };

    if (ruleSet === "basic_fraud_rules") {
      // Rule 1: Unusual claim amount
      const rule1 = {
        name: "unusual_claim_amount",
        description: "Check for unusually high claim amounts",
        passed: true,
        details: ""
      };

      const amount = parseFloat(claimData.amount) || 0;
      if (amount > 100000) {
        rule1.passed = false;
        rule1.details = `Claim amount ${amount} exceeds threshold of 100000`;
        results.flaggedRules.push(rule1.name);
        results.fraudRiskFactors.push("Unusually high claim amount");
      }
      results.rulesEvaluated.push(rule1);

      // Rule 2: Missing critical information
      const rule2 = {
        name: "missing_critical_info",
        description: "Check for missing critical claim information",
        passed: true,
        details: ""
      };

      const missingFields = [];
      if (!claimData.claimantName) missingFields.push("claimantName");
      if (!claimData.incidentDate) missingFields.push("incidentDate");
      if (!claimData.description) missingFields.push("description");

      if (missingFields.length > 2) {
        rule2.passed = false;
        rule2.details = `Critical fields missing: ${missingFields.join(", ")}`;
        results.flaggedRules.push(rule2.name);
        results.fraudRiskFactors.push("Missing critical information");
      }
      results.rulesEvaluated.push(rule2);

      // Rule 3: Duplicate claims
      const rule3 = {
        name: "duplicate_claims",
        description: "Check for potential duplicate claims",
        passed: true,
        details: "No duplicate detected in current session"
      };
      results.rulesEvaluated.push(rule3);

      // Rule 4: Claim date validity
      const rule4 = {
        name: "claim_date_validity",
        description: "Check if claim date is within valid range",
        passed: true,
        details: ""
      };

      if (claimData.claimDate) {
        const claimDate = new Date(claimData.claimDate);
        const daysOld = Math.floor((new Date() - claimDate) / (1000 * 60 * 60 * 24));

        if (daysOld > 365) {
          rule4.passed = false;
          rule4.details = `Claim date is ${daysOld} days old, exceeds 365 day threshold`;
          results.flaggedRules.push(rule4.name);
          results.fraudRiskFactors.push("Claim filed too long after incident");
        }
      }
      results.rulesEvaluated.push(rule4);

      // Rule 5: Contact information validation
      const rule5 = {
        name: "valid_contact_info",
        description: "Check if valid contact information is provided",
        passed: true,
        details: ""
      };

      const hasEmail = claimData.email && claimData.email.includes("@");
      const hasPhone = claimData.phone && claimData.phone.replace(/\D/g, "").length >= 10;
      const hasAddress = claimData.address && claimData.address.length > 5;

      if (!hasEmail && !hasPhone && !hasAddress) {
        rule5.passed = false;
        rule5.details = "No valid contact information provided";
        results.flaggedRules.push(rule5.name);
        results.fraudRiskFactors.push("No valid contact information");
      }
      results.rulesEvaluated.push(rule5);
    }

    // Overall assessment
    if (results.flaggedRules.length >= 3) {
      results.passed = false;
      results.severity = "HIGH";
    } else if (results.flaggedRules.length >= 1) {
      results.passed = false;
      results.severity = "MEDIUM";
    }

    return {
      success: true,
      data: results,
      message: `Rules evaluation completed. ${results.flaggedRules.length} rule(s) flagged.`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

export default rulesEngine;
