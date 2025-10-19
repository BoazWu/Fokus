import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StudySessionDocument = StudySession & Document;

@Schema({
  timestamps: true,
})
export class StudySession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ required: true })
  duration: number; // in milliseconds

  @Prop({ required: true, default: 0 })
  pausedDuration: number; // total time paused in milliseconds

  @Prop({ min: 1, max: 5 })
  rating?: number; // optional rating out of 5 stars
}

export const StudySessionSchema = SchemaFactory.createForClass(StudySession);

// Create compound index for efficient user session queries
StudySessionSchema.index({ userId: 1, createdAt: -1 });