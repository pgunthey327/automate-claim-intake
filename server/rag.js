// src/rag.js
import { loadDocuments, splitIntoChunks } from "./loader.js";

export let memoryDocs = [];

export async function initializeRAG() {
  console.log("Initializing RAG...");
  const docs = await loadDocuments();
  memoryDocs = [];

  for (const doc of docs) {
    const chunks = splitIntoChunks(doc.text, 500);
    chunks.forEach((chunk, i) => {
      memoryDocs.push({ id: `${doc.id}-${i}`, text: chunk });
    });
  }

  console.log(`RAG initialized with chunks: ${memoryDocs.length}`);
}

// Simple keyword-based similarity
function rankBySimilarity(question) {
  const qWords = question.toLowerCase().split(/\s+/);
  return memoryDocs
    .map(d => {
      const common = d.text.toLowerCase().split(/\s+/).filter(w => qWords.includes(w));
      return { ...d, score: common.length };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export async function queryRAG(question) {
  if (!memoryDocs.length) return "";
  const top = rankBySimilarity(question);
  return top.map(d => d.text).join("\n");
}