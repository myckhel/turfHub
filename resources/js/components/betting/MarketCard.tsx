import { ClockCircleOutlined, FireOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons';
import { Card, Space, Tag, Typography } from 'antd';
import { format } from 'date-fns';
import { memo } from 'react';
import { useBettingStore } from '../../stores';
import type { MarketCardProps, MarketOption } from '../../types/betting.types';
import { MARKET_TYPE_CONFIGS } from '../../types/betting.types';
import OddsDisplay from './OddsDisplay';

const { Text, Title } = Typography;

const MarketCard = memo(({ market, selectedOptions = [], disabled = false }: MarketCardProps) => {
  const addToBetSlip = useBettingStore((state) => state.addToBetSlip);
  const removeFromBetSlip = useBettingStore((state) => state.removeFromBetSlip);
  const selectedOptionsFromStore = useBettingStore((state) => state.selectedOptions);

  const marketConfig = MARKET_TYPE_CONFIGS[market.type];

  const handleOptionSelect = (option: MarketOption) => {
    if (disabled || market.status !== 'active') return;

    // Toggle selection: if already selected, remove it; otherwise, add it
    if (isOptionSelected(option.id)) {
      removeFromBetSlip(option.id);
    } else {
      addToBetSlip(option);
    }
  };

  const isOptionSelected = (optionId: number) => {
    // Check both prop and store for backward compatibility
    return selectedOptions.includes(optionId) || selectedOptionsFromStore.some((opt) => opt.id === optionId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'suspended':
        return 'orange';
      case 'settled':
        return 'blue';
      case 'cancelled':
        return 'red';
      default:
        return 'default';
    }
  };

  const formatGameTime = (gameMatch: { match_time?: string }) => {
    if (!gameMatch?.match_time) return null;

    try {
      return format(new Date(gameMatch.match_time), 'MMM dd, HH:mm');
    } catch {
      return gameMatch.match_time;
    }
  };

  return (
    <Card
      className={`betting-market-card transition-all duration-200 hover:shadow-lg ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${market.status !== 'active' ? 'opacity-75' : ''} `}
      size="small"
      hoverable={!disabled && market.status === 'active'}
    >
      {/* Market Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{marketConfig?.icon}</span>
          <div>
            <Title level={5} className="!mb-0">
              {market.name}
            </Title>
            {market.description && (
              <Text type="secondary" className="text-xs">
                {market.description}
              </Text>
            )}
          </div>
        </div>

        <Tag color={getStatusColor(market.status)} className="capitalize">
          {market.status}
        </Tag>
      </div>

      {/* Game Match Info */}
      {market.game_match && (
        <div className="mb-3 flex items-center justify-between rounded bg-gray-50 p-2 dark:bg-gray-800">
          <div className="flex items-center space-x-2">
            <TeamOutlined className="text-blue-500" />
            <div className="text-sm">
              <Text strong>
                {market.game_match.first_team?.name} vs {market.game_match.second_team?.name}
              </Text>
            </div>
          </div>

          {formatGameTime(market.game_match) && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <ClockCircleOutlined />
              <span>{formatGameTime(market.game_match)}</span>
            </div>
          )}
        </div>
      )}

      {/* Market Options */}
      <div className="space-y-2">
        {market.market_options?.map((option) => (
          <div
            key={option.id}
            className={`flex items-center justify-between rounded-lg border p-3 transition-all duration-200 ${
              isOptionSelected(option.id)
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
            } ${disabled || market.status !== 'active' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:shadow-sm'} `}
            onClick={() => handleOptionSelect(option)}
          >
            <div className="flex-1">
              <Text strong className="text-sm">
                {option.name}
              </Text>
              {(option.bets_count ?? 0) > 0 && (
                <div className="mt-1 flex items-center space-x-1">
                  <FireOutlined className="text-xs text-orange-500" />
                  <Text type="secondary" className="text-xs">
                    {option.bets_count} bets
                  </Text>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <OddsDisplay odds={parseFloat(String(option.odds || option.odds || 0))} size="small" highlight={isOptionSelected(option.id)} />
              {isOptionSelected(option.id) && <TrophyOutlined className="text-sm text-blue-500" />}
            </div>
          </div>
        ))}
      </div>

      {/* Market Stats */}
      {(market.total_bets_count || market.total_stake_amount) && (
        <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-600">
          <Space size="large">
            {market.total_bets_count && (
              <div className="text-center">
                <div className="text-sm font-semibold text-blue-600">{market.total_bets_count}</div>
                <div className="text-xs text-gray-500">Total Bets</div>
              </div>
            )}
            {market.total_stake_amount && (
              <div className="text-center">
                <div className="text-sm font-semibold text-green-600">₦{market.total_stake_amount.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Total Volume</div>
              </div>
            )}
          </Space>
        </div>
      )}
    </Card>
  );
});

MarketCard.displayName = 'MarketCard';

export default MarketCard;
