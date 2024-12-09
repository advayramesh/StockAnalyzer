// src/app/api/chat/route.ts
import { getPineconeClient } from '@/lib/ai/pinecone';
import { EnhancedRAGModel } from '@/lib/EnhancedRAGModel';
import { OpenAI } from 'openai';

// src/app/api/chat/route.ts
export async function POST(req: Request) {
    try {
      const { messages } = await req.json();
      const lastMessage = messages[messages.length - 1];
  
      const pinecone = await getPineconeClient();
      const index = pinecone.Index("quant");
      
      const ragModel = new EnhancedRAGModel();
  
      const context = await ragModel.process_query(
        lastMessage.content,
        index,
        'mixtral-8x7b-32768'
      );
  
      const client = new OpenAI({
        apiKey: process.env.GROQ_API_KEY!,
        baseURL: 'https://api.groq.com/openai/v1'
      });
  
      const completion = await client.chat.completions.create({
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "system",
            content: "You are a stock market expert. Analyze the stock information and provide insights."
          },
          {
            role: "user",
            content: context
          }
        ],
        temperature: 0.7,
      });
  
      return new Response(
        JSON.stringify({
          content: completion.choices[0].message.content
        }), 
        { 
          headers: { 'Content-Type': 'application/json' }
        }
      );
  
    } catch (error) {
      console.error('Error in chat route:', error);
      return new Response(
        JSON.stringify({ error: 'Error processing request' }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }