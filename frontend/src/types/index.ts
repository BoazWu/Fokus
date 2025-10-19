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
  endTime: string; // All sessions in DB are completed, so endTime is required
  duration: number; // in milliseconds
  pausedDuration: number; // total time paused
  rating?: number; // optional rating out of 5 stars
  createdAt: string;
  updatedAt: string;
}

// Active session type for timer (not stored in DB)
export interface ActiveSession {
  _id: string;
  userId: string;
  title: string;
  startTime: string;
  duration: number;
  status: 'active' | 'paused';
  pausedDuration: number;
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
  rating?: number;
}