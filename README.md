# Fokus

A comprehensive study session tracking application with AI-powered coaching, designed to help students optimize their learning habits and maintain focus.

## Project Structure

```
├── frontend/          # React TypeScript frontend with Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/      # Authentication components
│   │   │   ├── session/   # Study session components (timer, forms, cards)
│   │   │   ├── layout/    # Layout and navigation components
│   │   │   └── common/    # Reusable UI components
│   │   ├── pages/         # Page components (Dashboard, Timer, Chat, Auth)
│   │   ├── contexts/      # React contexts (Authentication)
│   │   ├── services/      # API services (Session, Chat, Auth)
│   │   └── types/         # TypeScript type definitions
│   └── package.json
├── backend/           # NestJS backend
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── sessions/      # Study sessions module with real-time tracking
│   │   ├── chat/          # AI coaching module with Bedrock integration
│   │   ├── schemas/       # Mongoose schemas (User, StudySession)
│   │   └── common/        # Shared utilities and decorators
│   └── package.json
└── README.md
```

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Mantine UI for components
- React Router for navigation

### Backend
- NestJS with TypeScript
- MongoDB with Mongoose
- Session-based authentication
- bcryptjs for password hashing
- AWS Bedrock integration for AI coaching
- Real-time session tracking and analytics

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local instance)
- AWS Account (for AI coaching features)
- AWS CLI configured or environment variables set

### Installation

1. Install frontend dependencies:
```bash
cd frontend
npm install
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

### Development

1. Start the backend server:
```bash
cd backend
npm run start:dev
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:3000`.

### AWS Bedrock Setup (for AI Coaching)

1. **Configure AWS Credentials**:
   ```bash
   # Option 1: AWS CLI
   aws configure
   
   # Option 2: Environment Variables
   export AWS_ACCESS_KEY_ID=your-access-key
   export AWS_SECRET_ACCESS_KEY=your-secret-key
   export AWS_REGION=us-east-1
   ```

2. **Request Model Access**:
   - Go to [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
   - Navigate to "Model access" in the sidebar
   - Request access to "Anthropic Claude 3 Haiku"
   - Fill out the use case form (usually approved instantly)

3. **Set Environment Variables**:
   Create a `.env` file in the backend directory:
   ```
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key-here
   AWS_SECRET_ACCESS_KEY=your-secret-access-key-here
   SESSION_SECRET=your-random-session-secret
   MONGODB_URI=mongodb://localhost:27017/study-tracker
   ```

### Environment Configuration

Copy the example environment file and configure your settings:
```bash
cd backend
cp .env.example .env
# Edit .env with your actual values
```

## Technical Highlights

### Advanced Session Tracking
- **Precise Timing**: Millisecond-accurate session tracking with pause/resume functionality
- **Real-time Updates**: Live timer updates with proper state management
- **Data Consistency**: Session completion times are locked when "End Session" is pressed
- **Comprehensive Analytics**: Tracks total duration, focused time, paused time, and efficiency

### AI Integration Architecture
- **AWS Bedrock Integration**: Seamless connection to Claude 3 Haiku model
- **Context-Aware Prompting**: AI receives detailed study statistics and patterns
- **Benchmarked Coaching**: AI uses established study habit benchmarks for meaningful feedback
- **Fallback System**: Graceful degradation when AI services are unavailable

### Database Design
- **Optimized Schema**: Efficient MongoDB collections with proper indexing
- **Comprehensive Data Model**: Stores session duration, pause tracking, ratings, and metadata
- **Migration Support**: Backward compatibility for existing data

### User Experience Engineering
- **Navigation Protection**: Prevents accidental session loss during page navigation
- **Consistent UI**: Identical data presentation across completion modal and dashboard
- **Responsive Design**: Optimized for all device sizes and orientations
- **Real-time Feedback**: Immediate visual updates for all user actions

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get current user profile

### Study Sessions
- `POST /sessions/start` - Start a new study session
- `PATCH /sessions/:id` - Update session (pause/resume)
- `POST /sessions/:id/end` - End session with completion data
- `GET /sessions` - Get user's session history
- `POST /sessions/:id/discard` - Discard an active session

### AI Coaching
- `POST /chat` - Send message to AI study coach

## Usage Guide

### Starting Your First Study Session
1. **Register/Login** to your account
2. **Navigate to Study Stopwatch** from the sidebar
3. **Click "Start Session"** to begin timing
4. **Use Pause/Resume** as needed during breaks
5. **Click "End Session"** when finished
6. **Fill out the completion form** with title, notes, and rating
7. **View your session** in the Dashboard with detailed analytics

### Using the AI Study Coach
1. **Navigate to "AI Study Coach"** from the sidebar
2. **Ask questions** about your study habits, techniques, or motivation
3. **Get personalized advice** based on your actual session data
4. **Receive benchmarked feedback** comparing your habits to best practices

### Understanding Your Analytics
- **Total Duration**: Complete session time from start to end
- **Focused Time**: Actual study time (excludes pauses)
- **Paused Time**: Total break time during the session
- **Focus Efficiency**: Percentage of time spent actively studying

## Contributing

This project uses modern development practices:
- TypeScript for type safety
- ESLint and Prettier for code quality
- Modular architecture for maintainability
- Comprehensive error handling
- Real-time state management

## License

This project is licensed under the MIT License.

## Features

### 📚 Study Session Management
- **Study Stopwatch**: Precision timing with start, pause, and resume functionality
- **Real-time Tracking**: Live timer with millisecond accuracy
- **Session Completion**: Detailed forms with title, description, and 5-star ratings
- **Pause Tracking**: Comprehensive monitoring of break time vs focused time
- **Navigation Protection**: Prevents accidental session loss during navigation

### 📊 Analytics & Insights
- **Session History**: Complete dashboard with all past study sessions
- **Detailed Breakdowns**: Shows total duration, focused time, paused time, and efficiency
- **Progress Tracking**: Visual indicators of study patterns and consistency
- **Performance Metrics**: Focus efficiency percentages and session quality ratings

### 🤖 AI Study Coach
- **Personalized Coaching**: AI-powered advice based on your actual study data
- **Pattern Analysis**: Identifies study habits, peak hours, and consistency trends
- **Benchmarked Feedback**: Compares your habits to established study best practices
- **Contextual Recommendations**: Tailored suggestions for improvement
- **Powered by AWS Bedrock**: Uses Claude 3 Haiku for intelligent, conversational coaching

### 🎯 User Experience
- **Clean, Modern UI**: Built with Mantine components for professional appearance
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Intuitive Navigation**: Easy-to-use interface with clear visual feedback
- **Real-time Updates**: Live session tracking with immediate visual feedback
- **Consistent Data**: Session completion modal and dashboard show identical information

### 🔐 Security & Authentication
- **Secure Authentication**: Session-based login with bcrypt password hashing
- **Protected Routes**: Authenticated access to all study features
- **Data Privacy**: Personal study data remains secure and private