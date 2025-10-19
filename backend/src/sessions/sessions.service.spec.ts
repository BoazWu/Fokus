import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SessionsService } from './sessions.service';
import { StudySession, StudySessionDocument } from '../schemas/study-session.schema';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SessionsService', () => {
  let service: SessionsService;
  let model: Model<StudySessionDocument>;

  const mockSession = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    title: 'Test Session',
    startTime: new Date(),
    status: 'active',
    duration: 0,
    pausedDuration: 0,
    save: jest.fn().mockResolvedValue(this),
  };

  const mockModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: getModelToken(StudySession.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    model = module.get<Model<StudySessionDocument>>(getModelToken(StudySession.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should throw BadRequestException when user has active session', async () => {
      const userId = new Types.ObjectId().toString();
      mockModel.findOne = jest.fn().mockResolvedValue(mockSession);

      await expect(service.createSession(userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSessionById', () => {
    it('should return session when found', async () => {
      const sessionId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();
      mockModel.findOne = jest.fn().mockResolvedValue(mockSession);

      const result = await service.getSessionById(sessionId, userId);

      expect(mockModel.findOne).toHaveBeenCalledWith({
        _id: new Types.ObjectId(sessionId),
        userId: new Types.ObjectId(userId),
      });
      expect(result).toEqual(mockSession);
    });

    it('should throw NotFoundException when session not found', async () => {
      const sessionId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();
      mockModel.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.getSessionById(sessionId, userId)).rejects.toThrow(NotFoundException);
    });
  });
});