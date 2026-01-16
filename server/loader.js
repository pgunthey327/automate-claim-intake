// src/loader.js
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse-fixed";

export async function loadDocuments(docDir = "./documents") {
  const files = fs.readdirSync(docDir).filter(f => f.endsWith(".pdf") || f.endsWith(".txt"));
  const docs = [];

  for (const file of files) {
    const filePath = path.join(docDir, file);

    try {
      let text = "";

      if (file.endsWith(".pdf")) {
        const data = await pdfParse(fs.readFileSync(filePath));
        text = data.text || "";
      } else {
        text = fs.readFileSync(filePath, "utf-8");
      }

      if (text.trim()) {
        docs.push({ id: file, text });
      }

    } catch (err) {
      console.error("PDF read error:", filePath, err);
    }
  }

  return docs;
}

// Split text into chunks
export function splitIntoChunks(text, size = 500) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += size) {
    chunks.push(words.slice(i, i + size).join(" "));
  }
  return chunks;
}