import { Test, TestingModule } from '@nestjs/testing';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { Types } from 'mongoose';

describe('SessionsController', () => {
  let controller: SessionsController;
  let service: SessionsService;

  const mockSession = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    title: 'Test Session',
    startTime: new Date(),
    status: 'active',
    duration: 0,
    pausedDuration: 0,
  };

  const mockSessionsService = {
    createSession: jest.fn().mockResolvedValue(mockSession),
    updateSession: jest.fn().mockResolvedValue(mockSession),
    endSession: jest.fn().mockResolvedValue(mockSession),
    getUserSessions: jest.fn().mockResolvedValue({
      sessions: [mockSession],
      total: 1,
      totalPages: 1,
    }),
    getSessionById: jest.fn().mockResolvedValue(mockSession),
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
      const req = { user: { userId: 'user123' } };
      const result = await controller.startSession(req);

      expect(service.createSession).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockSession);
    });
  });

  describe('updateSession', () => {
    it('should update a session', async () => {
      const sessionId = 'session123';
      const updateDto = { status: 'paused' as const };
      const req = { user: { userId: 'user123' } };

      const result = await controller.updateSession(sessionId, updateDto, req);

      expect(service.updateSession).toHaveBeenCalledWith(sessionId, 'user123', updateDto);
      expect(result).toEqual(mockSession);
    });
  });

  describe('endSession', () => {
    it('should end a session', async () => {
      const sessionId = 'session123';
      const endDto = { title: 'Completed Session', description: 'Study notes' };
      const req = { user: { userId: 'user123' } };

      const result = await controller.endSession(sessionId, endDto, req);

      expect(service.endSession).toHaveBeenCalledWith(
        sessionId,
        'user123',
        'Completed Session',
        'Study notes',
      );
      expect(result).toEqual(mockSession);
    });
  });

  describe('getUserSessions', () => {
    it('should get user sessions', async () => {
      const query = { page: 1, limit: 10 };
      const req = { user: { userId: 'user123' } };

      const result = await controller.getUserSessions(query, req);

      expect(service.getUserSessions).toHaveBeenCalledWith('user123', 1, 10);
      expect(result).toEqual({
        sessions: [mockSession],
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('getSession', () => {
    it('should get a specific session', async () => {
      const sessionId = 'session123';
      const req = { user: { userId: 'user123' } };

      const result = await controller.getSession(sessionId, req);

      expect(service.getSessionById).toHaveBeenCalledWith(sessionId, 'user123');
      expect(result).toEqual(mockSession);
    });
  });
});