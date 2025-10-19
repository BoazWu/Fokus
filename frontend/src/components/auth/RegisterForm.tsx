import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
interface RegisterCredentials {
  email: string;
  password: string;
}

interface RegisterFormData extends RegisterCredentials {
  confirmPassword: string;
}

export const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): string | null => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      return 'All fields are required';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }

    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...credentials } = formData;
      await register(credentials);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof RegisterFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="lg">
        {error && (
          <Alert color="red" title="Registration Error">
            {error}
          </Alert>
        )}

        <TextInput
          label="Email"
          placeholder="Enter your email"
          type="email"
          value={formData.email}
          onChange={handleInputChange('email')}
          required
          disabled={isLoading}
          size="md"
        />

        <PasswordInput
          label="Password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleInputChange('password')}
          required
          disabled={isLoading}
          description="Password must be at least 6 characters long"
          size="md"
        />

        <PasswordInput
          label="Confirm Password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleInputChange('confirmPassword')}
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
          Register
        </Button>

        <Text ta="center" size="sm">
          Already have an account?{' '}
          <Anchor component={Link} to="/login">
            Login here
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
};