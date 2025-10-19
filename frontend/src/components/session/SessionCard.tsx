import React from 'react';
import { Card, Text, Group, Badge, Stack } from '@mantine/core';
import { IconClock, IconCalendar } from '@tabler/icons-react';
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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'active':
        return 'blue';
      case 'paused':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="sm">
        {/* Header with title and status */}
        <Group justify="space-between" align="flex-start">
          <Text fw={500} size="lg" style={{ flex: 1 }}>
            {session.title}
          </Text>
          <Badge color={getStatusColor(session.status)} variant="light">
            {session.status}
          </Badge>
        </Group>

        {/* Description if available */}
        {session.description && (
          <Text size="sm" c="dimmed" lineClamp={2}>
            {session.description}
          </Text>
        )}

        {/* Duration and date info */}
        <Group gap="lg">
          <Group gap="xs">
            <IconClock size={16} color="var(--mantine-color-dimmed)" />
            <Text size="sm" c="dimmed">
              {formatDuration(session.duration)}
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