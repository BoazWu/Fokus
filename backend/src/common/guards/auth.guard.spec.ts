import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockExecutionContext: ExecutionContext;

  beforeEach(() => {
    guard = new AuthGuard();
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
      }),
    } as any;
  });

  it('should allow access when user is authenticated', () => {
    const mockRequest = {
      session: {
        userId: 'mockUserId',
      },
    };

    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(
      mockRequest,
    );

    const result = guard.canActivate(mockExecutionContext);

    expect(result).toBe(true);
    expect(mockRequest['userId']).toBe('mockUserId');
  });

  it('should throw UnauthorizedException when session is missing', () => {
    const mockRequest = {};

    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(
      mockRequest,
    );

    expect(() => guard.canActivate(mockExecutionContext)).toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when userId is missing from session', () => {
    const mockRequest = {
      session: {},
    };

    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(
      mockRequest,
    );

    expect(() => guard.canActivate(mockExecutionContext)).toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when session.userId is null', () => {
    const mockRequest = {
      session: {
        userId: null,
      },
    };

    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(
      mockRequest,
    );

    expect(() => guard.canActivate(mockExecutionContext)).toThrow(
      UnauthorizedException,
    );
  });
});