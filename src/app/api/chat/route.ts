// src/app/api/chat/route.ts
import { OpenAI } from 'openai';
import { getPineconeClient } from '@/lib/ai/pinecone';
import { EnhancedRAGModel } from '@/lib/EnhancedRAGModel';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    const pinecone = await getPineconeClient();
    const index = pinecone.Index("quant");
    
    const ragModel = new EnhancedRAGModel();

    // Get context from Pinecone
    const context = await ragModel.process_query(
      lastMessage.content,
      index,
      'mixtral-8x7b-32768'
    );

    // Use Groq to get response
    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY!,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    // Get LLM response
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

    // Get the response text
    const responseText = completion.choices[0].message.content;
    console.log("LLM Response:", responseText);  // Debug log

    // Create stream in AI library format
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(new TextEncoder().encode(responseText ?? ''));
        controller.close();
      },
    });

    return new Response(stream);

  } catch (error) {
    console.error('Error in chat route:', error);
    return new Response('Sorry, I encountered an error. Please try again.', { 
      status: 500 
    });
  }
}