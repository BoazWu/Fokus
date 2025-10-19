import React from 'react';
import { Container, Paper, Title, Box } from '@mantine/core';
import { LoginForm } from '../components/auth/LoginForm';

export const LoginPage: React.FC = () => {
  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        minWidth: '100vw'
      }}
    >
      <Container size="md" w="100%" maw={500}>
        <Paper shadow="lg" p="xl" radius="lg" withBorder>
          <Title order={1} ta="center" mb="xl" c="blue">
            Login to Study Tracker
          </Title>
          <LoginForm />
        </Paper>
      </Container>
    </Box>
  );
};