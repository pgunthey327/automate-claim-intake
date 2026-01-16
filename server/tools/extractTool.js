import { generateContent } from "../helper.js";
export default async function extractTool(input) {
  console.log("Extracting key data for claims processing ...")

  const prompt = `
    Extract user details from INPUT and respond in JSON format with the following fields:
    - claimant_name
    - claim_type
    - description
    - vehicle_type
    - date_of_birth
    - place_of_birth 
    - vehicle_plate

    INPUT: ${JSON.stringify(input)}
  `;

  const response = await generateContent(prompt, "extractAgent");
  console.log("Completed data extraction ...")
  return response;
}
