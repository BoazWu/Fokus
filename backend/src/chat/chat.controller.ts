import { Controller, Post, Body } from '@nestjs/common';
import { ChatService, type ChatRequest, type ChatResponse } from './chat.service';
import { Protected, CurrentUserId } from '../common/decorators/auth.decorator';

@Controller('chat')
@Protected()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(
    @CurrentUserId() userId: string,
    @Body() chatRequest: ChatRequest,
  ): Promise<ChatResponse> {
    return this.chatService.chatWithAI(userId, chatRequest);
  }
}