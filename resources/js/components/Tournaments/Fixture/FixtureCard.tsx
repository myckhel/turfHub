import { CalendarOutlined, EditOutlined, EnvironmentOutlined, EyeOutlined, TrophyOutlined } from '@ant-design/icons';
import { Button, Card, Tag, Tooltip, Typography } from 'antd';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { memo } from 'react';
import type { Fixture } from '../../../types/tournament.types';

const { Text } = Typography;

interface FixtureCardProps {
  fixture: Fixture;
  onEditScore?: (fixture: Fixture) => void;
  onViewDetails?: (fixture: Fixture) => void;
  showActions?: boolean;
}

const FixtureCard = memo(({ fixture, onEditScore, onViewDetails, showActions = true }: FixtureCardProps) => {
  const getStatusConfig = (status: Fixture['status']) => {
    const configs: Record<
      Fixture['status'],
      { color: 'default' | 'processing' | 'success' | 'error' | 'warning'; text: string; accentColor: string }
    > = {
      upcoming: { color: 'default', text: 'Upcoming', accentColor: '#1890ff' },
      in_progress: { color: 'processing', text: 'LIVE', accentColor: '#52c41a' },
      completed: { color: 'success', text: 'FT', accentColor: '#8c8c8c' },
      cancelled: { color: 'error', text: 'Cancelled', accentColor: '#ff4d4f' },
      postponed: { color: 'warning', text: 'Postponed', accentColor: '#faad14' },
    };
    return configs[status];
  };

  const statusConfig = getStatusConfig(fixture.status);
  const isCompleted = fixture.status === 'completed';
  const isLive = fixture.status === 'in_progress';
  const canEdit = fixture.status !== 'cancelled' && onEditScore && showActions;
  const matchDate = fixture.match_time ? new Date(fixture.match_time) : null;
  const isMatchPast = matchDate ? isPast(matchDate) : false;

  return (
    <Card
      size="small"
      className={`group relative overflow-hidden border-0 shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
        isLive ? 'ring-2 ring-green-500 ring-offset-2' : ''
      }`}
      bodyStyle={{ padding: 0 }}
    >
      {/* Soccer Field Pattern Background */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            repeating-linear-gradient(90deg, transparent, transparent 49px, #22c55e 49px, #22c55e 51px),
            repeating-linear-gradient(0deg, transparent, transparent 49px, #22c55e 49px, #22c55e 51px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Top Stadium Bar */}
      <div
        className="relative flex items-center justify-between px-3 py-2"
        style={{
          background: isLive
            ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
            : isCompleted
              ? 'linear-gradient(135deg, #64748b 0%, #475569 100%)'
              : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        }}
      >
        {/* Competition Info */}
        <div className="flex items-center gap-2">
          {fixture.group && (
            <Tooltip title={fixture.group.name}>
              <div className="rounded bg-white/20 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-sm">{fixture.group.name}</div>
            </Tooltip>
          )}
          {fixture.stage && (
            <Tooltip title={fixture.stage.name}>
              <div className="rounded bg-white/20 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">{fixture.stage.name}</div>
            </Tooltip>
          )}
        </div>

        {/* Match Status */}
        <div className="flex items-center gap-2">
          {isLive && (
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
              <span className="text-xs font-black tracking-wider text-white uppercase">{statusConfig.text}</span>
            </div>
          )}
          {!isLive && <span className="text-xs font-bold tracking-wide text-white/90 uppercase">{statusConfig.text}</span>}
        </div>
      </div>

      {/* Main Match Display - Soccer Field Style */}
      <div
        className="relative px-4 pt-6 pb-0"
        style={{
          background: 'linear-gradient(180deg, #16a34a 0%, #15803d 50%, #166534 100%)',
          backgroundImage: `
            linear-gradient(180deg, #16a34a 0%, #15803d 50%, #166534 100%),
            repeating-linear-gradient(90deg, transparent 0, transparent 20%, rgba(255,255,255,0.03) 20%, rgba(255,255,255,0.03) 40%)
          `,
        }}
      >
        {/* Center Circle */}
        <div className="absolute top-1/2 left-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/10" />
        <div className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20" />

        <div className="relative z-10 flex items-center justify-between pb-6">
          {/* Home Team */}
          <div className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg ring-2 ring-white/30">
              <Text className="text-2xl font-black text-gray-800">{fixture.first_team?.name?.substring(0, 2).toUpperCase() || 'T1'}</Text>
            </div>
            <Tooltip title={fixture.first_team?.name}>
              <Text
                className={`text-center text-sm font-bold tracking-tight text-white uppercase drop-shadow-lg ${
                  fixture.winning_team?.id === fixture.first_team_id ? 'text-yellow-300' : ''
                }`}
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
              >
                {fixture.first_team?.name || 'TBD'}
              </Text>
            </Tooltip>
            {fixture.winning_team?.id === fixture.first_team_id && (
              <TrophyOutlined className="animate-bounce text-lg text-yellow-400 drop-shadow-lg" />
            )}
          </div>

          {/* Digital Scoreboard */}
          <div className="flex flex-col items-center gap-2 px-4">
            {isCompleted || isLive ? (
              <>
                <div
                  className="flex items-center gap-3 rounded-lg px-6 py-3 shadow-2xl"
                  style={{
                    background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
                    border: '2px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div className="text-center">
                    <div
                      className={`text-4xl font-black tabular-nums ${
                        fixture.winning_team?.id === fixture.first_team_id ? 'text-yellow-400' : 'text-white'
                      }`}
                      style={{
                        textShadow: fixture.winning_team?.id === fixture.first_team_id ? '0 0 20px rgba(250,204,21,0.5)' : 'none',
                        fontFamily: 'monospace',
                      }}
                    >
                      {fixture.first_team_score ?? 0}
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-xl font-bold text-gray-400">:</div>
                    {isLive && <div className="mt-1 h-1 w-1 animate-pulse rounded-full bg-red-500" />}
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-4xl font-black tabular-nums ${
                        fixture.winning_team?.id === fixture.second_team_id ? 'text-yellow-400' : 'text-white'
                      }`}
                      style={{
                        textShadow: fixture.winning_team?.id === fixture.second_team_id ? '0 0 20px rgba(250,204,21,0.5)' : 'none',
                        fontFamily: 'monospace',
                      }}
                    >
                      {fixture.second_team_score ?? 0}
                    </div>
                  </div>
                </div>
                {fixture.outcome === 'draw' && isCompleted && (
                  <div className="rounded bg-gray-800/80 px-2 py-0.5 text-xs font-bold text-white backdrop-blur">DRAW</div>
                )}
              </>
            ) : (
              <div
                className="rounded-lg px-6 py-3 shadow-xl"
                style={{
                  background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
                  border: '2px solid rgba(255,255,255,0.1)',
                }}
              >
                <Text className="text-2xl font-bold text-gray-400" style={{ fontFamily: 'monospace' }}>
                  VS
                </Text>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg ring-2 ring-white/30">
              <Text className="text-2xl font-black text-gray-800">{fixture.second_team?.name?.substring(0, 2).toUpperCase() || 'T2'}</Text>
            </div>
            <Tooltip title={fixture.second_team?.name}>
              <Text
                className={`text-center text-sm font-bold tracking-tight text-white uppercase drop-shadow-lg ${
                  fixture.winning_team?.id === fixture.second_team_id ? 'text-yellow-300' : ''
                }`}
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
              >
                {fixture.second_team?.name || 'TBD'}
              </Text>
            </Tooltip>
            {fixture.winning_team?.id === fixture.second_team_id && (
              <TrophyOutlined className="animate-bounce text-lg text-yellow-400 drop-shadow-lg" />
            )}
          </div>
        </div>

        {/* Bottom Info Bar - on gradient background */}
        <div className="relative z-10 border-t border-white/10 bg-black/20 px-3 py-2 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Date & Venue */}
            <div className="flex flex-wrap items-center gap-2">
              {matchDate && (
                <Tooltip title={format(matchDate, 'PPpp')}>
                  <Tag icon={<CalendarOutlined />} className="m-0 cursor-help border-white/20 bg-white/10 text-xs text-white">
                    {isMatchPast ? formatDistanceToNow(matchDate, { addSuffix: true }) : format(matchDate, 'MMM dd, HH:mm')}
                  </Tag>
                </Tooltip>
              )}
              {fixture.match_session?.turf && (
                <Tooltip title={fixture.match_session.turf.name}>
                  <Tag icon={<EnvironmentOutlined />} className="m-0 border-white/20 bg-white/10 text-xs text-white">
                    {fixture.match_session.turf.name}
                  </Tag>
                </Tooltip>
              )}
            </div>

            {/* Action Buttons */}
            {showActions && (
              <div className="flex gap-1">
                {onViewDetails && (
                  <Tooltip title="View match details">
                    <Button
                      type="text"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => onViewDetails(fixture)}
                      className="text-white hover:bg-white/20 hover:text-white"
                    />
                  </Tooltip>
                )}
                {canEdit && (
                  <Tooltip title="Edit score">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => onEditScore(fixture)}
                      className="text-white hover:bg-white/20 hover:text-white"
                    />
                  </Tooltip>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
});

FixtureCard.displayName = 'FixtureCard';

export default FixtureCard;
