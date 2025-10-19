import React, { useState, useEffect, useRef } from 'react';
import { Container, Title, Text, Button, Group, Stack, Paper, Alert } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause, IconPlayerStop } from '@tabler/icons-react';
import { sessionService } from '../../services/sessionService';

interface StudyTimerProps {
  onSessionStart?: (sessionId: string) => void;
  onSessionEnd?: (sessionId: string, duration: number) => void;
  onSessionUpdate?: (sessionId: string, duration: number, status: 'active' | 'paused') => void;
}

type TimerStatus = 'idle' | 'active' | 'paused' | 'completed';
type NetworkStatus = 'online' | 'offline' | 'syncing';

export const StudyTimer: React.FC<StudyTimerProps> = ({
  onSessionStart,
  onSessionEnd,
  onSessionUpdate,
}) => {
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [elapsedTime, setElapsedTime] = useState(0); // in milliseconds
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pausedDuration, setPausedDuration] = useState(0); // total time paused
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('online');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);
  
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pauseStartRef = useRef<number | null>(null);
  const pendingUpdatesRef = useRef<Array<{ sessionId: string; updates: any; timestamp: number }>>([]);

  // Format time for display (HH:MM:SS)
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Check network connectivity
  const checkNetworkStatus = () => {
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');
  };

  // Sync pending updates when back online
  const syncPendingUpdates = async () => {
    if (pendingUpdatesRef.current.length === 0) return;
    
    setNetworkStatus('syncing');
    
    try {
      for (const update of pendingUpdatesRef.current) {
        await sessionService.updateSession(update.sessionId, update.updates);
      }
      pendingUpdatesRef.current = [];
      setNetworkStatus('online');
    } catch (error) {
      console.error('Failed to sync pending updates:', error);
      setNetworkStatus('offline');
    }
  };

  // Handle API calls with offline support
  const handleApiCall = async <T,>(
    apiCall: () => Promise<T>,
    fallbackData?: any,
    showOfflineAlert: boolean = false
  ): Promise<T | null> => {
    try {
      setError(null);
      const result = await apiCall();
      setNetworkStatus('online');
      setShowOfflineWarning(false);
      return result;
    } catch (error) {
      console.error('API call failed:', error);
      
      // Only show error for critical operations
      if (showOfflineAlert) {
        setError(error instanceof Error ? error.message : 'Network error occurred');
        setNetworkStatus('offline');
        setShowOfflineWarning(true);
      }
      
      if (fallbackData) {
        return fallbackData;
      }
      return null;
    }
  };

  // Start the timer interval
  const startInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current && status === 'active') {
        const now = Date.now();
        const newElapsedTime = now - startTimeRef.current - pausedDuration;
        setElapsedTime(newElapsedTime);
        
        // Update session every 30 seconds when active and online (silently)
        if (sessionId && newElapsedTime % 30000 < 1000) {
          if (networkStatus === 'online' && !sessionId.startsWith('offline_')) {
            handleApiCall(() => sessionService.updateSession(sessionId, { 
              status: 'active',
              pausedDuration 
            }), null, false); // Don't show offline alerts for periodic updates
          }
          
          if (onSessionUpdate) {
            onSessionUpdate(sessionId, newElapsedTime, 'active');
          }
        }
      }
    }, 1000);
  };

  // Stop the timer interval
  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Start a new study session
  const handleStart = async () => {
    setIsLoading(true);
    setError(null);
    setShowOfflineWarning(false);
    
    // Always start the timer locally first for immediate feedback
    const now = Date.now();
    startTimeRef.current = now;
    setPausedDuration(0);
    setElapsedTime(0);
    setStatus('active');
    
    // Try to create session on backend, but don't block the timer
    const result = await handleApiCall(() => sessionService.startSession(), null, false);
    
    if (result) {
      // Backend session created successfully
      setSessionId(result._id);
      if (onSessionStart) {
        onSessionStart(result._id);
      }
    } else {
      // Use local session - will be handled when session ends
      const tempSessionId = `offline_${now}`;
      setSessionId(tempSessionId);
      if (onSessionStart) {
        onSessionStart(tempSessionId);
      }
    }
    
    setIsLoading(false);
  };

  // Pause the current session
  const handlePause = async () => {
    if (!sessionId) return;
    
    if (status === 'active') {
      pauseStartRef.current = Date.now();
      setStatus('paused');
      stopInterval();
      
      // Update backend (silently)
      const updates = { status: 'paused' as const, pausedDuration };
      if (networkStatus === 'online' && !sessionId.startsWith('offline_')) {
        await handleApiCall(() => sessionService.updateSession(sessionId, updates), null, false);
      } else if (sessionId.startsWith('offline_')) {
        // Store for later sync when session ends
        pendingUpdatesRef.current.push({
          sessionId,
          updates,
          timestamp: Date.now()
        });
      }
      
      if (onSessionUpdate) {
        onSessionUpdate(sessionId, elapsedTime, 'paused');
      }
    } else if (status === 'paused') {
      // Resume from pause
      if (pauseStartRef.current) {
        const pauseDuration = Date.now() - pauseStartRef.current;
        setPausedDuration(prev => prev + pauseDuration);
        pauseStartRef.current = null;
      }
      setStatus('active');
      
      // Update backend (silently)
      const updates = { status: 'active' as const, pausedDuration };
      if (networkStatus === 'online' && !sessionId.startsWith('offline_')) {
        await handleApiCall(() => sessionService.updateSession(sessionId, updates), null, false);
      } else if (sessionId.startsWith('offline_')) {
        // Store for later sync when session ends
        pendingUpdatesRef.current.push({
          sessionId,
          updates,
          timestamp: Date.now()
        });
      }
      
      if (onSessionUpdate) {
        onSessionUpdate(sessionId, elapsedTime, 'active');
      }
    }
  };

  // End the current session
  const handleEnd = async () => {
    if (!sessionId) return;
    
    if (status === 'paused' && pauseStartRef.current) {
      // If ending while paused, add the final pause duration
      const pauseDuration = Date.now() - pauseStartRef.current;
      setPausedDuration(prev => prev + pauseDuration);
    }
    
    setStatus('completed');
    stopInterval();
    
    // Trigger the session end callback - TimerPage will handle showing the form
    if (onSessionEnd) {
      onSessionEnd(sessionId, elapsedTime);
    }
  };

  // Reset to start a new session
  const handleReset = () => {
    setStatus('idle');
    setElapsedTime(0);
    setPausedDuration(0);
    setSessionId(null);
    startTimeRef.current = null;
    pauseStartRef.current = null;
    stopInterval();
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      stopInterval();
    };
  }, []);

  // Update interval when status changes
  useEffect(() => {
    if (status === 'active') {
      startInterval();
    } else {
      stopInterval();
    }
  }, [status]);

  // Monitor network status
  useEffect(() => {
    checkNetworkStatus();
    
    const handleOnline = () => {
      setNetworkStatus('online');
      syncPendingUpdates();
    };
    
    const handleOffline = () => {
      setNetworkStatus('offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (networkStatus === 'online' && pendingUpdatesRef.current.length > 0) {
      syncPendingUpdates();
    }
  }, [networkStatus]);

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Ready to start studying';
      case 'active':
        return 'Study session in progress';
      case 'paused':
        return 'Study session paused';
      case 'completed':
        return 'Study session completed!';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'green';
      case 'paused':
        return 'yellow';
      case 'completed':
        return 'blue';
      default:
        return 'gray';
    }
  };

  return (
    <Container size="sm" mt="xl">
      <Stack align="center" gap="xl">
        <Title order={1} ta="center">
          Study Timer
        </Title>
        
        {/* Error Alert */}
        {error && (
          <Alert color="red" title="Error" onClose={() => setError(null)} withCloseButton>
            {error}
          </Alert>
        )}
        
        {/* Offline Warning - only show when there's an actual issue */}
        {showOfflineWarning && (
          <Alert color="yellow" title="Connection Issue">
            Unable to save session to server. Your session data is being tracked locally.
          </Alert>
        )}
        
        <Paper p="xl" radius="md" shadow="sm" w="100%" maw={400}>
          <Stack align="center" gap="lg">
            {/* Timer Display */}
            <Text
              size="4rem"
              fw={700}
              ta="center"
              c={getStatusColor()}
              style={{ fontFamily: 'monospace', lineHeight: 1 }}
            >
              {formatTime(elapsedTime)}
            </Text>
            
            {/* Status Text */}
            <Text size="lg" ta="center" c={getStatusColor()}>
              {getStatusText()}
            </Text>
            
            {/* Control Buttons */}
            <Group justify="center" gap="md">
              {status === 'idle' && (
                <Button
                  leftSection={<IconPlayerPlay size={16} />}
                  size="lg"
                  onClick={handleStart}
                  color="green"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Start Session
                </Button>
              )}
              
              {(status === 'active' || status === 'paused') && (
                <>
                  <Button
                    leftSection={status === 'active' ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
                    size="lg"
                    onClick={handlePause}
                    color={status === 'active' ? 'yellow' : 'green'}
                    variant={status === 'active' ? 'filled' : 'outline'}
                  >
                    {status === 'active' ? 'Pause' : 'Resume'}
                  </Button>
                  
                  <Button
                    leftSection={<IconPlayerStop size={16} />}
                    size="lg"
                    onClick={handleEnd}
                    color="red"
                    variant="outline"
                  >
                    End Session
                  </Button>
                </>
              )}
              
              {status === 'completed' && (
                <Button
                  leftSection={<IconPlayerPlay size={16} />}
                  size="lg"
                  onClick={handleReset}
                  color="blue"
                >
                  Start New Session
                </Button>
              )}
            </Group>
          </Stack>
        </Paper>
        

      </Stack>
    </Container>
  );
};