// src/app/core/services/sse.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface SseEvent {
  event: 'model-start' | 'model-chunk' | 'model-end' | 'model-error' | 'all-complete';
  modelId?: string;
  modelName?: string;
  chunk?: string;
  latencyMs?: number;
  error?: string;
  messageId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SseService {
  private baseUrl = 'http://localhost:3000/api';

  connect(messageId: string): Observable<SseEvent> {
    return new Observable<SseEvent>((subscriber) => {
      const token = localStorage.getItem('omni_token');
      const controller = new AbortController();
      
      // We use fetch instead of EventSource so we can pass the Authorization header
      fetch(`${this.baseUrl}/messages/${messageId}/stream`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`SSE connection failed with status ${response.status}`);
        }
        
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('ReadableStream not supported on this browser.');
        }

        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          // Decode and append to buffer
          buffer += decoder.decode(value, { stream: true });
          
          // Split buffer by double newline (SSE separator) or single newline
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the incomplete line in the buffer

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const jsonStr = trimmed.slice(6).trim();
              if (jsonStr) {
                try {
                  const eventData = JSON.parse(jsonStr) as SseEvent;
                  subscriber.next(eventData);
                  
                  // If all-complete, complete the subscription and close the connection
                  if (eventData.event === 'all-complete') {
                    subscriber.complete();
                    controller.abort();
                    return;
                  }
                } catch (err) {
                  console.error('Failed to parse SSE line:', trimmed, err);
                }
              }
            }
          }
        }
        
        // Emitted when connection completes normally (all data read)
        subscriber.complete();
      })
      .catch((error) => {
        // If aborted by controller, do not emit error
        if (error.name !== 'AbortError') {
          subscriber.error(error);
        }
      });

      // Cleanup function on unsubscribe
      return () => {
        controller.abort();
      };
    });
  }
}
