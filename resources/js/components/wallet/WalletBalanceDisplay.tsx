import { walletApi, type WalletBalance } from '@/apis/wallet';
import { EyeInvisibleOutlined, EyeOutlined, WalletOutlined } from '@ant-design/icons';
import { Button, Spin, Typography } from 'antd';
import React, { memo, useCallback, useEffect, useState } from 'react';

const { Text } = Typography;

interface WalletBalanceDisplayProps {
  showToggle?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

const WalletBalanceDisplay: React.FC<WalletBalanceDisplayProps> = memo(({ showToggle = true, compact = false, onClick }) => {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);
  const [error, setError] = useState(false);

  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const response = await walletApi.getBalance();
      setBalance(response.data);
    } catch (err) {
      console.error('Failed to fetch wallet balance:', err);
      setError(true);
      // Don't show error message in header component
    } finally {
      setLoading(false);
    }
  }, []);

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
        <WalletOutlined className="text-gray-500" />
        <Spin size="small" />
        {!compact && <Text className="text-gray-500">Loading...</Text>}
      </div>
    );
  }

  if (error || !balance) {
    return (
      <div className={`flex items-center gap-2 ${onClick ? 'cursor-pointer' : ''}`} onClick={handleClick}>
        <WalletOutlined className="text-red-500" />
        {!compact && (
          <Button type="text" size="small" onClick={handleRetry} className="h-auto p-0 text-red-500">
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${onClick ? 'cursor-pointer rounded px-2 py-1 hover:bg-gray-50' : ''}`} onClick={handleClick}>
      <WalletOutlined className="text-green-600" />

      <div className="flex items-center gap-1">
        <Text strong className={`text-green-600 ${compact ? 'text-sm' : ''}`}>
          {visible ? balance.formatted_balance : '****'}
        </Text>

        {showToggle && (
          <Button
            type="text"
            size="small"
            icon={visible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={handleToggleVisibility}
            className="ml-1 h-auto p-0 text-gray-400 hover:text-gray-600"
          />
        )}
      </div>
    </div>
  );
});

WalletBalanceDisplay.displayName = 'WalletBalanceDisplay';

export default WalletBalanceDisplay;
