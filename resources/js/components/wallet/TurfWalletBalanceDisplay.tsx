import { walletApi, type WalletBalance } from '@/apis/wallet';
import { EyeInvisibleOutlined, EyeOutlined, WalletOutlined } from '@ant-design/icons';
import { Button, Spin, Typography } from 'antd';
import React, { memo, useCallback, useEffect, useState } from 'react';

const { Text } = Typography;

interface TurfWalletBalanceDisplayProps {
  turfId: number;
  turfName: string;
  showToggle?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

interface TurfWalletBalance extends WalletBalance {
  turf_id: number;
  turf_name: string;
}

const TurfWalletBalanceDisplay: React.FC<TurfWalletBalanceDisplayProps> = memo(
  ({ turfId, turfName, showToggle = true, compact = false, onClick }) => {
    const [balance, setBalance] = useState<TurfWalletBalance | null>(null);
    const [loading, setLoading] = useState(true);
    const [visible, setVisible] = useState(true);
    const [error, setError] = useState(false);

    const fetchBalance = useCallback(async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await walletApi.getTurfBalance(turfId);
        setBalance(response.data);
      } catch (err) {
        console.error('Failed to fetch turf wallet balance:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }, [turfId]);

    useEffect(() => {
      fetchBalance();
    }, [fetchBalance]);

    const handleToggleVisibility = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        setVisible(!visible);
      },
      [visible],
    );

    const handleRetry = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        fetchBalance();
      },
      [fetchBalance],
    );

    const handleClick = useCallback(() => {
      onClick?.();
    }, [onClick]);

    if (loading) {
      return (
        <div className={`flex items-center gap-2 ${onClick ? 'cursor-pointer' : ''}`} onClick={handleClick}>
          <WalletOutlined className="text-gray-400" />
          <Spin size="small" />
          {!compact && <Text className="text-gray-400">Loading turf wallet...</Text>}
        </div>
      );
    }

    if (error || !balance) {
      return (
        <div className={`flex items-center gap-2 ${onClick ? 'cursor-pointer' : ''}`} onClick={handleClick}>
          <WalletOutlined className="text-red-400" />
          {!compact && (
            <Button type="text" size="small" onClick={handleRetry} className="h-auto p-0 text-red-400">
              Retry
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-2 ${onClick ? 'cursor-pointer rounded px-2 py-1 hover:bg-white/10' : ''}`} onClick={handleClick}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center">
            <WalletOutlined className="mr-2 text-blue-400" />
            {!compact && <Text className="text-xs text-gray-300">{turfName} Wallet</Text>}
          </div>

          <div className="flex items-center gap-1">
            {showToggle && (
              <Button
                type="text"
                size="small"
                icon={visible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={handleToggleVisibility}
                className="-ml-2 h-auto p-0 text-gray-400 hover:text-gray-200"
              />
            )}
            <Text strong className={`text-blue-400 ${compact ? 'text-sm' : ''}`}>
              {visible ? balance.formatted_balance : '****'}
            </Text>
          </div>
        </div>
      </div>
    );
  },
);

TurfWalletBalanceDisplay.displayName = 'TurfWalletBalanceDisplay';

export default TurfWalletBalanceDisplay;
