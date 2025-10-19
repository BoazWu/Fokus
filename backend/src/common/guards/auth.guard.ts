import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const session = (request as any).session;

    if (!session || !session.userId) {
      throw new UnauthorizedException('Authentication required');
    }

    // Add user object to request for easy access in controllers
    (request as any).user = { userId: session.userId };
    
    return true;
  }
}