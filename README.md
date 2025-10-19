# Study Tracker App

A web application for tracking study sessions, similar to how Strava tracks athletic activities.

## Project Structure

```
├── frontend/          # React TypeScript frontend with Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/      # Authentication components
│   │   │   ├── session/   # Study session components
│   │   │   └── layout/    # Layout components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript type definitions
│   └── package.json
├── backend/           # NestJS backend
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── users/         # Users module
│   │   ├── sessions/      # Study sessions module
│   │   ├── schemas/       # Mongoose schemas
│   │   └── common/        # Shared utilities
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

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local instance)

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

## Features

- User authentication (register/login)
- Real-time study session tracking
- Session history and progress tracking
- Clean, modern UI with Mantine components
- Responsive design for all devices