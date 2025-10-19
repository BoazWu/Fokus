import React from 'react';
import { Group, Button, Text, ActionIcon } from '@mantine/core';
import { IconPlayerPlay, IconLogout } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AppHeaderProps {
  showStartTimer?: boolean;
}

// Legacy AppHeader - replaced by AppLayout with AppShell
// Keeping for reference, can be removed once AppLayout is confirmed working
export const AppHeader: React.FC<AppHeaderProps> = ({ showStartTimer = true }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleStartTimer = () => {
    navigate('/timer');
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      borderBottom: '1px solid #e9ecef', 
      padding: '1rem 0',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 1rem' 
      }}>
        <Group justify="space-between" align="center">
          {/* Left side - App title */}
          <Group>
            <Text 
              size="xl" 
              fw={700} 
              c="blue"
              style={{ 
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'opacity 0.2s ease'
              }}
              onClick={handleGoHome}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              title="Go to Dashboard"
            >
              StudyTracker
            </Text>
          </Group>

          {/* Center - Start Timer button */}
          {showStartTimer && (
            <Button
              leftSection={<IconPlayerPlay size={16} />}
              size="md"
              onClick={handleStartTimer}
              color="green"
              variant="filled"
            >
              Start Study Session
            </Button>
          )}

          {/* Right side - User info and logout */}
          <Group gap="md">
            <Text size="sm" c="dimmed">
              {user?.email}
            </Text>
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={handleLogout}
              title="Logout"
            >
              <IconLogout size={16} />
            </ActionIcon>
          </Group>
        </Group>
      </div>
    </div>
  );
};