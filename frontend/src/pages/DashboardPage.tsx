import React from 'react';
import { Container, Title, Stack } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';
import { SessionsList } from '../components/session/SessionsList';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <Container size="lg">
      <Stack gap="xl">
        <Title order={1}>
          Welcome back, {user?.email?.split('@')[0]}!
        </Title>
        
        <SessionsList />
      </Stack>
    </Container>
  );
};