import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { Protected, CurrentUserId } from '../common/decorators/auth.decorator';
import { UpdateSessionDto, EndSessionDto, GetSessionsQueryDto } from './dto/sessions.dto';

@Controller('sessions')
@Protected()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('start')
  async startSession(@CurrentUserId() userId: string) {
    return this.sessionsService.createSession(userId);
  }

  @Patch(':id')
  async updateSession(
    @Param('id') sessionId: string,
    @Body() updateSessionDto: UpdateSessionDto,
    @CurrentUserId() userId: string,
  ) {
    return this.sessionsService.updateSession(
      sessionId,
      userId,
      updateSessionDto,
    );
  }

  @Post(':id/end')
  async endSession(
    @Param('id') sessionId: string,
    @Body() endSessionDto: EndSessionDto,
    @CurrentUserId() userId: string,
  ) {
    return this.sessionsService.endSession(
      sessionId,
      userId,
      endSessionDto.title,
      endSessionDto.description,
      endSessionDto.rating,
      endSessionDto.focusedDuration,
      endSessionDto.pausedDuration,
    );
  }

  @Get()
  async getUserSessions(
    @Query() query: GetSessionsQueryDto,
    @CurrentUserId() userId: string,
  ) {
    return this.sessionsService.getUserSessions(
      userId,
      query.page,
      query.limit,
    );
  }

  @Get(':id')
  async getSession(@Param('id') sessionId: string, @CurrentUserId() userId: string) {
    return this.sessionsService.getSessionById(sessionId, userId);
  }

  @Post(':id/discard')
  async discardSession(
    @Param('id') sessionId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.sessionsService.discardSession(sessionId, userId);
  }

  @Post('cleanup/active-sessions')
  async cleanupActiveSessions() {
    return this.sessionsService.deleteAllActiveAndPausedSessions();
  }

  @Post('clear-active')
  async clearUserActiveSession(@CurrentUserId() userId: string) {
    const cleared = this.sessionsService.clearUserActiveSession(userId);
    return { cleared, message: cleared ? 'Active session cleared' : 'No active session found' };
  }

  @Post('dev/clear-memory')
  async clearMemorySessions() {
    this.sessionsService.clearActiveSessionsFromMemory();
    return { message: 'In-memory active sessions cleared' };
  }
}