import React from 'react';
import { Card, Text, Group, Badge, Stack } from '@mantine/core';
import { IconClock, IconCalendar, IconPlayerPause } from '@tabler/icons-react';
import { StarRating } from '../common/StarRating';
import type { StudySession } from '../../types';

interface SessionCardProps {
  session: StudySession;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session }) => {
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="sm">
        {/* Header with title and rating */}
        <Group justify="space-between" align="flex-start">
          <Text fw={500} size="lg" style={{ flex: 1 }}>
            {session.title}
          </Text>
          {session.rating && (
            <StarRating value={session.rating} readonly size={16} />
          )}
        </Group>

        {/* Description if available */}
        {session.description && (
          <Text size="sm" c="dimmed" lineClamp={2}>
            {session.description}
          </Text>
        )}

        {/* Duration and date info */}
        <Group gap="lg" wrap="wrap">
          <Group gap="xs">
            <IconClock size={16} color="var(--mantine-color-dimmed)" />
            <Text size="sm" c="dimmed">
              {formatDuration(session.duration)} total
            </Text>
          </Group>
          
          <Group gap="xs">
            <IconClock size={16} color="var(--mantine-color-green-6)" />
            <Text size="sm" c="green" fw={500}>
              {formatDuration(session.duration - (session.pausedDuration || 0))} focused
            </Text>
          </Group>
          
          <Group gap="xs">
            <IconPlayerPause size={16} color="var(--mantine-color-orange-6)" />
            <Text size="sm" c="orange">
              {formatDuration(session.pausedDuration || 0)} paused
            </Text>
          </Group>
          
          <Group gap="xs">
            <IconCalendar size={16} color="var(--mantine-color-dimmed)" />
            <Text size="sm" c="dimmed">
              {formatDate(session.startTime)}
            </Text>
          </Group>
        </Group>
      </Stack>
    </Card>
  );
};