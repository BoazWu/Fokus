import React from 'react';
import { AppShell, Group, Text, Button, ActionIcon, Burger } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlayerPlay, IconLogout, IconDashboard, IconClock, IconMessageCircle } from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
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

  const isTimerPage = location.pathname === '/timer';

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          {/* Left side - Burger menu and app title */}
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
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
              Fokus
            </Text>
          </Group>

          {/* Center - Start Timer button (only show on dashboard) */}
          {!isTimerPage && (
            <Button
              leftSection={<IconPlayerPlay size={16} />}
              size="md"
              onClick={handleStartTimer}
              color="green"
              variant="filled"
              visibleFrom="sm"
            >
              Start Study Session
            </Button>
          )}

          {/* Right side - User info and logout */}
          <Group gap="md">
            <Text size="sm" c="dimmed" visibleFrom="xs">
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
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Group>
          <Text fw={500} size="sm" c="dimmed">
            Navigation
          </Text>
        </Group>
        
        <Button
          variant={location.pathname === '/dashboard' ? 'filled' : 'subtle'}
          leftSection={<IconDashboard size={16} />}
          justify="flex-start"
          fullWidth
          mt="md"
          onClick={handleGoHome}
        >
          Dashboard
        </Button>
        
        <Button
          variant={location.pathname === '/timer' ? 'filled' : 'subtle'}
          leftSection={<IconClock size={16} />}
          justify="flex-start"
          fullWidth
          mt="xs"
          onClick={handleStartTimer}
        >
          Study Stopwatch
        </Button>
        
        <Button
          variant={location.pathname === '/chat' ? 'filled' : 'subtle'}
          leftSection={<IconMessageCircle size={16} />}
          justify="flex-start"
          fullWidth
          mt="xs"
          onClick={() => navigate('/chat')}
        >
          AI Study Coach
        </Button>
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
};