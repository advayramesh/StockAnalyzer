import { groq } from '@ai-sdk/groq';
import { Index, RecordMetadata } from '@pinecone-database/pinecone';
import { StockMetadata, RetrievedContext } from './types';
import { OpenAI } from 'openai';

export class EnhancedRAGModel {
  private similarity_threshold: number;
  private max_contexts: number;
  private _lastResults: RetrievedContext[] = [];

  constructor(
    similarity_threshold: number = 0.4, // Lowered threshold for better matches
    max_contexts: number = 5 // Reduced for smaller responses
  ) {
    this.similarity_threshold = similarity_threshold;
    this.max_contexts = max_contexts;
  }

  private async getEmbedding(text: string): Promise<number[]> {
    try {
      console.log("Getting embedding for text:", text.substring(0, 50) + "...");
      
      const response = await fetch(
        "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-mpnet-base-v2",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: text,
            options: { wait_for_model: true }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Embedding request failed: ${response.statusText}`);
      }

      const embedding = await response.json();
      
      console.log("Raw embedding response type:", typeof embedding);
      console.log("Is array:", Array.isArray(embedding));
      
      let vector: number[];
      if (Array.isArray(embedding) && embedding.length === 768) {
        vector = embedding;
      } else if (Array.isArray(embedding) && Array.isArray(embedding[0])) {
        vector = embedding[0];
      } else {
        throw new Error('Invalid embedding format');
      }

      console.log("Successfully created embedding vector with dimensions:", vector.length);
      return vector;

    } catch (error) {
      console.error("Error getting embedding:", error);
      // Return normalized random vector as fallback
      const randomVector = Array.from(
        { length: 768 }, 
        () => (Math.random() * 2 - 1) / Math.sqrt(768)
      );
      return randomVector;
    }
  }

  async retrieve_and_rank(
    query: string,
    pineconeIndex: Index<RecordMetadata>,
    filters: Record<string, any> = {}
  ): Promise<RetrievedContext[]> {
    try {
      const queryEmbedding = await this.getEmbedding(query);
      console.log("Got embedding, querying Pinecone...");

      const queryResponse = await pineconeIndex
        .namespace('stock-descriptions')
        .query({
          vector: queryEmbedding,
          topK: this.max_contexts,
          includeMetadata: true,
          filter: Object.keys(filters).length > 0 ? this._createPineconeFilters(filters) : undefined
        });

      const contexts = queryResponse.matches
        .filter((match): match is typeof match & { metadata: StockMetadata } => {
          return match.metadata !== undefined;
        })
        .map(match => ({
          content: match.metadata['Business Summary'] || '',
          similarity_score: match.score || 0,
          metadata: match.metadata as StockMetadata
        }))
        .filter(context => context.similarity_score >= this.similarity_threshold);

      // Store results for potential error handling
      this._lastResults = contexts;

      // Log matches
      console.log(`Processing ${contexts.length} matches:`);
      contexts.forEach((ctx, idx) => {
        console.log(`Match ${idx + 1}: ${ctx.metadata.Ticker} (${ctx.metadata.Name}) - Score: ${ctx.similarity_score}`);
      });

      return contexts;
    } catch (error) {
      console.error("Error in retrieve_and_rank:", { error });
      return [];
    }
  }

  private _createPineconeFilters(filters: Record<string, any>) {
    const pineconeFilters: Record<string, any> = {};
    
    if (filters.marketCap) {
      pineconeFilters['Market Cap'] = { $gte: filters.marketCap };
    }
    if (filters.sector) {
      pineconeFilters['Sector'] = { $eq: filters.sector };
    }
    return pineconeFilters;
  }

  generate_augmented_prompt(query: string, contexts: RetrievedContext[]): string {
    const context_texts = contexts
      .slice(0, this.max_contexts)
      .map(ctx => {
        const metrics = {
          'Ticker': ctx.metadata.Ticker,
          'Name': ctx.metadata.Name,
          'Industry': ctx.metadata.Industry,
          'Market Cap': `$${(ctx.metadata['Market Cap'] / 1e9).toFixed(2)}B`,
          'Revenue': ctx.metadata.Revenue ? `$${(ctx.metadata.Revenue / 1e9).toFixed(2)}B` : 'N/A'
        };

        return `
          Company: ${metrics.Name} (${metrics.Ticker})
          Industry: ${metrics.Industry}
          Market Cap: ${metrics['Market Cap']}
          Revenue: ${metrics.Revenue}
          
          Business Summary:
          ${ctx.content.substring(0, 300)}...
          ----------------------
        `;
      })
      .join('\n\n');

    return `
      Based on the query "${query}", here are the most relevant companies:

      ${context_texts}

      Please provide a detailed analysis of these companies, focusing on:
      1. How each company relates to the query
      2. Key business metrics and market position
      3. Competitive advantages
      4. Potential risks and opportunities

      Format the response in clear sections for each company.
    `;
  }

  getMatchingSummary(): string {
    if (!this._lastResults || this._lastResults.length === 0) {
      return "No matching companies found.";
    }

    return this._lastResults
      .map(result => 
        `${result.metadata.Name} (${result.metadata.Ticker})\n` +
        `Industry: ${result.metadata.Industry}\n` +
        `Market Cap: $${(result.metadata['Market Cap'] / 1e9).toFixed(2)}B\n`
      )
      .join('\n\n');
  }

  async process_query(
    query: string,
    pineconeIndex: Index<RecordMetadata>,
    model: string = 'mixtral-8x7b-32768',
    filters: Record<string, any> = {}
  ): Promise<string> {
    try {
      console.log("Processing query:", query);
      const ranked_contexts = await this.retrieve_and_rank(query, pineconeIndex, filters);
      
      if (ranked_contexts.length === 0) {
        return "I couldn't find any relevant companies matching your query. Could you try rephrasing or being more specific?";
      }

      const augmented_prompt = this.generate_augmented_prompt(query, ranked_contexts);
      return augmented_prompt;
    } catch (error) {
      console.error("Error in process_query:", error);
      return "Sorry, I encountered an error while processing your query. Please try again.";
    }
  }
}