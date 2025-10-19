import React, { useState, useEffect } from 'react';
import { Stack, Text, Loader, Center, Alert, Pagination, Group } from '@mantine/core';
import { IconInfoCircle, IconBook } from '@tabler/icons-react';
import { SessionCard } from './SessionCard';
import { sessionService } from '../../services/sessionService';
import type { StudySession } from '../../types';

interface SessionsListProps {
  refreshTrigger?: number; // Optional prop to trigger refresh from parent
}

export const SessionsList: React.FC<SessionsListProps> = ({ refreshTrigger }) => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  const sessionsPerPage = 10;

  const fetchSessions = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await sessionService.getUserSessions(page, sessionsPerPage);
      setSessions(response.sessions);
      setTotalPages(response.totalPages);
      setTotal(response.total);
      
      // If current page exceeds total pages, reset to page 1
      if (page > response.totalPages && response.totalPages > 0) {
        setCurrentPage(1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions(currentPage);
  }, [currentPage, refreshTrigger]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <Center py="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading your study sessions...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Alert 
        icon={<IconInfoCircle size={16} />} 
        title="Error loading sessions" 
        color="red"
        variant="light"
      >
        {error}
      </Alert>
    );
  }

  if (sessions.length === 0) {
    return (
      <Center py="xl">
        <Stack align="center" gap="md" maw={400}>
          <IconBook size={64} color="var(--mantine-color-dimmed)" />
          <Text size="xl" fw={500} ta="center">
            No study sessions yet
          </Text>
          <Text c="dimmed" ta="center">
            Start your first study session to begin tracking your learning progress. 
            Click the "Start Study Session" button above to get started!
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      {/* Sessions count */}
      <Group justify="space-between" align="center">
        <Text size="lg" fw={500}>
          Your Study Sessions
        </Text>
        <Text size="sm" c="dimmed">
          {total} session{total !== 1 ? 's' : ''} total
        </Text>
      </Group>

      {/* Sessions list */}
      <Stack gap="md">
        {sessions.map((session) => (
          <SessionCard key={session._id} session={session} />
        ))}
      </Stack>

      {/* Pagination */}
      {totalPages > 1 && (
        <Center mt="xl">
          <Pagination
            value={currentPage}
            onChange={handlePageChange}
            total={totalPages}
            size="md"
            withEdges
          />
        </Center>
      )}
    </Stack>
  );
};