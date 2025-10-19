import { UseGuards, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';

// Decorator to protect routes
export const Protected = () => UseGuards(AuthGuard);

// Decorator to get current user ID from request
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.userId;
  },
);