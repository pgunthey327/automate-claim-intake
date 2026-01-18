// src/pdfUtils.js
import * as pdfParse from "pdf-parse";

export async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse.default(buffer);
    return data.text || "";
  } catch (err) {
    console.error("PDF parse error:", err);
    return "";
  }
}