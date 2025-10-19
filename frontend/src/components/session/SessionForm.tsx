import React, { useState } from 'react';
import { Modal, TextInput, Textarea, Button, Group, Stack, Text, Paper } from '@mantine/core';
import { StarRating } from '../common/StarRating';

interface SessionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title?: string, description?: string, rating?: number) => void;
  onDiscard: () => void;
  sessionDuration: number;
  pausedDuration?: number;
}

export const SessionForm: React.FC<SessionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDiscard,
  sessionDuration,
  pausedDuration = 0,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState<number>(0);
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
      await onSubmit(
        title.trim() || undefined, 
        description.trim() || undefined,
        rating > 0 ? rating : undefined
      );
      setTitle('');
      setDescription('');
      setRating(0);
      onClose();
    } catch (error) {
      console.error('Failed to save session:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    onDiscard();
    setTitle('');
    setDescription('');
    setRating(0);
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
          {/* Session Summary */}
          <Paper p="md" withBorder radius="md" style={{ backgroundColor: '#f8f9fa' }}>
            <Stack gap="xs">
              <Text size="sm" fw={500} ta="center" c="dimmed">
                Session Summary
              </Text>
              
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Total Duration:</Text>
                <Text size="sm" fw={500}>{formatDuration(sessionDuration + pausedDuration)}</Text>
              </Group>
              
              <Group justify="space-between">
                <Text size="sm" c="green">Time Focused:</Text>
                <Text size="sm" fw={500} c="green">{formatDuration(sessionDuration)}</Text>
              </Group>
              
              <Group justify="space-between">
                <Text size="sm" c="orange">Time Paused:</Text>
                <Text size="sm" fw={500} c="orange">{formatDuration(pausedDuration)}</Text>
              </Group>
              
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Focus Efficiency:</Text>
                <Text size="sm" fw={500}>
                  {sessionDuration + pausedDuration > 0 
                    ? Math.round((sessionDuration / (sessionDuration + pausedDuration)) * 100)
                    : 100}%
                </Text>
              </Group>
            </Stack>
          </Paper>
          
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

          <div>
            <Text size="sm" fw={500} mb="xs" ta="center">
              Rate your session (optional)
            </Text>
            <Group justify="center">
              <StarRating
                value={rating}
                onChange={setRating}
                size={24}
              />
            </Group>
          </div>
          
          <Group justify="space-between" mt="md">
            <Button
              variant="subtle"
              color="red"
              onClick={handleDiscard}
              disabled={isSubmitting}
            >
              Discard Session
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