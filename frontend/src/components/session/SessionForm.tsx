import React, { useState } from 'react';
import { Modal, TextInput, Textarea, Button, Group, Stack } from '@mantine/core';

interface SessionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title?: string, description?: string) => void;
  sessionDuration: number;
}

export const SessionForm: React.FC<SessionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  sessionDuration,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDuration = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(title.trim() || undefined, description.trim() || undefined);
      setTitle('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Failed to save session:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onSubmit();
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title="Session Complete!"
      centered
      closeOnClickOutside={false}
      closeOnEscape={false}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <div>
            <strong>Session Duration:</strong> {formatDuration(sessionDuration)}
          </div>
          
          <TextInput
            label="Session Title (optional)"
            placeholder="What did you study?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          
          <Textarea
            label="Description (optional)"
            placeholder="Add notes about your study session..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            minRows={3}
          />
          
          <Group justify="space-between" mt="md">
            <Button
              variant="subtle"
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              Skip
            </Button>
            
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Save Session
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};