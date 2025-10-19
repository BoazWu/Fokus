import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StudySession, StudySessionDocument } from '../schemas/study-session.schema';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(StudySession.name)
    private studySessionModel: Model<StudySessionDocument>,
  ) {}

  async createSession(userId: string): Promise<StudySession> {
    // Check if user has any active sessions
    const activeSession = await this.studySessionModel.findOne({
      userId: new Types.ObjectId(userId),
      status: { $in: ['active', 'paused'] },
    });

    if (activeSession) {
      throw new BadRequestException('User already has an active session');
    }

    const session = new this.studySessionModel({
      userId: new Types.ObjectId(userId),
      title: `Study Session - ${new Date().toLocaleDateString()}`,
      startTime: new Date(),
      status: 'active',
      duration: 0,
      pausedDuration: 0,
    });

    return session.save();
  }

  async updateSession(
    sessionId: string,
    userId: string,
    updates: Partial<StudySession>,
  ): Promise<StudySession> {
    const session = await this.studySessionModel.findOne({
      _id: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId),
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Prevent updating completed sessions
    if (session.status === 'completed') {
      throw new BadRequestException('Cannot update completed session');
    }

    // Handle status transitions
    if (updates.status) {
      if (updates.status === 'paused' && session.status === 'active') {
        // Calculate current duration when pausing
        const currentTime = new Date();
        const sessionDuration = currentTime.getTime() - session.startTime.getTime() - session.pausedDuration;
        updates.duration = sessionDuration;
      } else if (updates.status === 'active' && session.status === 'paused') {
        // When resuming, we don't need to update duration here as it will be calculated on next pause/end
      }
    }

    Object.assign(session, updates);
    return session.save();
  }

  async endSession(
    sessionId: string,
    userId: string,
    title?: string,
    description?: string,
  ): Promise<StudySession> {
    const session = await this.studySessionModel.findOne({
      _id: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId),
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status === 'completed') {
      throw new BadRequestException('Session is already completed');
    }

    const endTime = new Date();
    const totalDuration = endTime.getTime() - session.startTime.getTime() - session.pausedDuration;

    session.endTime = endTime;
    session.duration = totalDuration;
    session.status = 'completed';
    
    if (title) {
      session.title = title;
    }
    
    if (description) {
      session.description = description;
    }

    return session.save();
  }

  async getUserSessions(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ sessions: StudySession[]; total: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      this.studySessionModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.studySessionModel.countDocuments({ userId: new Types.ObjectId(userId) }),
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
}