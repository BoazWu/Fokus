import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser = {
    _id: 'mockUserId',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a user and create session', async () => {
      const registerDto = { email: 'test@example.com', password: 'password123' };
      const mockSession = {};

      mockAuthService.register.mockResolvedValue(mockUser);

      const result = await controller.register(registerDto, mockSession);

      expect(authService.register).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
      );
      expect(mockSession['userId']).toBe(mockUser._id);
      expect(result).toEqual({
        message: 'Registration successful',
        user: mockUser,
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto = { email: 'test@example.com', password: 'password123' };
      const mockSession = {};

      mockAuthService.register.mockRejectedValue(
        new ConflictException('User with this email already exists'),
      );

      await expect(controller.register(registerDto, mockSession)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should successfully login a user and create session', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const mockSession = {};

      mockAuthService.login.mockResolvedValue(mockUser);

      const result = await controller.login(loginDto, mockSession);

      expect(authService.login).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(mockSession['userId']).toBe(mockUser._id);
      expect(result).toEqual({
        message: 'Login successful',
        user: mockUser,
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto = { email: 'test@example.com', password: 'wrongpassword' };
      const mockSession = {};

      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(loginDto, mockSession)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const userId = 'mockUserId';

      mockAuthService.findById.mockResolvedValue(mockUser);

      const result = await controller.getProfile(userId);

      expect(authService.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ user: mockUser });
    });

    it('should throw error if user not found', async () => {
      const userId = 'nonexistentId';

      mockAuthService.findById.mockResolvedValue(null);

      await expect(controller.getProfile(userId)).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout and destroy session', async () => {
      const mockSession = {
        destroy: jest.fn().mockImplementation((callback) => callback(null)),
      };
      const mockResponse = {
        clearCookie: jest.fn(),
        json: jest.fn(),
      };

      await controller.logout(mockSession, mockResponse as any);

      expect(mockSession.destroy).toHaveBeenCalled();
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('connect.sid');
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Logout successful',
      });
    });

    it('should handle session destroy error', async () => {
      const mockError = new Error('Session destroy failed');
      const mockSession = {
        destroy: jest.fn().mockImplementation((callback) => callback(mockError)),
      };
      const mockResponse = {
        clearCookie: jest.fn(),
        json: jest.fn(),
      };

      await expect(
        controller.logout(mockSession, mockResponse as any),
      ).rejects.toThrow('Session destroy failed');
    });
  });
});