import React from 'react';
import { Container, Title, Stack } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';
import { AppHeader } from '../components/layout/AppHeader';
import { SessionsList } from '../components/session/SessionsList';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <>
      <AppHeader showStartTimer={true} />
      <div style={{ paddingTop: '80px' }}>
        <Container size="lg" mt="xl">
          <Stack gap="xl">
            <Title order={1}>
              Welcome back, {user?.email?.split('@')[0]}!
            </Title>
            
            <SessionsList />
          </Stack>
        </Container>
      </div>
    </>
  );
};