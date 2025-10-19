# AI Study Coach Chat Feature

This feature adds an AI-powered study coach that provides personalized advice based on the user's study session data.

## Features

- **Personalized Advice**: The AI analyzes the user's study patterns, session durations, ratings, and habits to provide tailored recommendations
- **Study Context Awareness**: The AI has access to:
  - Total study sessions and time
  - Average session length and ratings
  - Study patterns (most active days/hours)
  - Recent session details
- **Conversational Interface**: Clean chat UI with conversation history
- **Real-time Responses**: Powered by Amazon Bedrock (Claude 3 Haiku)

## Technical Implementation

### Backend
- **AWS Bedrock Integration**: Uses Claude 3 Haiku model for fast, cost-effective responses
- **Study Data Analysis**: Automatically analyzes user's last 30 days of study sessions
- **Context-Aware Prompting**: Builds rich context from study statistics and patterns

### Frontend
- **React Chat Interface**: Clean, responsive chat UI using Mantine components
- **Real-time Messaging**: Instant message sending with loading states
- **Conversation History**: Maintains chat context throughout the session

## Setup Requirements

### AWS Configuration
1. Set up AWS credentials (via AWS CLI, IAM roles, or environment variables)
2. Ensure access to Amazon Bedrock in your AWS region
3. Set the `AWS_REGION` environment variable (defaults to `us-east-1`)

### Environment Variables
Add to your backend `.env` file:
```
AWS_REGION=us-east-1
```

### Dependencies
The following packages were added:
- Backend: `@aws-sdk/client-bedrock-runtime`

## Usage

1. Navigate to the "AI Study Coach" tab in the application
2. Start chatting with the AI about your study habits
3. The AI will provide personalized advice based on your actual study data
4. Ask about study techniques, time management, motivation, or specific challenges

## Model Choice

We use **Claude 3 Haiku** because it's:
- Fast response times (ideal for chat)
- Cost-effective for frequent interactions
- Good at following instructions and maintaining context
- Excellent for educational/coaching conversations

## Security & Privacy

- All study data stays within your system
- Only aggregated statistics are shared with the AI (no personal details)
- AWS Bedrock doesn't store conversation data
- Standard authentication required to access the feature