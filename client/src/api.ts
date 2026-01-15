export function processClaim(text: any, claimFormData: any) {
  const res = fetch("http://localhost:3001/api/process-claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, claimFormData }),
  });
  return res; 
}