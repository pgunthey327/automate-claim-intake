import { generateContent } from "../helper.js";

export default async function fraudCheckTool(input) {
  console.log("Checking for fraud possibility ...")
 
   const prompt = `
      Analyise user details in INPUT and respond a summary explaining if fraud is possible or not for claim process, in JSON format.

      INPUT: ${JSON.stringify(input)}
   `;
 
   const response = await generateContent(prompt, "fraudCheckAgent");
   console.log("Fraud check completed ...")
   return response;
}
