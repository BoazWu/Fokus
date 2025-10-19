import React from 'react';
import { Container, Paper, Title, Box } from '@mantine/core';
import { RegisterForm } from '../components/auth/RegisterForm';

export const RegisterPage: React.FC = () => {
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
            Create Your Account
          </Title>
          <RegisterForm />
        </Paper>
      </Container>
    </Box>
  );
};