import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { UpdateSessionDto, EndSessionDto, GetSessionsQueryDto } from './dto/sessions.dto';

@Controller('sessions')
@UseGuards(AuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('start')
  async startSession(@Request() req) {
    return this.sessionsService.createSession(req.user.userId);
  }

  @Patch(':id')
  async updateSession(
    @Param('id') sessionId: string,
    @Body() updateSessionDto: UpdateSessionDto,
    @Request() req,
  ) {
    return this.sessionsService.updateSession(
      sessionId,
      req.user.userId,
      updateSessionDto,
    );
  }

  @Post(':id/end')
  async endSession(
    @Param('id') sessionId: string,
    @Body() endSessionDto: EndSessionDto,
    @Request() req,
  ) {
    return this.sessionsService.endSession(
      sessionId,
      req.user.userId,
      endSessionDto.title,
      endSessionDto.description,
    );
  }

  @Get()
  async getUserSessions(
    @Query() query: GetSessionsQueryDto,
    @Request() req,
  ) {
    return this.sessionsService.getUserSessions(
      req.user.userId,
      query.page,
      query.limit,
    );
  }

  @Get(':id')
  async getSession(@Param('id') sessionId: string, @Request() req) {
    return this.sessionsService.getSessionById(sessionId, req.user.userId);
  }
}