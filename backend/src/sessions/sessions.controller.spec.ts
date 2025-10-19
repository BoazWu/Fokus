import { Test, TestingModule } from '@nestjs/testing';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { Types } from 'mongoose';

describe('SessionsController', () => {
  let controller: SessionsController;
  let service: SessionsService;

  const mockActiveSession = {
    _id: new Types.ObjectId().toString(),
    userId: new Types.ObjectId().toString(),
    title: 'Test Session',
    startTime: new Date().toISOString(),
    status: 'active' as const,
    duration: 0,
    pausedDuration: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockCompletedSession = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    title: 'Test Session',
    startTime: new Date(),
    endTime: new Date(),
    duration: 3600000,
    pausedDuration: 0,
  };

  const mockSessionsService = {
    createSession: jest.fn().mockResolvedValue(mockActiveSession),
    updateSession: jest.fn().mockResolvedValue(mockActiveSession),
    endSession: jest.fn().mockResolvedValue(mockCompletedSession),
    getUserSessions: jest.fn().mockResolvedValue({
      sessions: [mockCompletedSession],
      total: 1,
      totalPages: 1,
    }),
    getSessionById: jest.fn().mockResolvedValue(mockCompletedSession),
    deleteAllActiveAndPausedSessions: jest.fn().mockResolvedValue({ deletedCount: 5 }),
  };

  const mockAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [
        {
          provide: SessionsService,
          useValue: mockSessionsService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<SessionsController>(SessionsController);
    service = module.get<SessionsService>(SessionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('startSession', () => {
    it('should create a new session', async () => {
      const userId = 'user123';
      const result = await controller.startSession(userId);

      expect(service.createSession).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockActiveSession);
    });
  });

  describe('updateSession', () => {
    it('should update a session', async () => {
      const sessionId = 'session123';
      const updateDto = { status: 'paused' as const };
      const userId = 'user123';

      const result = await controller.updateSession(sessionId, updateDto, userId);

      expect(service.updateSession).toHaveBeenCalledWith(sessionId, 'user123', updateDto);
      expect(result).toEqual(mockActiveSession);
    });
  });

  describe('endSession', () => {
    it('should end a session', async () => {
      const sessionId = 'session123';
      const endDto = { title: 'Completed Session', description: 'Study notes' };
      const userId = 'user123';

      const result = await controller.endSession(sessionId, endDto, userId);

      expect(service.endSession).toHaveBeenCalledWith(
        sessionId,
        'user123',
        'Completed Session',
        'Study notes',
      );
      expect(result).toEqual(mockCompletedSession);
    });
  });

  describe('getUserSessions', () => {
    it('should get user sessions', async () => {
      const query = { page: 1, limit: 10 };
      const userId = 'user123';

      const result = await controller.getUserSessions(query, userId);

      expect(service.getUserSessions).toHaveBeenCalledWith('user123', 1, 10);
      expect(result).toEqual({
        sessions: [mockCompletedSession],
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('getSession', () => {
    it('should get a specific session', async () => {
      const sessionId = 'session123';
      const userId = 'user123';

      const result = await controller.getSession(sessionId, userId);

      expect(service.getSessionById).toHaveBeenCalledWith(sessionId, 'user123');
      expect(result).toEqual(mockCompletedSession);
    });
  });

  describe('cleanupActiveSessions', () => {
    it('should cleanup active sessions', async () => {
      const result = await controller.cleanupActiveSessions();

      expect(service.deleteAllActiveAndPausedSessions).toHaveBeenCalled();
      expect(result).toEqual({ deletedCount: 5 });
    });
  });
});