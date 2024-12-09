// lib/ai/streaming.ts
export class StreamingTextResponse extends Response {
    constructor(stream: ReadableStream) {
      super(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      });
    }
  }