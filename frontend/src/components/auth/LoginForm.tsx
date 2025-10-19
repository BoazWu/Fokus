import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Alert,
  Text,
  Anchor,
} from '@mantine/core';
import { useAuth } from '../../contexts/AuthContext';

// Define types inline to avoid module resolution issues
interface LoginCredentials {
  email: string;
  password: string;
}

export const LoginForm: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination from location state, default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(credentials);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginCredentials) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="lg">
        {error && (
          <Alert color="red" title="Login Error">
            {error}
          </Alert>
        )}

        <TextInput
          label="Email"
          placeholder="Enter your email"
          type="email"
          value={credentials.email}
          onChange={handleInputChange('email')}
          required
          disabled={isLoading}
          size="md"
        />

        <PasswordInput
          label="Password"
          placeholder="Enter your password"
          value={credentials.password}
          onChange={handleInputChange('password')}
          required
          disabled={isLoading}
          size="md"
        />

        <Button
          type="submit"
          loading={isLoading}
          fullWidth
          mt="lg"
          size="md"
        >
          Login
        </Button>

        <Text ta="center" size="sm">
          Don't have an account?{' '}
          <Anchor component={Link} to="/register">
            Register here
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
};