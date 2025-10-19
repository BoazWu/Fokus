import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StudySession, StudySessionDocument } from '../schemas/study-session.schema';

// Interface for active session tracking (in-memory only)
interface ActiveSession {
  sessionId: string;
  userId: string;
  startTime: Date;
  pausedDuration: number;
  status: 'active' | 'paused';
}

@Injectable()
export class SessionsService {
  // In-memory storage for active sessions
  private activeSessions = new Map<string, ActiveSession>();

  constructor(
    @InjectModel(StudySession.name)
    private studySessionModel: Model<StudySessionDocument>,
  ) {}

  async createSession(userId: string): Promise<{ _id: string; userId: string; title: string; startTime: string; status: 'active'; duration: number; pausedDuration: number; createdAt: string; updatedAt: string }> {
    // Check if user already has an active session
    const existingActiveSession = Array.from(this.activeSessions.values())
      .find(session => session.userId === userId);

    if (existingActiveSession) {
      throw new BadRequestException('User already has an active session');
    }

    // Generate a temporary session ID for tracking
    const sessionId = new Types.ObjectId().toString();
    const now = new Date();
    
    // Store in memory only
    this.activeSessions.set(sessionId, {
      sessionId,
      userId,
      startTime: now,
      pausedDuration: 0,
      status: 'active',
    });

    // Return session data in the expected format (but don't save to DB yet)
    return {
      _id: sessionId,
      userId,
      title: `Study Session - ${now.toLocaleDateString()}`,
      startTime: now.toISOString(),
      status: 'active' as const,
      duration: 0,
      pausedDuration: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  async updateSession(
    sessionId: string,
    userId: string,
    updates: { status?: 'active' | 'paused'; pausedDuration?: number },
  ): Promise<{ _id: string; userId: string; title: string; startTime: string; duration: number; status: 'active' | 'paused'; pausedDuration: number; createdAt: string; updatedAt: string }> {
    const activeSession = this.activeSessions.get(sessionId);

    if (!activeSession || activeSession.userId !== userId) {
      throw new NotFoundException('Active session not found');
    }

    // Update the in-memory session
    if (updates.status) {
      activeSession.status = updates.status;
    }
    
    if (updates.pausedDuration !== undefined) {
      activeSession.pausedDuration = updates.pausedDuration;
    }

    // Calculate current duration
    const currentTime = new Date();
    const duration = currentTime.getTime() - activeSession.startTime.getTime() - activeSession.pausedDuration;

    // Return updated session data
    return {
      _id: sessionId,
      userId: activeSession.userId,
      title: `Study Session - ${activeSession.startTime.toLocaleDateString()}`,
      startTime: activeSession.startTime.toISOString(),
      duration,
      status: activeSession.status,
      pausedDuration: activeSession.pausedDuration,
      createdAt: activeSession.startTime.toISOString(),
      updatedAt: currentTime.toISOString(),
    };
  }

  async endSession(
    sessionId: string,
    userId: string,
    title?: string,
    description?: string,
    rating?: number,
  ): Promise<StudySession> {
    const activeSession = this.activeSessions.get(sessionId);

    if (!activeSession || activeSession.userId !== userId) {
      throw new NotFoundException('Active session not found');
    }

    const endTime = new Date();
    const totalDuration = endTime.getTime() - activeSession.startTime.getTime() - activeSession.pausedDuration;

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      throw new BadRequestException('Rating must be between 1 and 5 stars');
    }

    // Now save to database as a completed session
    const completedSession = new this.studySessionModel({
      userId: new Types.ObjectId(userId),
      title: title || `Study Session - ${activeSession.startTime.toLocaleDateString()}`,
      description,
      startTime: activeSession.startTime,
      endTime,
      duration: totalDuration,
      pausedDuration: activeSession.pausedDuration,
      rating,
    });

    // Remove from active sessions
    this.activeSessions.delete(sessionId);

    return completedSession.save();
  }

  async getUserSessions(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ sessions: StudySession[]; total: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    // All sessions in the database are completed, so no need to filter by status
    const filter = { 
      userId: new Types.ObjectId(userId)
    };

    const [sessions, total] = await Promise.all([
      this.studySessionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.studySessionModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      sessions,
      total,
      totalPages,
    };
  }

  async getSessionById(sessionId: string, userId: string): Promise<StudySession> {
    const session = await this.studySessionModel.findOne({
      _id: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId),
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  // Clean up method to delete all existing active/paused sessions from database
  async deleteAllActiveAndPausedSessions(): Promise<{ deletedCount: number }> {
    const result = await this.studySessionModel.deleteMany({
      $or: [
        { status: 'active' },
        { status: 'paused' },
        { endTime: { $exists: false } }, // Sessions without endTime (incomplete)
      ]
    });

    return { deletedCount: result.deletedCount };
  }

  // Get active session for a user (from memory)
  getActiveSession(userId: string): ActiveSession | null {
    const activeSession = Array.from(this.activeSessions.values())
      .find(session => session.userId === userId);
    
    return activeSession || null;
  }

  // Clear all active sessions from memory (useful for testing or cleanup)
  clearActiveSessionsFromMemory(): void {
    this.activeSessions.clear();
  }
}