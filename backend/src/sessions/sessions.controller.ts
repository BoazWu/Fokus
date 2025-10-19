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

  @Post('cleanup/active-sessions')
  async cleanupActiveSessions() {
    return this.sessionsService.deleteAllActiveAndPausedSessions();
  }
}