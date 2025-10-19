import React, { useState, useEffect, useRef } from 'react';
import { Container, Title, Text, Button, Group, Stack, Paper, Alert, Modal } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause, IconPlayerStop, IconAlertTriangle } from '@tabler/icons-react';
import { useBlocker } from 'react-router-dom';
import { sessionService } from '../../services/sessionService';

interface StudyTimerProps {
  onSessionStart?: (sessionId: string) => void;
  onSessionEnd?: (sessionId: string, duration: number, pausedDuration: number) => void;
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
  const [currentPauseDuration, setCurrentPauseDuration] = useState(0); // current pause session duration
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('online');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);


  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pauseStartRef = useRef<number | null>(null);
  const pendingUpdatesRef = useRef<Array<{ sessionId: string; updates: any; timestamp: number }>>([]);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const statusRef = useRef<TimerStatus>('idle');
  const sessionIdRef = useRef<string | null>(null);

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
      if (startTimeRef.current && statusRef.current === 'active') {
        const now = Date.now();
        const newElapsedTime = now - startTimeRef.current - pausedDuration;
        setElapsedTime(newElapsedTime);

        // Update session every 30 seconds when active and online (silently)
        if (sessionIdRef.current && newElapsedTime % 30000 < 1000) {
          if (networkStatus === 'online' && !sessionIdRef.current.startsWith('offline_')) {
            handleApiCall(() => sessionService.updateSession(sessionIdRef.current!, {
              status: 'active',
              pausedDuration
            }), null, false); // Don't show offline alerts for periodic updates
          }

          if (onSessionUpdate) {
            onSessionUpdate(sessionIdRef.current, newElapsedTime, 'active');
          }
        }
      } else if (statusRef.current === 'paused' && pauseStartRef.current) {
        // Update current pause duration while paused
        const now = Date.now();
        const currentPause = now - pauseStartRef.current;
        setCurrentPauseDuration(currentPause);
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
    setCurrentPauseDuration(0);
    setElapsedTime(0);
    setStatus('active');

    // Try to create session on backend
    try {
      const result = await sessionService.startSession();
      
      // Backend session created successfully
      setSessionId(result._id);
      if (onSessionStart) {
        onSessionStart(result._id);
      }
    } catch (error) {
      // Check if the error is about having an active session
      if (error instanceof Error && error.message.includes('User already has an active session')) {
        try {
          // Clear the existing active session and retry
          await sessionService.clearActiveSession();
          const result = await sessionService.startSession();
          
          // Backend session created successfully after clearing
          setSessionId(result._id);
          if (onSessionStart) {
            onSessionStart(result._id);
          }
        } catch (retryError) {
          console.error('Failed to start session after clearing active session:', retryError);
          // Fall back to offline session
          const tempSessionId = `offline_${now}`;
          setSessionId(tempSessionId);
          if (onSessionStart) {
            onSessionStart(tempSessionId);
          }
        }
      } else {
        console.error('Failed to start session:', error);
        // Fall back to offline session for other errors
        const tempSessionId = `offline_${now}`;
        setSessionId(tempSessionId);
        if (onSessionStart) {
          onSessionStart(tempSessionId);
        }
      }
    }

    setIsLoading(false);
  };

  // Pause the current session
  const handlePause = async () => {
    if (!sessionId) return;

    if (status === 'active') {
      pauseStartRef.current = Date.now();
      setCurrentPauseDuration(0); // Reset current pause timer
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
      let newPausedDuration = pausedDuration;
      if (pauseStartRef.current) {
        const pauseDuration = Date.now() - pauseStartRef.current;
        newPausedDuration = pausedDuration + pauseDuration;
        setPausedDuration(newPausedDuration);
        pauseStartRef.current = null;
      }
      setCurrentPauseDuration(0); // Reset current pause timer
      setStatus('active');

      // Update backend (silently) - use the NEW pausedDuration
      const updates = { status: 'active' as const, pausedDuration: newPausedDuration };
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

    // Calculate final elapsed time at the exact moment of ending
    const endTime = Date.now();
    let finalPausedDuration = pausedDuration;
    
    if (status === 'paused' && pauseStartRef.current) {
      // If ending while paused, add the final pause duration
      const pauseDuration = endTime - pauseStartRef.current;
      finalPausedDuration = pausedDuration + pauseDuration;
      setPausedDuration(finalPausedDuration);
      
      // Update backend with final paused duration before ending
      if (networkStatus === 'online' && !sessionId.startsWith('offline_')) {
        try {
          await sessionService.updateSession(sessionId, {
            status: 'paused',
            pausedDuration: finalPausedDuration
          });
        } catch (error) {
          console.error('Failed to update final paused duration:', error);
        }
      }
    }

    // Calculate the final elapsed time (focused time) at the moment of ending
    const finalElapsedTime = startTimeRef.current 
      ? endTime - startTimeRef.current - finalPausedDuration 
      : elapsedTime;

    setStatus('completed');
    stopInterval();

    // Trigger the session end callback with the final calculated time
    if (onSessionEnd) {
      onSessionEnd(sessionId, finalElapsedTime, finalPausedDuration);
    }
  };

  // Handle navigation confirmation
  const handleConfirmNavigation = async () => {
    setShowNavigationWarning(false);

    // Calculate final paused duration if currently paused
    let finalPausedDuration = pausedDuration;
    if (status === 'paused' && pauseStartRef.current) {
      const pauseDuration = Date.now() - pauseStartRef.current;
      finalPausedDuration = pausedDuration + pauseDuration;
      
      // Update backend with final paused duration first
      if (sessionId && !sessionId.startsWith('offline_')) {
        try {
          await sessionService.updateSession(sessionId, {
            status: 'paused',
            pausedDuration: finalPausedDuration
          });
        } catch (error) {
          console.error('Failed to update final paused duration during navigation:', error);
        }
      }
    }

    // Directly end the session in the backend when user confirms navigation
    if (sessionId && !sessionId.startsWith('offline_')) {
      try {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const defaultTitle = `Study session ended at ${timeString}`;

        await sessionService.endSession(sessionId, {
          title: defaultTitle,
          description: 'Session ended when navigating to another page'
        });
      } catch (error) {
        console.error('Failed to end session during navigation:', error);
      }
    }

    // Update local state
    setStatus('completed');
    stopInterval();

    // Then proceed with navigation
    if (pendingNavigationRef.current) {
      pendingNavigationRef.current();
      pendingNavigationRef.current = null;
    }
  };

  const handleCancelNavigation = () => {
    setShowNavigationWarning(false);
    pendingNavigationRef.current = null;
  };

  // Reset to start a new session
  const handleReset = () => {
    setStatus('idle');
    setElapsedTime(0);
    setPausedDuration(0);
    setCurrentPauseDuration(0);
    setSessionId(null);
    startTimeRef.current = null;
    pauseStartRef.current = null;
    stopInterval();
  };

  // Block navigation when session is active and show confirmation
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      (status === 'active' || status === 'paused') &&
      currentLocation.pathname !== nextLocation.pathname
  );

  // Handle blocked navigation
  useEffect(() => {
    if (blocker.state === 'blocked') {
      pendingNavigationRef.current = () => blocker.proceed();
      setShowNavigationWarning(true);
    }
  }, [blocker]);

  // Keep refs in sync with state
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Cleanup interval on unmount and auto-end session
  useEffect(() => {
    return () => {
      // Auto-end session when component unmounts (user navigates away)
      // Use refs to get current values without causing effect to re-run
      if ((statusRef.current === 'active' || statusRef.current === 'paused') && sessionIdRef.current) {
        // Directly end the session in the backend when unmounting
        // This ensures paused sessions are marked as completed when user exits
        const sessionId = sessionIdRef.current;
        if (!sessionId.startsWith('offline_')) {
          // Generate a default title for auto-ended sessions
          const now = new Date();
          const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const defaultTitle = `Study session ended at ${timeString}`;

          // Call the API directly without waiting for the response
          // Note: The backend will handle calculating the final duration correctly
          sessionService.endSession(sessionId, {
            title: defaultTitle,
            description: 'Session ended automatically when leaving the page'
          }).catch(error => {
            console.error('Failed to auto-end session:', error);
          });
        }
      }
      stopInterval();
    };
  }, []); // Empty dependency array - only runs on mount/unmount

  // Update interval when status changes
  useEffect(() => {
    if (status === 'active' || status === 'paused') {
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

  const formatPauseDuration = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Ready to start studying';
      case 'active':
        return 'Study session in progress';
      case 'paused':
        return `Study session paused (${formatPauseDuration(currentPauseDuration)})`;
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
    <Container size="sm" style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '30vh' }}>
      <Stack align="center" gap="xl" w="100%">
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

        {/* Navigation Warning Modal */}
        <Modal
          opened={showNavigationWarning}
          onClose={handleCancelNavigation}
          title="End Study Session?"
          centered
          size="sm"
        >
          <Stack gap="md">
            <Group gap="sm">
              <IconAlertTriangle size={20} color="orange" />
              <Text>
                You have an active study session running. If you leave this page, your session will be ended automatically.
              </Text>
            </Group>

            <Text size="sm" c="dimmed">
              Current session time: {formatTime(elapsedTime)}
            </Text>

            <Group justify="flex-end" gap="sm">
              <Button variant="outline" onClick={handleCancelNavigation}>
                Stay Here
              </Button>
              <Button color="orange" onClick={handleConfirmNavigation}>
                End Session & Leave
              </Button>
            </Group>
          </Stack>
        </Modal>

      </Stack>
    </Container>
  );
};