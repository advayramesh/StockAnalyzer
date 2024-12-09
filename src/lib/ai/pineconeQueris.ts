// src/lib/ai/pineconeQueries.ts
import { getPineconeClient } from '@/lib/ai/pinecone';

export async function queryPineconeIndex(query: string) {
  try {
    const pinecone = await getPineconeClient();
    const index = pinecone.Index('stocks'); // Replace with your own index name
    
    // Perform a vector search/query. Assuming the query is a vector string.
    const results = await index.query({
      vector: query.split(',').map(Number), // Convert string to number array (vector)
      topK: 5,      // Number of results you want to retrieve
      includeValues: true, // Optional, include values for the results
      includeMetadata: true, // Optional, include metadata for the results
    });
    
    return results; // Process and return the results as required
  } catch (error) {
    console.error('Error querying Pinecone:', error);
    throw error;
  }
}
