import { Pinecone } from "@pinecone-database/pinecone";
import axios from "axios";

// Initialize Pinecone Client (as you had it)
let pineconeClient: Pinecone | null = null;

export async function getPineconeClient() {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pineconeClient;
}

// LLM Request Handling (Using OpenAI API as an example)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;  // Store your API key securely

export async function getLLMResponse(prompt: string) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",  // OpenAI endpoint for chat completions
      {
        model: "gpt-3.5-turbo",  // You can change this to a different model like gpt-4
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content; // Extracting the content of the LLM response
  } catch (error) {
    console.error("Error with LLM request:", error);
    throw new Error("Failed to get LLM response");
  }
}

// Example: Use both Pinecone and LLM together
export async function processQuery(query: string) {
  try {
    // Step 1: Query Pinecone (you can adjust the query logic here)
    const pinecone = await getPineconeClient();
    const index = pinecone.Index('stocks');  // Replace with your index name
    const pineconeResponse = await index.query({
      vector: query.split(',').map(Number),  // Convert string to number array if needed
      topK: 3,
    });

    // Step 2: Use the Pinecone response with LLM
    const pineconeData = pineconeResponse.matches.map((match) => match.id).join(", ");
    const llmResponse = await getLLMResponse(`Given the Pinecone results: ${pineconeData}, provide a relevant answer to: ${query}`);

    return llmResponse;  // Return the LLM response
  } catch (error) {
    console.error("Error processing query:", error);
    throw new Error("Failed to process query");
  }
}
