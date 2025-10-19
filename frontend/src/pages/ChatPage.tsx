import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Paper,
  Text,
  TextInput,
  Button,
  Stack,
  Group,
  ScrollArea,
  Loader,
  Alert,
  ActionIcon,
} from '@mantine/core';
import { IconSend, IconRobot, IconUser, IconInfoCircle } from '@tabler/icons-react';
import { chatService, type ChatMessage } from '../services/chatService';

export const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatService.sendMessage(
        userMessage.content,
        messages // Send conversation history
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date(response.timestamp),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Container size="md" h="100%">
      <Stack h="100%" gap="md">
        {/* Header */}
        <Paper p="md" withBorder>
          <Group gap="sm">
            <IconRobot size={24} color="blue" />
            <div>
              <Text size="lg" fw={600}>
                AI Study Coach
              </Text>
              <Text size="sm" c="dimmed">
                Get personalized study advice based on your session data
              </Text>
            </div>
          </Group>
        </Paper>

        {/* Info Alert */}
        {messages.length === 0 && (
          <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
            <Text size="sm">
              Hi! I'm your AI study coach. I can help you with study techniques, time management, 
              and motivation based on your actual study session data. Ask me anything about improving 
              your study habits!
            </Text>
          </Alert>
        )}

        {/* Messages */}
        <Paper withBorder flex={1} style={{ display: 'flex', flexDirection: 'column' }}>
          <ScrollArea
            flex={1}
            p="md"
            viewportRef={scrollAreaRef}
            style={{ minHeight: '400px' }}
          >
            <Stack gap="md">
              {messages.map((message, index) => (
                <Group
                  key={index}
                  align="flex-start"
                  gap="sm"
                  style={{
                    flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  }}
                >
                  <ActionIcon
                    variant="light"
                    color={message.role === 'user' ? 'blue' : 'green'}
                    size="sm"
                  >
                    {message.role === 'user' ? (
                      <IconUser size={16} />
                    ) : (
                      <IconRobot size={16} />
                    )}
                  </ActionIcon>
                  
                  <Paper
                    p="sm"
                    withBorder
                    style={{
                      maxWidth: '80%',
                      backgroundColor: message.role === 'user' ? '#e3f2fd' : '#f5f5f5',
                    }}
                  >
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Text>
                    <Text size="xs" c="dimmed" mt="xs">
                      {formatTime(message.timestamp)}
                    </Text>
                  </Paper>
                </Group>
              ))}
              
              {isLoading && (
                <Group align="flex-start" gap="sm">
                  <ActionIcon variant="light" color="green" size="sm">
                    <IconRobot size={16} />
                  </ActionIcon>
                  <Paper p="sm" withBorder style={{ backgroundColor: '#f5f5f5' }}>
                    <Group gap="xs">
                      <Loader size="xs" />
                      <Text size="sm" c="dimmed">
                        AI is thinking...
                      </Text>
                    </Group>
                  </Paper>
                </Group>
              )}
            </Stack>
          </ScrollArea>

          {/* Error Display */}
          {error && (
            <Alert color="red" variant="light" m="md">
              {error}
            </Alert>
          )}

          {/* Input */}
          <Paper p="md" style={{ borderTop: '1px solid #e9ecef' }}>
            <Group gap="sm">
              <TextInput
                ref={inputRef}
                flex={1}
                placeholder="Ask me about your study habits..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                leftSection={<IconSend size={16} />}
              >
                Send
              </Button>
            </Group>
          </Paper>
        </Paper>
      </Stack>
    </Container>
  );
};