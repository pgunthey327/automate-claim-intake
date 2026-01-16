export default async function validateTool(input) {
  console.log("Validating extracted claim data ...")
  const claim = JSON.parse(JSON.stringify(input));

  const missing = [];
  if (!claim.claimant_name) missing.push("claimant_name");
  if (!claim.claim_type) missing.push("claim_type");
  if (!claim.description) missing.push("description");
  if (!claim.vehicle_type) missing.push("vehicle_type");
  if (!claim.date_of_birth) missing.push("date_of_birth");
  if (!claim.place_of_birth) missing.push("place_of_birth");
  if (!claim.vehicle_plate) missing.push("vehicle_plate");

  console.log("Validation completed ...")
  return {
    valid: missing.length === 0,
    missing
  };
}
