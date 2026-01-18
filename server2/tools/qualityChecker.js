/**
 * Quality Checker Tool
 * Validates the overall quality and completeness of claim data
 * Checks for consistency, data integrity, and business requirements
 */

const qualityChecker = async (params) => {
  const { claimData, qualityThresholds = {} } = params;

  if (!claimData) {
    return {
      qualityScore: 0,
      isValid: false,
      issues: ["No claim data provided"],
      recommendations: []
    };
  }

  const issues = [];
  const recommendations = [];
  let completenessScore = 0;
  let consistencyScore = 0;
  let integrityScore = 0;

  // Check completeness
  const requiredFields = ["claimId", "claimType", "incidentDate", "description"];
  const providedFields = Object.keys(claimData).length;
  const completionRate = requiredFields.filter(f => claimData[f]).length / requiredFields.length;
  completenessScore = completionRate * 100;

  if (completenessScore < 100) {
    const missingFields = requiredFields.filter(f => !claimData[f]);
    issues.push(`Missing required fields: ${missingFields.join(", ")}`);
    recommendations.push("Ensure all required claim fields are populated");
  }

  // Check consistency
  if (claimData.incidentDate && claimData.reportDate) {
    const incidentDate = new Date(claimData.incidentDate);
    const reportDate = new Date(claimData.reportDate);
    if (incidentDate > reportDate) {
      issues.push("Incident date cannot be after report date");
      recommendations.push("Verify incident date and report date are in correct order");
    } else {
      consistencyScore = 100;
    }
  } else {
    consistencyScore = 50;
    recommendations.push("Provide both incident date and report date for consistency checks");
  }

  // Check data integrity
  if (claimData.claimAmount !== undefined) {
    if (typeof claimData.claimAmount === "string" && claimData.claimAmount > 0) {
      integrityScore += 50;
    } else {
      issues.push("claim amount must be a positive number");
      recommendations.push("Correct the claim amount value");
    }
  }

  if (claimData.description && claimData.description.length > 10) {
    integrityScore += 50;
  } else {
    issues.push("Claim description is too short or missing");
    recommendations.push("Provide a detailed description of at least 10 characters");
  }

  // Calculate overall quality score
  const weights = {
    completeness: 0.4,
    consistency: 0.3,
    integrity: 0.3
  };

  const overallQualityScore = 
    (completenessScore * weights.completeness) +
    (consistencyScore * weights.consistency) +
    (integrityScore * weights.integrity);

  const threshold = qualityThresholds.minimum || 70;
  const isValid = overallQualityScore >= threshold;

  return {
    qualityScore: Math.round(overallQualityScore),
    completenessScore: Math.round(completenessScore),
    consistencyScore: Math.round(consistencyScore),
    integrityScore: Math.round(integrityScore),
    isValid,
    issues,
    recommendations,
    fieldCount: providedFields,
    requiredFieldsCount: requiredFields.length
  };
};

export default qualityChecker;
