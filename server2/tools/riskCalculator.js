/**
 * Risk Calculator Tool
 * Calculates risk score based on claim characteristics
 * No LLM calls - purely calculation logic
 */

const riskCalculator = async (params) => {
  const { claimData, factors } = params;

  try {
    if (!claimData || typeof claimData !== "object") {
      throw new Error("Claim data must be a valid object");
    }

    const riskAssessment = {
      claimId: claimData.claimId || claimData.claimNumber || "unknown",
      riskScores: {},
      overallRiskScore: 0,
      riskFactors: [],
      riskLevel: "LOW",
      details: []
    };

    let totalScore = 0;
    let factorCount = 0;

    // Risk factor 1: Claim Amount
    const amount = parseFloat(claimData.amount) || 0;
    let amountScore = 0;
    if (amount > 100000) {
      amountScore = 85;
      riskAssessment.details.push("Very high claim amount detected");
    } else if (amount > 50000) {
      amountScore = 65;
      riskAssessment.details.push("High claim amount detected");
    } else if (amount > 10000) {
      amountScore = 45;
      riskAssessment.details.push("Moderate claim amount");
    } else if (amount > 1000) {
      amountScore = 25;
      riskAssessment.details.push("Low-moderate claim amount");
    } else {
      amountScore = 10;
      riskAssessment.details.push("Low claim amount");
    }
    riskAssessment.riskScores.claimAmount = amountScore;
    totalScore += amountScore;
    factorCount++;

    // Risk factor 2: Claim age
    let ageScore = 0;
    if (claimData.claimDate) {
      const claimDate = new Date(claimData.claimDate);
      const daysOld = Math.floor((new Date() - claimDate) / (1000 * 60 * 60 * 24));

      if (daysOld > 365) {
        ageScore = 70;
        riskAssessment.details.push("Claim filed too long after incident");
      } else if (daysOld > 180) {
        ageScore = 50;
        riskAssessment.details.push("Claim filed considerable time after incident");
      } else if (daysOld > 30) {
        ageScore = 30;
        riskAssessment.details.push("Claim filed some time after incident");
      } else {
        ageScore = 15;
        riskAssessment.details.push("Recent claim filing");
      }
      riskAssessment.riskScores.claimAge = ageScore;
      totalScore += ageScore;
      factorCount++;
    }

    // Risk factor 3: Data completeness
    const requiredFields = ["claimantName", "claimType", "incidentDate", "description", "amount"];
    const missingCount = requiredFields.filter(f => !claimData[f]).length;
    let completenessScore = missingCount * 15; // Each missing field adds 15 points
    completenessScore = Math.min(completenessScore, 75); // Cap at 75

    if (completenessScore > 0) {
      riskAssessment.details.push(`${missingCount} critical field(s) missing`);
    }
    riskAssessment.riskScores.dataCompleteness = completenessScore;
    totalScore += completenessScore;
    factorCount++;

    // Risk factor 4: Contact information validity
    let contactScore = 0;
    const hasValidEmail = claimData.email && claimData.email.includes("@");
    const hasValidPhone = claimData.phone && claimData.phone.replace(/\D/g, "").length >= 10;
    const hasAddress = claimData.address && claimData.address.length > 5;

    const validContacts = [hasValidEmail, hasValidPhone, hasAddress].filter(x => x).length;
    contactScore = (3 - validContacts) * 20; // 20 points per missing contact method

    if (validContacts === 0) {
      riskAssessment.details.push("No valid contact information provided");
    }
    riskAssessment.riskScores.contactValidation = contactScore;
    totalScore += contactScore;
    factorCount++;

    // Risk factor 5: Claim type risk
    let typeScore = 0;
    const claimType = (claimData.claimType || "").toLowerCase();
    if (claimType.includes("fraud") || claimType.includes("suspicious")) {
      typeScore = 90;
      riskAssessment.details.push("Claim type flagged as potentially risky");
    } else if (claimType.includes("property") || claimType.includes("auto")) {
      typeScore = 35;
      riskAssessment.details.push("Claim type has moderate risk profile");
    } else if (claimType.includes("health") || claimType.includes("medical")) {
      typeScore = 20;
      riskAssessment.details.push("Claim type has low risk profile");
    } else {
      typeScore = 30;
    }
    riskAssessment.riskScores.claimType = typeScore;
    totalScore += typeScore;
    factorCount++;

    // Calculate overall score (average)
    riskAssessment.overallRiskScore = Math.round(totalScore / factorCount);

    // Determine risk level
    if (riskAssessment.overallRiskScore >= 70) {
      riskAssessment.riskLevel = "CRITICAL";
      riskAssessment.riskFactors.push("High risk assessment - requires review");
    } else if (riskAssessment.overallRiskScore >= 50) {
      riskAssessment.riskLevel = "HIGH";
      riskAssessment.riskFactors.push("Elevated risk - recommend review");
    } else if (riskAssessment.overallRiskScore >= 30) {
      riskAssessment.riskLevel = "MEDIUM";
      riskAssessment.riskFactors.push("Moderate risk - standard processing");
    } else {
      riskAssessment.riskLevel = "LOW";
      riskAssessment.riskFactors.push("Low risk - expedited processing eligible");
    }

    return {
      success: true,
      data: riskAssessment,
      message: "Risk assessment completed successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

export default riskCalculator;
