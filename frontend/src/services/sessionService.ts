import type { StudySession } from '../types';

export interface CreateSessionResponse {
  _id: string;
  userId: string;
  title: string;
  startTime: string;
  status: 'active' | 'paused' | 'completed';
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
}

class SessionService {
  private baseUrl = '/api/sessions';

  async startSession(): Promise<CreateSessionResponse> {
    const response = await fetch(`${this.baseUrl}/start`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start session');
    }

    return response.json();
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update session');
    }

    return response.json();
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to end session');
    }

    return response.json();
  }

  async getUserSessions(page: number = 1, limit: number = 10): Promise<{
    sessions: StudySession[];
    total: number;
    totalPages: number;
  }> {
    const response = await fetch(`${this.baseUrl}?page=${page}&limit=${limit}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch sessions');
    }

    return response.json();
  }

  async getSession(sessionId: string): Promise<StudySession> {
    const response = await fetch(`${this.baseUrl}/${sessionId}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch session');
    }

    return response.json();
  }
}

export const sessionService = new SessionService();