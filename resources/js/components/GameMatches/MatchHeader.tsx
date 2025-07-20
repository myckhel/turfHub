import { ClockCircleOutlined, PauseCircleOutlined, PlayCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import { Badge, Tag } from 'antd';
import { memo } from 'react';
import type { GameMatch } from '../../types/gameMatch.types';

interface MatchHeaderProps {
  gameMatch: GameMatch;
}

const MatchHeader = memo(({ gameMatch }: MatchHeaderProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'processing';
      case 'completed':
        return 'success';
      case 'upcoming':
        return 'default';
      case 'postponed':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <PlayCircleOutlined />;
      case 'completed':
        return <TrophyOutlined />;
      case 'upcoming':
        return <ClockCircleOutlined />;
      case 'postponed':
        return <PauseCircleOutlined />;
      default:
        return null;
    }
  };

  const isLive = gameMatch.status === 'in_progress';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge status={getStatusColor(gameMatch.status)} />
      <Tag color={getStatusColor(gameMatch.status)} icon={getStatusIcon(gameMatch.status)} className="text-xs">
        {gameMatch.status.replace('_', ' ').toUpperCase()}
      </Tag>
      {isLive && (
        <Tag color="red" className="animate-pulse text-xs">
          LIVE
        </Tag>
      )}
    </div>
  );
});

MatchHeader.displayName = 'MatchHeader';

export default MatchHeader;
