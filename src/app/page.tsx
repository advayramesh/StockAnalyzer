'use client';

import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto p-4 bg-white">
      <div className="flex-grow overflow-auto space-y-4 pb-4">
        {/* Show all messages */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-4 rounded-lg ${
              message.role === 'user' 
                ? 'bg-blue-100 ml-12 text-black' 
                : message.role === 'assistant'
                ? 'bg-gray-100 mr-12 text-black'
                : ''
            }`}
          >
            {message.role === 'user' && (
              <div className="font-medium mb-2">You asked:</div>
            )}
            <div className="whitespace-pre-wrap font-sans">
              {message.content}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-2">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about stocks (e.g., 'top medical device companies')"
          className="flex-grow text-black bg-white border-gray-300"
        />
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}