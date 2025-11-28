import { ClockCircleOutlined } from '@ant-design/icons';
import { Tag } from 'antd';
import { memo } from 'react';
import { useMatchTimer } from '../../hooks/useMatchTimer';
import type { GameMatch } from '../../types/gameMatch.types';

interface MatchTimerProps {
  gameMatch: GameMatch;
}

const MatchTimer = memo(({ gameMatch }: MatchTimerProps) => {
  const { formattedTime, isRunning } = useMatchTimer({
    matchStartTime: gameMatch.match_time,
    status: gameMatch.status,
  });

  const isLive = gameMatch.status === 'in_progress';
  const isCompleted = gameMatch.status === 'completed';

  if (!(isLive || isCompleted)) {
    return null;
  }

  return (
    <div className="mb-4 flex justify-center">
      <Tag icon={<ClockCircleOutlined />} color={isRunning ? 'processing' : 'default'} className="px-3 py-1 text-sm font-medium">
        {formattedTime}
      </Tag>
    </div>
  );
});

MatchTimer.displayName = 'MatchTimer';

export default MatchTimer;
