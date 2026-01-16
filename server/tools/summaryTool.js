import { generateContent } from "../helper.js";

export default async function summaryTool(input) {
  console.log("Generating claim summary ...")

  const prompt = `
    Analyze the claim details in INPUT and respond a summary in 4 or 5 sentences, in JSON format.:
    
    INPUT: ${JSON.stringify(input)}
  `;

  const response = await generateContent(prompt, "SummaryAgent");
  console.log("Summary generation completed ...")
  return response;
}
