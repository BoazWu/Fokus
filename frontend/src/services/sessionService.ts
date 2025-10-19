import type { StudySession } from '../types';

export interface CreateSessionResponse {
  _id: string;
  userId: string;
  title: string;
  startTime: string;
  status: 'active';
  duration: number;
  pausedDuration: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSessionRequest {
  status?: 'active' | 'paused';
  pausedDuration?: number;
}

export interface EndSessionRequest {
  title?: string;
  description?: string;
  rating?: number;
  focusedDuration?: number; // Duration shown on timer (focused time)
  pausedDuration?: number; // Total time paused
}

class SessionService {
  private baseUrl = '/api/sessions';

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

  async startSession(): Promise<CreateSessionResponse> {
    const response = await fetch(`${this.baseUrl}/start`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return this.handleResponse(response);
  }

  async updateSession(sessionId: string, updates: UpdateSessionRequest): Promise<StudySession> {
    const response = await fetch(`${this.baseUrl}/${sessionId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    return this.handleResponse(response);
  }

  async endSession(sessionId: string, data: EndSessionRequest): Promise<StudySession> {
    const response = await fetch(`${this.baseUrl}/${sessionId}/end`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async getUserSessions(page: number = 1, limit: number = 10): Promise<{
    sessions: StudySession[];
    total: number;
    totalPages: number;
  }> {
    const response = await fetch(`${this.baseUrl}?page=${page}&limit=${limit}`, {
      credentials: 'include',
    });

    return this.handleResponse(response);
  }

  async getSession(sessionId: string): Promise<StudySession> {
    const response = await fetch(`${this.baseUrl}/${sessionId}`, {
      credentials: 'include',
    });

    return this.handleResponse(response);
  }

  async clearActiveSession(): Promise<{ cleared: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/clear-active`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return this.handleResponse(response);
  }

  async discardSession(sessionId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/${sessionId}/discard`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return this.handleResponse(response);
  }

  async cleanupActiveSessions(): Promise<{ deletedCount: number }> {
    const response = await fetch(`${this.baseUrl}/cleanup/active-sessions`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return this.handleResponse(response);
  }
}

export const sessionService = new SessionService();