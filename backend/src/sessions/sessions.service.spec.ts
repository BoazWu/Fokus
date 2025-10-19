import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SessionsService } from './sessions.service';
import { StudySession, StudySessionDocument } from '../schemas/study-session.schema';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SessionsService', () => {
  let service: SessionsService;
  let model: Model<StudySessionDocument>;

  const mockCompletedSession = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    title: 'Test Session',
    startTime: new Date(),
    endTime: new Date(),
    duration: 3600000, // 1 hour
    pausedDuration: 0,
    save: jest.fn().mockResolvedValue(this),
  };

  const mockSave = jest.fn();
  const mockModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    deleteMany: jest.fn(),
    exec: jest.fn(),
  };

  // Mock constructor function
  const MockModelConstructor = jest.fn().mockImplementation(() => ({
    save: mockSave,
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: getModelToken(StudySession.name),
          useValue: Object.assign(MockModelConstructor, mockModel),
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    model = module.get<Model<StudySessionDocument>>(getModelToken(StudySession.name));
    
    // Clear active sessions before each test
    service.clearActiveSessionsFromMemory();
    
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should create an active session in memory', async () => {
      const userId = new Types.ObjectId().toString();

      const result = await service.createSession(userId);

      expect(result).toMatchObject({
        _id: expect.any(String),
        userId,
        title: expect.stringContaining('Study Session'),
        status: 'active',
        duration: 0,
        pausedDuration: 0,
      });
    });

    it('should throw BadRequestException when user has active session', async () => {
      const userId = new Types.ObjectId().toString();
      
      // Create first session
      await service.createSession(userId);
      
      // Try to create second session
      await expect(service.createSession(userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('endSession', () => {
    it('should save session to database when ending', async () => {
      const userId = new Types.ObjectId().toString();
      
      // Create active session
      const activeSession = await service.createSession(userId);
      
      // Setup mock save to return completed session
      mockSave.mockResolvedValue(mockCompletedSession);
      
      const result = await service.endSession(activeSession._id, userId, 'Test Title', 'Test Description');

      expect(MockModelConstructor).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(mockCompletedSession);
    });

    it('should throw NotFoundException for non-existent session', async () => {
      const sessionId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();

      await expect(service.endSession(sessionId, userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserSessions', () => {
    it('should return all sessions from database', async () => {
      const userId = new Types.ObjectId().toString();
      
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockCompletedSession]),
      };
      
      // Set up the model mock properly
      Object.assign(model, {
        find: jest.fn().mockReturnValue(mockFind),
        countDocuments: jest.fn().mockResolvedValue(1),
      });

      const result = await service.getUserSessions(userId, 1, 10);

      expect(model.find).toHaveBeenCalledWith({
        userId: new Types.ObjectId(userId)
      });
      expect(model.countDocuments).toHaveBeenCalledWith({
        userId: new Types.ObjectId(userId)
      });
      expect(result).toEqual({
        sessions: [mockCompletedSession],
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('deleteAllActiveAndPausedSessions', () => {
    it('should delete active and paused sessions from database', async () => {
      Object.assign(model, {
        deleteMany: jest.fn().mockResolvedValue({ deletedCount: 5 }),
      });

      const result = await service.deleteAllActiveAndPausedSessions();

      expect(model.deleteMany).toHaveBeenCalledWith({
        $or: [
          { status: 'active' },
          { status: 'paused' },
          { endTime: { $exists: false } },
        ]
      });
      expect(result).toEqual({ deletedCount: 5 });
    });
  });

  describe('getSessionById', () => {
    it('should return session when found', async () => {
      const sessionId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();
      
      Object.assign(model, {
        findOne: jest.fn().mockResolvedValue(mockCompletedSession),
      });

      const result = await service.getSessionById(sessionId, userId);

      expect(model.findOne).toHaveBeenCalledWith({
        _id: new Types.ObjectId(sessionId),
        userId: new Types.ObjectId(userId),
      });
      expect(result).toEqual(mockCompletedSession);
    });

    it('should throw NotFoundException when session not found', async () => {
      const sessionId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();
      
      Object.assign(model, {
        findOne: jest.fn().mockResolvedValue(null),
      });

      await expect(service.getSessionById(sessionId, userId)).rejects.toThrow(NotFoundException);
    });
  });
});