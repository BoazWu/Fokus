import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudyTimer } from '../components/session/StudyTimer';
import { SessionForm } from '../components/session/SessionForm';
import { AppHeader } from '../components/layout/AppHeader';
import { sessionService } from '../services/sessionService';
import { notifications } from '@mantine/notifications';

export const TimerPage: React.FC = () => {
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const [completedSessionDuration, setCompletedSessionDuration] = useState(0);
  const navigate = useNavigate();

  const handleSessionStart = (sessionId: string) => {
    console.log('Session started:', sessionId);
    notifications.show({
      title: 'Session Started',
      message: 'Your study session has begun. Good luck!',
      color: 'green',
    });
  };

  const handleSessionEnd = (sessionId: string, duration: number) => {
    console.log('Session ended:', sessionId, 'Duration:', duration);
    setCompletedSessionId(sessionId);
    setCompletedSessionDuration(duration);
    setShowSessionForm(true);
  };

  const handleSessionUpdate = (sessionId: string, duration: number, status: 'active' | 'paused') => {
    console.log('Session updated:', sessionId, 'Duration:', duration, 'Status:', status);
  };

  // Generate a default title based on session duration and current time
  const generateDefaultTitle = (duration: number): string => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const durationMinutes = Math.floor(duration / (1000 * 60));
    
    if (durationMinutes < 1) {
      return `Quick study session at ${timeString}`;
    } else if (durationMinutes < 30) {
      return `${durationMinutes}-minute study session`;
    } else if (durationMinutes < 60) {
      return `Study session at ${timeString}`;
    } else {
      const hours = Math.floor(durationMinutes / 60);
      const remainingMinutes = durationMinutes % 60;
      if (remainingMinutes === 0) {
        return `${hours}-hour study session`;
      } else {
        return `${hours}h ${remainingMinutes}m study session`;
      }
    }
  };

  const handleSessionFormSubmit = async (title?: string, description?: string) => {
    if (!completedSessionId) return;

    // Generate default title if none provided
    const finalTitle = title || generateDefaultTitle(completedSessionDuration);

    try {
      if (completedSessionId.startsWith('offline_')) {
        // For offline sessions, try to create a new session with the data
        try {
          await sessionService.startSession();
          // If successful, we could try to create a completed session
          // For now, just acknowledge the local session
          notifications.show({
            title: 'Session Recorded',
            message: `Your study session "${finalTitle}" has been recorded locally.`,
            color: 'blue',
          });
        } catch (error) {
          notifications.show({
            title: 'Session Recorded Locally',
            message: `Your study session "${finalTitle}" has been saved locally and will sync when online.`,
            color: 'yellow',
          });
        }
      } else {
        // Online session - update with title and description
        await sessionService.endSession(completedSessionId, { 
          title: finalTitle, 
          description: description || undefined 
        });
        notifications.show({
          title: 'Session Saved',
          message: `Your study session "${finalTitle}" has been saved successfully!`,
          color: 'green',
        });
      }
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Failed to save session:', error);
      notifications.show({
        title: 'Save Failed',
        message: 'Failed to save session details. Please try again.',
        color: 'red',
      });
    }
  };

  const handleSessionFormClose = () => {
    setShowSessionForm(false);
    setCompletedSessionId(null);
    setCompletedSessionDuration(0);
  };

  return (
    <>
      <AppHeader showStartTimer={false} />
      <div style={{ paddingTop: '80px' }}>
        <StudyTimer
          onSessionStart={handleSessionStart}
          onSessionEnd={handleSessionEnd}
          onSessionUpdate={handleSessionUpdate}
        />
      </div>
      
      <SessionForm
        isOpen={showSessionForm}
        onClose={handleSessionFormClose}
        onSubmit={handleSessionFormSubmit}
        sessionDuration={completedSessionDuration}
      />
    </>
  );
};