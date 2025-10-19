import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { StudySession, StudySessionDocument } from '../schemas/study-session.schema';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  timestamp: Date;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly bedrockClient: BedrockRuntimeClient;
  private readonly modelId = 'anthropic.claude-3-haiku-20240307-v1:0'; // Fast and cost-effective model

  constructor(
    @InjectModel(StudySession.name)
    private studySessionModel: Model<StudySessionDocument>,
  ) {
    // Check for required AWS credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error(
        'AWS credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file'
      );
    }

    // Initialize Bedrock client with explicit credentials
    this.bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async chatWithAI(userId: string, chatRequest: ChatRequest): Promise<ChatResponse> {
    try {
      // Get user's study session data for context
      const studyContext = await this.getUserStudyContext(userId);

      // Build the conversation with context
      const systemPrompt = this.buildSystemPrompt(studyContext);
      const messages = this.buildConversation(systemPrompt, chatRequest);

      // Call Bedrock
      const response = await this.invokeBedrockModel(messages);

      return {
        response,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Error in chat service:', error);
      // Log the full error details for debugging
      this.logger.error('Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      throw error; // Re-throw the original error instead of masking it
    }
  }

  private async getUserStudyContext(userId: string) {
    const objectId = new Types.ObjectId(userId);

    // Get recent sessions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSessions = await this.studySessionModel
      .find({
        userId: objectId,
        startTime: { $gte: thirtyDaysAgo },
      })
      .sort({ startTime: -1 })
      .limit(50)
      .exec();

    // Calculate study statistics
    const totalSessions = recentSessions.length;
    const totalStudyTime = recentSessions.reduce((sum, session) => sum + session.duration, 0);
    const totalPausedTime = recentSessions.reduce((sum, session) => sum + session.pausedDuration, 0);
    const totalFocusedTime = totalStudyTime - totalPausedTime;
    const averageSessionLength = totalSessions > 0 ? totalStudyTime / totalSessions : 0;
    const averagePausedTime = totalSessions > 0 ? totalPausedTime / totalSessions : 0;

    const ratingsWithValues = recentSessions.filter(s => s.rating && s.rating > 0);
    const averageRating = ratingsWithValues.length > 0
      ? ratingsWithValues.reduce((sum, s) => sum + s.rating!, 0) / ratingsWithValues.length
      : null;

    // Get study patterns (by day of week and hour)
    const studyPatterns = this.analyzeStudyPatterns(recentSessions);

    return {
      totalSessions,
      totalStudyTimeHours: Math.round(totalStudyTime / (1000 * 60 * 60) * 100) / 100,
      totalFocusedTimeHours: Math.round(totalFocusedTime / (1000 * 60 * 60) * 100) / 100,
      totalPausedTimeHours: Math.round(totalPausedTime / (1000 * 60 * 60) * 100) / 100,
      averageSessionLengthMinutes: Math.round(averageSessionLength / (1000 * 60)),
      averagePausedTimeMinutes: Math.round(averagePausedTime / (1000 * 60)),
      averageRating,
      studyPatterns,
      recentSessions: recentSessions.slice(0, 10).map(session => ({
        title: session.title,
        duration: Math.round(session.duration / (1000 * 60)), // in minutes
        pausedDuration: Math.round(session.pausedDuration / (1000 * 60)), // in minutes
        focusedDuration: Math.round((session.duration - session.pausedDuration) / (1000 * 60)), // in minutes
        rating: session.rating,
        date: session.startTime,
      })),
    };
  }

  private analyzeStudyPatterns(sessions: StudySessionDocument[]) {
    const dayOfWeekCounts = new Array(7).fill(0);
    const hourCounts = new Array(24).fill(0);

    sessions.forEach(session => {
      const date = new Date(session.startTime);
      dayOfWeekCounts[date.getDay()]++;
      hourCounts[date.getHours()]++;
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mostActiveDay = dayNames[dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts))];
    const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts));

    return {
      mostActiveDay,
      mostActiveHour,
      totalDaysStudied: dayOfWeekCounts.filter(count => count > 0).length,
    };
  }

  private buildSystemPrompt(studyContext: any): string {
    return `You are a helpful AI study coach assistant. You have access to the user's study session data and should provide personalized advice based on their study patterns and performance.

User's Study Statistics (Last 30 days):
- Total study sessions: ${studyContext.totalSessions}
- Total study time: ${studyContext.totalStudyTimeHours} hours
- Total focused time: ${studyContext.totalFocusedTimeHours} hours
- Total paused time: ${studyContext.totalPausedTimeHours} hours
- Average session length: ${studyContext.averageSessionLengthMinutes} minutes
- Average paused time per session: ${studyContext.averagePausedTimeMinutes} minutes
- Average session rating: ${studyContext.averageRating ? studyContext.averageRating.toFixed(1) + '/5' : 'No ratings yet'}
- Most active study day: ${studyContext.studyPatterns.mostActiveDay}
- Most active study hour: ${studyContext.studyPatterns.mostActiveHour}:00
- Days studied: ${studyContext.studyPatterns.totalDaysStudied}/7 days of the week

Recent Sessions:
${studyContext.recentSessions.map((session: any, index: number) =>
      `${index + 1}. "${session.title}" - ${session.duration} min total (${session.focusedDuration} min focused${session.pausedDuration > 0 ? `, ${session.pausedDuration} min paused` : ''})${session.rating ? ` (${session.rating}/5 stars)` : ''}`
    ).join('\n')}

Study Habit Benchmarks for Context:
- Excellent consistency: 1+ study session per day (7+ sessions/week)
- Good consistency: 4-6 study sessions per week
- Developing consistency: 2-3 study sessions per week
- Optimal session length: 25-50 minutes (Pomodoro technique range)
- Good focus efficiency: 85%+ focused time (15% or less paused)
- Excellent focus efficiency: 95%+ focused time (5% or less paused)
- Healthy study schedule: Studying 5-6 days per week with 1-2 rest days
- Effective daily study time: 1-3 hours for most students
- Session rating trends: Consistent 4-5 star ratings indicate good study quality

Guidelines for responses:
- Be encouraging and supportive
- Provide specific, actionable study advice
- Reference their actual study data when relevant
- Use the benchmarks above to provide context (e.g., "Your 1 session per day shows excellent consistency!")
- Keep responses concise but helpful
- Focus on study techniques, time management, and motivation
- Celebrate achievements and progress, even small ones
- If they ask about topics unrelated to studying, gently redirect to study-related topics

Remember: You're here to help them improve their study habits and academic performance based on their actual study patterns. Use the benchmarks to provide encouraging, realistic feedback.`;
  }

  private buildConversation(systemPrompt: string, chatRequest: ChatRequest) {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      {
        role: 'user',
        content: systemPrompt,
      },
    ];

    // Add conversation history if provided
    if (chatRequest.conversationHistory) {
      chatRequest.conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: chatRequest.message,
    });

    return messages;
  }

  private async invokeBedrockModel(messages: any[]): Promise<string> {
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1000,
      messages: messages.slice(1), // Remove system prompt from messages array
      system: messages[0].content, // Use first message as system prompt
    };

    this.logger.debug('Invoking Bedrock with payload:', {
      modelId: this.modelId,
      messageCount: payload.messages.length,
      systemPromptLength: payload.system.length,
    });

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });

    try {
      const response = await this.bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      this.logger.debug('Bedrock response received:', {
        hasContent: !!responseBody.content,
        contentLength: responseBody.content?.[0]?.text?.length || 0,
      });

      return responseBody.content[0].text;
    } catch (error) {
      this.logger.error('Bedrock invocation failed:', {
        error: error.message,
        modelId: this.modelId,
        region: process.env.AWS_REGION,
      });

      // If it's a model access issue, provide a helpful fallback
      if (error.message?.includes('ResourceNotFoundException') ||
        error.message?.includes('use case details')) {
        this.logger.warn('Model access not available, using fallback response');
        return this.getFallbackResponse(messages);
      }

      throw error;
    }
  }

  private getFallbackResponse(messages: any[]): string {
    const userMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';

    // Simple keyword-based responses while waiting for AI model access
    if (userMessage.includes('study') && userMessage.includes('habit')) {
      return "I'd love to analyze your study habits! However, I'm currently waiting for AI model access approval. In the meantime, here are some general study tips: try the Pomodoro technique (25 min focused study + 5 min break), create a consistent study schedule, and take regular breaks to maintain focus.";
    }

    if (userMessage.includes('time') || userMessage.includes('schedule')) {
      return "Time management is crucial for effective studying! While I wait for full AI access, here's what I recommend: block out specific study times, eliminate distractions during study sessions, and use your most productive hours for challenging subjects.";
    }

    if (userMessage.includes('motivation') || userMessage.includes('focus')) {
      return "Staying motivated can be challenging! Some proven strategies: set small, achievable goals, reward yourself for completing study sessions, study with others for accountability, and remember your long-term goals. I'll be able to give more personalized advice once my AI capabilities are fully activated!";
    }

    return "Thanks for your question! I'm currently waiting for AI model access approval from AWS. Once that's complete, I'll be able to provide personalized study advice based on your actual study session data. In the meantime, keep up the great work with your study sessions!";
  }
}