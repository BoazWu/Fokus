import React from 'react';
import { Container, Title, Text } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';
import { AppHeader } from '../components/layout/AppHeader';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <>
      <AppHeader showStartTimer={true} />
      <div style={{ paddingTop: '80px' }}>
        <Container size="lg" mt="xl">
          <Title order={1} mb="md">
            Welcome, {user?.email}
          </Title>
          <Text>
            This is your dashboard. Session tracking components will be implemented in later tasks.
          </Text>
        </Container>
      </div>
    </>
  );
};