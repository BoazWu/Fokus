import { Controller, Post, Get, Body, Req, Res, Session, HttpCode, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { Protected, CurrentUserId } from '../common/decorators/auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Session() session: Record<string, any>,
  ) {
    const user = await this.authService.register(registerDto.email, registerDto.password);
    
    // Create session
    session.userId = user._id;
    
    return {
      message: 'Registration successful',
      user,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Session() session: Record<string, any>,
  ) {
    const user = await this.authService.login(loginDto.email, loginDto.password);
    
    // Create session
    session.userId = user._id;
    
    return {
      message: 'Login successful',
      user,
    };
  }

  @Get('profile')
  @Protected()
  async getProfile(@CurrentUserId() userId: string) {
    const user = await this.authService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return { user };
  }

  @Post('refresh')
  @Protected()
  @HttpCode(HttpStatus.OK)
  async refreshSession(
    @CurrentUserId() userId: string,
    @Session() session: Record<string, any>,
  ) {
    // Refresh the session by updating it
    session.userId = userId;
    
    const user = await this.authService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      message: 'Session refreshed',
      user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Session() session: Record<string, any>,
    @Res() res: Response,
  ) {
    return new Promise((resolve, reject) => {
      session.destroy((err: any) => {
        if (err) {
          reject(err);
        } else {
          res.clearCookie('connect.sid'); // Default session cookie name
          res.json({ message: 'Logout successful' });
          resolve(undefined);
        }
      });
    });
  }
}