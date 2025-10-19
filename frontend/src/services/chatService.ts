export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  timestamp: Date;
}

class ChatService {
  private baseUrl = '/api/chat';

  private async handleResponse(response: Response) {
    if (response.status === 401) {
      // Session expired - redirect to login
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }
    
    return response.json();
  }

  async sendMessage(message: string, conversationHistory?: ChatMessage[]): Promise<ChatResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversationHistory,
      } as ChatRequest),
    });

    return this.handleResponse(response);
  }
}

export const chatService = new ChatService();