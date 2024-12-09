// src/lib/context.ts
import { getPineconeClient } from "./ai/groq"
import { getQueryEmbedding } from "./embeddings"
import { StockMetadata } from "./types"

export async function getStockContext(query: string) {
  const embedding = await getQueryEmbedding(query)
  const pinecone = await getPineconeClient()
  const index = pinecone.Index("stocks")
  

  const results = await index.query({
    vector: embedding,
    topK: 5,
    includeMetadata: true
  })

  return results.matches
    .filter((match): match is typeof match & { metadata: StockMetadata } => {
      return match.metadata !== undefined
    })
    .map(match => `
      Stock: ${match.metadata['Ticker'] || 'N/A'} - ${match.metadata['Name'] || 'N/A'}
      Sector: ${match.metadata['Sector'] || 'N/A'}
      Market Cap: $${(Number(match.metadata['Market Cap']) / 1e9).toFixed(2)}B
      Description: ${match.metadata['Business Summary'] || 'N/A'}
      Score: ${match.score?.toFixed(3) || 'N/A'}
      ---
    `)
    .join("\n")
}