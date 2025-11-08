import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { Card, Tag, Tooltip, Typography } from 'antd';
import { format, formatDistanceToNow } from 'date-fns';
import { memo } from 'react';
import { useBettingStore } from '../../stores';
import type { BetCardProps } from '../../types/betting.types';
import { Button } from '../ui/Button';
import OddsDisplay from './OddsDisplay';

const { Text, Title } = Typography;

const BetCard = memo(({ bet, onConfirmPayment, showActions = true }: BetCardProps) => {
  const confirmPayment = useBettingStore((state) => state.confirmPayment);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          color: 'orange',
          icon: <ClockCircleOutlined />,
          text: 'Pending',
        };
      case 'active':
        return {
          color: 'blue',
          icon: <CheckCircleOutlined />,
          text: 'Active',
        };
      case 'won':
        return {
          color: 'green',
          icon: <TrophyOutlined />,
          text: 'Won',
        };
      case 'lost':
        return {
          color: 'red',
          icon: <CloseCircleOutlined />,
          text: 'Lost',
        };
      case 'void':
        return {
          color: 'purple',
          icon: <ExclamationCircleOutlined />,
          text: 'Void',
        };
      case 'cancelled':
        return {
          color: 'default',
          icon: <CloseCircleOutlined />,
          text: 'Cancelled',
        };
      default:
        return {
          color: 'default',
          icon: <ExclamationCircleOutlined />,
          text: status,
        };
    }
  };

  const statusConfig = getStatusConfig(bet.status);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  const handleConfirmPayment = async () => {
    try {
      await confirmPayment(bet.id);
      onConfirmPayment?.(bet.id);
    } catch (error) {
      console.error('Failed to confirm payment:', error);
    }
  };

  const canConfirmPayment = bet.status === 'pending' && bet.payment_method === 'offline';

  return (
    <Card className="bet-card transition-all duration-200 hover:shadow-lg" size="small">
      {/* Bet Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">#{bet.id}</span>
          <Tag color={statusConfig.color} icon={statusConfig.icon} className="flex items-center">
            {statusConfig.text}
          </Tag>
        </div>

        <div className="text-right">
          <div className="text-sm font-semibold">₦{bet.stake_amount ? bet.stake_amount.toLocaleString() : '0'}</div>
          <div className="text-xs text-gray-500">{formatTimeAgo(bet.created_at)}</div>
        </div>
      </div>

      {/* Market & Option Info */}
      <div className="mb-3">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <Title level={5} className="!mb-0">
              {bet.market_option?.betting_market?.name}
            </Title>
            <Text type="secondary" className="text-sm">
              {bet.market_option?.name}
            </Text>
          </div>

          <OddsDisplay odds={parseFloat(String(bet.market_option?.odds || 0))} size="small" />
        </div>

        {/* Game Match Info */}
        {bet.market_option?.betting_market?.game_match && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <CalendarOutlined />
            <span>
              {bet.market_option.betting_market.game_match.first_team?.name} vs {bet.market_option.betting_market.game_match.second_team?.name}
            </span>
          </div>
        )}
      </div>

      {/* Bet Details */}
      <div className="mb-3 grid grid-cols-2 gap-4 rounded bg-gray-50 p-3 dark:bg-gray-800">
        <div>
          <div className="mb-1 text-xs text-gray-500">Stake Amount</div>
          <div className="flex items-center space-x-1">
            <DollarOutlined className="text-green-500" />
            <span className="font-semibold">₦{bet.stake_amount ? bet.stake_amount.toLocaleString() : '0'}</span>
          </div>
        </div>

        <div>
          <div className="mb-1 text-xs text-gray-500">Potential Payout</div>
          <div className="flex items-center space-x-1">
            <TrophyOutlined className="text-blue-500" />
            <span className="font-semibold text-blue-600">₦{bet.potential_payout ? bet.potential_payout.toLocaleString() : '0'}</span>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Payment:</span>
          <Tag color={bet.payment_method === 'online' ? 'blue' : 'gold'}>{bet.payment_method}</Tag>
        </div>

        {bet.payment_confirmed_at && (
          <Tooltip title={`Confirmed: ${formatDate(bet.payment_confirmed_at)}`}>
            <CheckCircleOutlined className="text-green-500" />
          </Tooltip>
        )}
      </div>

      {/* Payout Info (for won bets) */}
      {bet.status === 'won' && bet.payout_amount && (
        <div className="mb-3 rounded border border-green-200 bg-green-50 p-3 dark:border-green-700 dark:bg-green-900/20">
          <div className="flex items-center justify-between">
            <span className="font-medium text-green-700 dark:text-green-300">Payout Received</span>
            <span className="font-bold text-green-700 dark:text-green-300">₦{bet.payout_amount.toLocaleString()}</span>
          </div>
          {bet.settled_at && <div className="mt-1 text-xs text-green-600 dark:text-green-400">Settled {formatTimeAgo(bet.settled_at)}</div>}
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex space-x-2">
          {canConfirmPayment && (
            <Button variant="primary" size="small" onClick={handleConfirmPayment} className="flex-1">
              Confirm Payment
            </Button>
          )}
        </div>
      )}

      {/* Bet Details Timestamp */}
      <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-600">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Placed: {formatDate(bet.created_at)}</span>
          {bet.settled_at && <span>Settled: {formatDate(bet.settled_at)}</span>}
        </div>
      </div>
    </Card>
  );
});

BetCard.displayName = 'BetCard';

export default BetCard;
