// User types
export interface User {
  _id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
}

// Study Session types
export interface StudySession {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  duration: number; // in milliseconds
  status: 'active' | 'paused' | 'completed';
  pausedDuration: number; // total time paused
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

// Session form types
export interface SessionFormData {
  title?: string;
  description?: string;
}