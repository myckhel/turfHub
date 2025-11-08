import { CheckCircleOutlined, CloseOutlined, DeleteOutlined, WifiOutlined } from '@ant-design/icons';
import { Button, Card, Drawer, InputNumber, message, Typography } from 'antd';
import React, { useState } from 'react';
import { bettingApi } from '../../apis/betting';
import { useAuth } from '../../hooks/useAuth';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';
import { useOfflineBettingStore } from '../../stores/offlineBetting.store';
import type { MarketOption } from '../../types/betting.types';

const { Text } = Typography;

interface MobileBetSlipProps {
  selectedOption: MarketOption | null;
  visible: boolean;
  onClose: () => void;
  onBetPlaced?: () => void;
}

const MobileBetSlip: React.FC<MobileBetSlipProps> = ({ selectedOption, visible, onClose, onBetPlaced }) => {
  const { user } = useAuth();
  const { saveDraftBet } = useOfflineBettingStore();
  const { addHapticFeedback, getOptimalTouchTarget } = useMobileOptimization({ enableVibration: true });
  const [amount, setAmount] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Listen to online/offline status
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!selectedOption) return null;

  const odds = parseFloat(String(selectedOption.odds || selectedOption.odds || 0));
  const potentialPayout = amount * odds;
  const potentialProfit = potentialPayout - amount;

  const handlePlaceBet = async () => {
    if (!user || !selectedOption) return;

    setLoading(true);

    try {
      if (isOnline) {
        // Try to place bet online
        await bettingApi.placeBet({
          market_option_id: selectedOption.id,
          amount,
          payment_method: 'wallet',
        });

        addHapticFeedback('medium'); // Success haptic feedback
        message.success('Bet placed successfully!');
        onBetPlaced?.();
        onClose();
      } else {
        // Save as pending sync
        saveDraftBet({
          market_option_id: selectedOption.id,
          amount,
          payment_method: 'wallet',
          marketName: selectedOption.betting_market?.name || 'Unknown Market',
          optionName: selectedOption.name,
          odds: selectedOption.odds,
        });

        message.info("Bet saved offline. It will be placed when you're back online.");
        onClose();
      }
    } catch {
      if (isOnline) {
        message.error('Failed to place bet. Please try again.');
      } else {
        // Save as draft if online placement fails
        saveDraftBet({
          market_option_id: selectedOption.id,
          amount,
          payment_method: 'wallet',
          marketName: selectedOption.betting_market?.name || 'Unknown Market',
          optionName: selectedOption.name,
          odds: selectedOption.odds,
        });

        message.info('Connection failed. Bet saved as draft.');
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    if (!selectedOption) return;

    saveDraftBet({
      market_option_id: selectedOption.id,
      amount,
      payment_method: 'wallet',
      marketName: selectedOption.betting_market?.name || 'Unknown Market',
      optionName: selectedOption.name,
      odds: selectedOption.odds,
    });

    addHapticFeedback('light'); // Light feedback for draft save
    message.success('Bet saved as draft!');
    onClose();
  };

  const quickAmounts = [50, 100, 200, 500, 1000];
  const touchTargetSize = getOptimalTouchTarget(44); // Ensure 44px minimum for touch

  return (
    <Drawer
      title="Place Bet"
      placement="bottom"
      onClose={onClose}
      open={visible}
      height="70vh"
      className="mobile-bet-slip"
      extra={<Button type="text" icon={<CloseOutlined />} onClick={onClose} size="small" />}
    >
      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
          <div className="flex items-center space-x-2">
            <WifiOutlined className={isOnline ? 'text-green-500' : 'text-red-500'} />
            <Text className={isOnline ? 'text-green-600' : 'text-red-600'}>{isOnline ? 'Online' : 'Offline'}</Text>
          </div>
          {!isOnline && (
            <Text type="secondary" className="text-xs">
              Bets will sync when online
            </Text>
          )}
        </div>

        {/* Selection Details */}
        <Card size="small" className="border-l-4 border-l-blue-500">
          <div className="space-y-2">
            <Text strong className="text-lg">
              {selectedOption.betting_market?.name}
            </Text>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">{selectedOption.name}</div>
                <div className="text-xs text-gray-500">
                  {selectedOption.betting_market?.game_match?.first_team?.name} vs {selectedOption.betting_market?.game_match?.second_team?.name}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">{selectedOption.odds}x</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Bet Amount */}
        <div className="space-y-3">
          <Text strong>Bet Amount (₦)</Text>

          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((quickAmount) => (
              <Button
                key={quickAmount}
                size="small"
                type={amount === quickAmount ? 'primary' : 'default'}
                onClick={() => setAmount(quickAmount)}
                style={{ minHeight: `${touchTargetSize}px` }}
              >
                ₦{quickAmount}
              </Button>
            ))}
          </div>

          {/* Custom Amount Input */}
          <InputNumber
            value={amount}
            onChange={(value) => setAmount(value || 0)}
            min={10}
            max={50000}
            className="w-full"
            placeholder="Enter custom amount"
            formatter={(value) => `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => Number(value!.replace(/₦\s?|(,*)/g, ''))}
          />
        </div>

        {/* Payout Calculation */}
        <Card size="small" className="border-green-200 bg-green-50">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Text>Stake:</Text>
              <Text strong>₦{amount.toLocaleString()}</Text>
            </div>
            <div className="flex justify-between">
              <Text>Potential Payout:</Text>
              <Text strong className="text-green-600">
                ₦{potentialPayout.toLocaleString()}
              </Text>
            </div>
            <div className="flex justify-between">
              <Text>Potential Profit:</Text>
              <Text strong className="text-green-600">
                +₦{potentialProfit.toLocaleString()}
              </Text>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-2">
          {isOnline ? (
            <Button
              type="primary"
              size="large"
              block
              loading={loading}
              onClick={handlePlaceBet}
              icon={<CheckCircleOutlined />}
              className="border-green-600 bg-green-600 hover:bg-green-700"
            >
              Place Bet
            </Button>
          ) : (
            <Button
              type="primary"
              size="large"
              block
              loading={loading}
              onClick={handlePlaceBet}
              icon={<WifiOutlined />}
              className="border-blue-600 bg-blue-600 hover:bg-blue-700"
            >
              Save for Later (Offline)
            </Button>
          )}

          <Button
            size="large"
            block
            onClick={handleSaveDraft}
            icon={<DeleteOutlined />}
            className="border-orange-300 text-orange-600 hover:border-orange-400 hover:text-orange-700"
          >
            Save as Draft
          </Button>
        </div>

        {/* Info Text */}
        <div className="rounded bg-gray-50 p-2 text-center text-xs text-gray-500">
          {isOnline
            ? 'Your bet will be placed immediately from your wallet balance.'
            : "Since you're offline, your bet will be saved and placed automatically when you reconnect."}
        </div>
      </div>
    </Drawer>
  );
};

export default MobileBetSlip;
