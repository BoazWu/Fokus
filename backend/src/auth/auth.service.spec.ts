import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../schemas/user.schema';

// Mock bcrypt module
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const bcrypt = require('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;

  const mockUser = {
    _id: 'mockUserId',
    email: 'test@example.com',
    password: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    toObject: jest.fn().mockReturnValue({
      _id: 'mockUserId',
      email: 'test@example.com',
      password: 'hashedPassword',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  };

  // Create a constructor function that acts like a Mongoose model
  function MockUserConstructor(data: any) {
    return {
      ...data,
      save: jest.fn().mockResolvedValue({
        toObject: () => ({
          _id: 'mockUserId',
          email: data.email,
          password: data.password,
        }),
      }),
    };
  }

  // Add static methods to the constructor
  MockUserConstructor.findOne = jest.fn();
  MockUserConstructor.findById = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: MockUserConstructor,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken(User.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      MockUserConstructor.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword');

      const result = await service.register(email, password);

      expect(MockUserConstructor.findOne).toHaveBeenCalledWith({ email });
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toEqual({
        _id: 'mockUserId',
        email,
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      MockUserConstructor.findOne.mockResolvedValue(mockUser);

      await expect(service.register(email, password)).rejects.toThrow(
        ConflictException,
      );
      expect(MockUserConstructor.findOne).toHaveBeenCalledWith({ email });
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      MockUserConstructor.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const result = await service.login(email, password);

      expect(MockUserConstructor.findOne).toHaveBeenCalledWith({ email });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toEqual({
        _id: 'mockUserId',
        email: 'test@example.com',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      MockUserConstructor.findOne.mockResolvedValue(null);

      await expect(service.login(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(MockUserConstructor.findOne).toHaveBeenCalledWith({ email });
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      MockUserConstructor.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(service.login(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
    });
  });

  describe('findById', () => {
    it('should return user without password', async () => {
      const userId = 'mockUserId';
      const mockUserWithoutPassword = {
        _id: userId,
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockUserWithoutPassword),
      };
      MockUserConstructor.findById.mockReturnValue(mockQuery);

      const result = await service.findById(userId);

      expect(MockUserConstructor.findById).toHaveBeenCalledWith(userId);
      expect(mockQuery.select).toHaveBeenCalledWith('-password');
      expect(result).toEqual(mockUserWithoutPassword);
    });

    it('should return null if user not found', async () => {
      const userId = 'nonexistentId';

      const mockQuery = {
        select: jest.fn().mockResolvedValue(null),
      };
      MockUserConstructor.findById.mockReturnValue(mockQuery);

      const result = await service.findById(userId);

      expect(result).toBeNull();
    });
  });
});