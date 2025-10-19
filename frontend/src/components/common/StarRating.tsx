import React from 'react';
import { Group, ActionIcon } from '@mantine/core';
import { IconStar, IconStarFilled } from '@tabler/icons-react';

interface StarRatingProps {
  value?: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: number;
  color?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  value = 0,
  onChange,
  readonly = false,
  size = 20,
  color = 'yellow',
}) => {
  const handleStarClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  return (
    <Group gap="xs">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= value;
        const StarIcon = isFilled ? IconStarFilled : IconStar;
        
        if (readonly) {
          return (
            <StarIcon
              key={star}
              size={size}
              color={isFilled ? `var(--mantine-color-${color}-6)` : 'var(--mantine-color-gray-4)'}
              style={{ cursor: 'default' }}
            />
          );
        }

        return (
          <ActionIcon
            key={star}
            variant="transparent"
            size="sm"
            onClick={() => handleStarClick(star)}
            style={{ cursor: 'pointer' }}
          >
            <StarIcon
              size={size}
              color={isFilled ? `var(--mantine-color-${color}-6)` : 'var(--mantine-color-gray-4)'}
            />
          </ActionIcon>
        );
      })}
    </Group>
  );
};