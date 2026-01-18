/**
 * Schema Validator Tool
 * Validates data against a specific schema
 * No LLM calls - purely validation logic
 */

const schemaValidatorTool = async (params) => {
  const { data, schema = "claim_intake_schema" } = params;

  try {
    if (!data || typeof data !== "object") {
      throw new Error("Data must be a valid object");
    }

    const validationResults = {
      isValid: true,
      schema,
      errors: [],
      warnings: [],
      missingFields: [],
      invalidFields: []
    };

    if (schema === "claim_intake_schema") {
      // Validate claim intake schema
      const requiredFields = [
        "claimantName",
        "claimType",
        "claimDate",
        "amount",
        "description"
      ];

      for (const field of requiredFields) {
        if (!data[field]) {
          validationResults.missingFields.push(field);
          validationResults.errors.push(`Missing required field: ${field}`);
          validationResults.isValid = false;
        }
      }

      // Validate field types
      if (data.amount && isNaN(parseFloat(data.amount))) {
        validationResults.invalidFields.push("amount");
        validationResults.errors.push("Amount must be a number");
        validationResults.isValid = false;
      }

      if (data.claimDate && isNaN(Date.parse(data.claimDate))) {
        validationResults.warnings.push("claimDate is not a valid date format");
      }

      // Validate length constraints
      if (data.description && data.description.length < 10) {
        validationResults.warnings.push("Description is too short (minimum 10 characters)");
      }

    } else if (schema === "routing_schema") {
      // Validate routing decision schema
      const validStatuses = ["APPROVED", "DENIED", "PENDING_INFO", "PENDING_REVIEW", "FRAUD_SUSPECTED"];
      
      if (!data.routingDecision || !validStatuses.includes(data.routingDecision)) {
        validationResults.errors.push(
          `Invalid routing decision. Must be one of: ${validStatuses.join(", ")}`
        );
        validationResults.isValid = false;
      }

      if (typeof data.riskScore !== "number" || data.riskScore < 0 || data.riskScore > 100) {
        validationResults.errors.push("Risk score must be a number between 0 and 100");
        validationResults.isValid = false;
      }
    }

    return {
      success: true,
      ...validationResults
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      isValid: false,
      errors: [error.message]
    };
  }
};

export default schemaValidatorTool;
