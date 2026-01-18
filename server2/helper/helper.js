import axios from "axios";

export const generateContent = async (prompt, caller) => {
    console.log("Caller: " + caller);
    const response = await axios.post(`${process.env.baseUrl}/api/chat`, {
        "model": process.env.modelName,
        "messages": [{
            "role": "user",
            "content": prompt
        }],
        "stream": false,
        "format": "json"
    });
    console.log("Response:", response.data.message.content);
    return JSON.parse(response.data.message.content);
}
