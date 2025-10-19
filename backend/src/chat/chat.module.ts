import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { StudySession, StudySessionSchema } from '../schemas/study-session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StudySession.name, schema: StudySessionSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}