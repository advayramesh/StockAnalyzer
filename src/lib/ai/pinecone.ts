// src/lib/ai/pinecone.ts
import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClient: Pinecone | null = null;

export async function getPineconeClient() {
  try {
    if (!pineconeClient) {
      console.log("Initializing Pinecone client...");
      
      // Initialize the client
      pineconeClient = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY!
      });

      console.log("Pinecone client initialized, checking connection...");
      
      try {
        // List all indexes
        const indexes = await pineconeClient.listIndexes();
        console.log("Pinecone indexes:", indexes);

        // Check if our index exists
        const stocksIndex = indexes.indexes?.find(idx => idx.name === 'quant');
        
        if (stocksIndex) {
          console.log("Found stocks index:", {
            name: stocksIndex.name,
            dimension: stocksIndex.dimension,
            host: stocksIndex.host
          });
        } else {
          console.log("Available indexes:", indexes.indexes?.map(idx => idx.name));
          throw new Error("Stocks index not found - please check index name");
        }
      } catch (listError) {
        console.error("Error listing indexes:", listError);
        throw listError;
      }
    }

    return pineconeClient;
  } catch (error) {
    console.error("Pinecone initialization failed:", {
      error,
      message: (error as Error).message,
      stack: (error as Error).stack
    });
    throw error;
  }
}

// Optional: Add a helper function to get the index directly
export async function getStocksIndex() {
  const pinecone = await getPineconeClient();
  if (!pinecone) {
    throw new Error("Failed to initialize Pinecone client");
  }
  return pinecone.Index("quant");
}