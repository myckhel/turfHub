import { router } from '@inertiajs/react';
import { Button, Card, Typography } from 'antd';
import React from 'react';
import { useTurfStore } from '../../stores/turf.store';

const { Text } = Typography;

interface SelectedTurfCardProps {
  /** Custom button text for the action button */
  buttonText?: string;
  /** Button type (primary, default, link, etc.) */
  buttonType?: 'primary' | 'default' | 'link' | 'text' | 'dashed';
  /** Custom description text */
  description?: string;
  /** Additional CSS classes */
  className?: string;
  /** Custom onClick handler for the button */
  onButtonClick?: () => void;
}

const SelectedTurfCard: React.FC<SelectedTurfCardProps> = ({
  buttonText = 'View Turf',
  buttonType = 'primary',
  description = "You're currently playing at this turf",
  className = '',
  onButtonClick,
}) => {
  const { selectedTurf } = useTurfStore();

  if (!selectedTurf) {
    return null;
  }

  const handleButtonClick = () => {
    if (onButtonClick) {
      onButtonClick();
    } else {
      router.visit(route('web.turfs.show', { turf: selectedTurf.id }));
    }
  };

  return (
    <Card className={`my-6 border-green-200 bg-green-50 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <Text strong className="text-green-800">
            Current Turf: {selectedTurf.name}
          </Text>
          <br />
          <Text type="secondary" className="text-green-600">
            {description}
          </Text>
        </div>
        <Button type={buttonType} onClick={handleButtonClick}>
          {buttonText}
        </Button>
      </div>
    </Card>
  );
};

export default SelectedTurfCard;
