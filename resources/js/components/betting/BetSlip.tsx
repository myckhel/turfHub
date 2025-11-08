import {
  CloseOutlined,
  CreditCardOutlined,
  DeleteOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  TrophyOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Alert, App, Card, Divider, Drawer, Empty, InputNumber, Select, Space, Typography } from 'antd';
import { memo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBettingSelectors, useBettingStore } from '../../stores';
import type { BetSlipProps, PaymentMethod, PlaceBetRequest } from '../../types/betting.types';
import { Button } from '../ui/Button';
import OddsDisplay from './OddsDisplay';

const { Text } = Typography;
const { Option } = Select;

const BetSlip = memo(
  ({
    selectedOptions = [],
    stakes = {},
    onUpdateStake,
    onRemoveOption,
    onPlaceBets,
    paymentMethod = 'online',
    onPaymentMethodChange,
    isLoading = false,
  }: BetSlipProps) => {
    const { message } = App.useApp();
    const [isOpen, setIsOpen] = useState(false);
    const [placingBets, setPlacingBets] = useState(false);
    const [localPaymentMethod, setLocalPaymentMethod] = useState<PaymentMethod>(paymentMethod);

    const {
      betSlipOpen,
      toggleBetSlip,
      removeFromBetSlip,
      updateStake,
      setPaymentMethod,
      clearBetSlip,
      placeBets,
      selectedOptions: storeOptions,
      stakes: storeStakes,
      paymentMethod: storePaymentMethod,
    } = useBettingStore();

    const { hasBetsInSlip, betSlipCount, totalStake, totalPotentialPayout } = useBettingSelectors();

    // Use store values if props are not provided (for standalone usage)
    const options = selectedOptions.length > 0 ? selectedOptions : storeOptions;
    const stakeAmounts = Object.keys(stakes).length > 0 ? stakes : storeStakes;
    const currentPaymentMethod = localPaymentMethod || storePaymentMethod;
    const open = isOpen || betSlipOpen;

    const handleUpdateStake = (optionId: number, stake: number) => {
      if (onUpdateStake) {
        onUpdateStake(optionId, stake);
      } else {
        updateStake(optionId, stake);
      }
    };

    const handleRemoveOption = (optionId: number) => {
      if (onRemoveOption) {
        onRemoveOption(optionId);
      } else {
        removeFromBetSlip(optionId);
      }
    };

    const handlePaymentMethodChange = (method: PaymentMethod) => {
      setLocalPaymentMethod(method);
      if (onPaymentMethodChange) {
        onPaymentMethodChange(method);
      } else {
        setPaymentMethod(method);
      }
    };

    const handlePlaceBets = async () => {
      if (options.length === 0) return;

      setPlacingBets(true);

      try {
        const betRequests: PlaceBetRequest[] = options.map((option) => ({
          market_option_id: option.id,
          stake_amount: stakeAmounts[option.id] || 100,
          payment_method: currentPaymentMethod,
        }));

        if (onPlaceBets) {
          await onPlaceBets(betRequests);
        } else {
          await placeBets(betRequests);
        }

        message.success('Bet(s) placed successfully!');

        // Close bet slip after successful placement
        if (!selectedOptions.length) {
          toggleBetSlip();
        }
      } catch (error: unknown) {
        const err = error as { message?: string; response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
        const errorMessage = err?.message || err?.response?.data?.message || 'Failed to place bet(s)';
        const validationErrors = err?.response?.data?.errors;

        console.error('Failed to place bets:', error);

        // Show validation errors if available
        if (validationErrors) {
          const errorList = Object.entries(validationErrors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('; ');
          message.error(`Validation error: ${errorList}`);
        } else {
          message.error(errorMessage);
        }
      } finally {
        setPlacingBets(false);
      }
    };

    const toggleDrawer = () => {
      if (selectedOptions.length > 0) {
        setIsOpen(!isOpen);
      } else {
        toggleBetSlip();
      }
    };

    const handleClearSlip = () => {
      if (selectedOptions.length > 0) {
        // If using props, let parent handle clearing
        options.forEach((option) => handleRemoveOption(option.id));
      } else {
        clearBetSlip();
      }
    };

    const currentTotalStake = selectedOptions.length > 0 ? totalStake : Object.values(stakeAmounts).reduce((sum, stake) => sum + stake, 0);

    const currentTotalPayout =
      selectedOptions.length > 0
        ? totalPotentialPayout
        : options.reduce((total, option) => {
            const stake = stakeAmounts[option.id] || 0;
            const odds = parseFloat(String(option.odds || option.odds || 0));
            return total + stake * odds;
          }, 0);

    const hasValidBets = options.length > 0 && options.every((option) => (stakeAmounts[option.id] || 0) > 0);

    // Render floating button using portal to escape parent positioning context
    const floatingButton = (
      <div className="fixed right-4 bottom-20 z-[9999] sm:bottom-4">
        <Button
          variant="primary"
          size="large"
          onClick={toggleDrawer}
          className="hover:shadow-3xl relative shadow-2xl transition-shadow duration-300"
          disabled={!hasBetsInSlip && options.length === 0}
        >
          <div className="flex items-center gap-2">
            <ShoppingCartOutlined className="text-lg" />
            <span className="font-semibold">Bet Slip</span>
            {(betSlipCount || options.length) > 0 && (
              <span className="flex h-6 w-6 animate-pulse items-center justify-center rounded-full bg-white text-xs font-bold text-blue-600">
                {betSlipCount || options.length}
              </span>
            )}
          </div>
        </Button>
      </div>
    );

    return (
      <>
        {/* Bet Slip Trigger Button - Rendered via Portal */}
        {typeof document !== 'undefined' && createPortal(floatingButton, document.body)}

        {/* Bet Slip Drawer */}
        <Drawer
          title={
            <div className="flex items-center justify-between pr-2">
              <div className="flex items-center gap-2">
                <ShoppingCartOutlined className="text-xl" />
                <span className="text-lg font-semibold">Bet Slip</span>
                {(betSlipCount || options.length) > 0 && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                    {betSlipCount || options.length}
                  </span>
                )}
              </div>
              {options.length > 0 && (
                <Button
                  variant="danger"
                  size="small"
                  onClick={handleClearSlip}
                  className="transition-transform hover:scale-105"
                  icon={<DeleteOutlined />}
                >
                  Clear All
                </Button>
              )}
            </div>
          }
          placement="right"
          width={400}
          open={open}
          onClose={toggleDrawer}
          closeIcon={<CloseOutlined />}
          className="bet-slip-drawer"
        >
          {options.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div className="space-y-2">
                    <Text className="text-base font-medium text-gray-600 dark:text-gray-400">Your bet slip is empty</Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-500">Add bets from available markets to get started</Text>
                  </div>
                }
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Payment Method Selection */}
              <Card size="small" className="mb-4 border-2 border-gray-200 dark:border-gray-700">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCardOutlined className="text-blue-500" />
                    <Text strong className="text-base">
                      Payment Method
                    </Text>
                  </div>
                  <Select<PaymentMethod> value={currentPaymentMethod} onChange={handlePaymentMethodChange} className="w-full" size="large">
                    <Option value="online">
                      <div className="flex items-center gap-2 py-1">
                        <CreditCardOutlined className="text-blue-500" />
                        <span className="font-medium">Online Payment</span>
                      </div>
                    </Option>
                    <Option value="wallet">
                      <div className="flex items-center gap-2 py-1">
                        <WalletOutlined className="text-green-500" />
                        <span className="font-medium">Wallet</span>
                      </div>
                    </Option>
                    <Option value="offline">
                      <div className="flex items-center gap-2 py-1">
                        <DollarOutlined className="text-orange-500" />
                        <span className="font-medium">Cash Payment</span>
                      </div>
                    </Option>
                  </Select>
                </div>
              </Card>

              {/* Selected Options */}
              <div className="space-y-3">
                {options.map((option) => (
                  <Card
                    key={option.id}
                    size="small"
                    className="group relative overflow-hidden border-l-4 border-l-blue-500 transition-all duration-300 hover:shadow-md dark:border-l-blue-400"
                  >
                    {/* Enhanced Delete Button */}
                    <button
                      onClick={() => handleRemoveOption(option.id)}
                      className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 opacity-80 transition-all duration-200 hover:scale-110 hover:bg-red-500 hover:text-white hover:opacity-100 active:scale-95 dark:bg-red-900/20 dark:hover:bg-red-600"
                      aria-label="Remove bet"
                    >
                      <DeleteOutlined className="text-base" />
                    </button>

                    <div className="pr-10">
                      {/* Market & Odds */}
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <Text strong className="text-sm leading-tight">
                          {option.betting_market?.name}
                        </Text>
                        <div className="shrink-0">
                          <OddsDisplay odds={parseFloat(String(option.odds || option.odds || 0))} size="small" />
                        </div>
                      </div>

                      {/* Option Name */}
                      <Text className="mb-3 block text-sm text-gray-600 dark:text-gray-400">{option.name || option.name}</Text>

                      {/* Stake & Potential Win */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <Text className="text-xs font-medium text-gray-600 dark:text-gray-400">Stake:</Text>
                          <InputNumber
                            value={stakeAmounts[option.id] || 100}
                            onChange={(value) => handleUpdateStake(option.id, value || 0)}
                            min={1}
                            max={100000}
                            prefix="₦"
                            size="small"
                            className="w-28"
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => Number(value?.replace(/₦\s?|(,*)/g, '') || 0)}
                          />
                        </div>

                        <div className="flex items-center justify-between rounded-md bg-green-50 px-2 py-1.5 dark:bg-green-900/20">
                          <Text className="text-xs font-medium text-gray-600 dark:text-gray-400">Potential Win:</Text>
                          <Text strong className="text-sm text-green-600 dark:text-green-400">
                            ₦{((stakeAmounts[option.id] || 0) * parseFloat(String(option.odds || option.odds || 0))).toLocaleString()}
                          </Text>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Divider className="my-4" />

              {/* Summary */}
              <Card
                size="small"
                className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:border-blue-800 dark:from-blue-900/20 dark:to-indigo-900/20"
              >
                <Space direction="vertical" className="w-full" size="small">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800">
                        <DollarOutlined className="text-blue-600 dark:text-blue-300" />
                      </div>
                      <Text strong className="text-gray-700 dark:text-gray-300">
                        Total Stake:
                      </Text>
                    </div>
                    <Text strong className="text-xl text-gray-900 dark:text-white">
                      ₦{currentTotalStake.toLocaleString()}
                    </Text>
                  </div>

                  <Divider className="m-0" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-800">
                        <TrophyOutlined className="text-green-600 dark:text-green-300" />
                      </div>
                      <Text strong className="text-gray-700 dark:text-gray-300">
                        Potential Payout:
                      </Text>
                    </div>
                    <Text strong className="text-xl text-green-600 dark:text-green-400">
                      ₦{currentTotalPayout.toLocaleString()}
                    </Text>
                  </div>
                </Space>
              </Card>

              {/* Warnings */}
              {currentPaymentMethod === 'offline' && (
                <Alert
                  type="info"
                  message="Cash Payment"
                  description="You'll need to confirm your cash payment with the turf manager before your bet is active."
                  showIcon
                />
              )}

              {/* Place Bets Button */}
              <Button
                variant="primary"
                size="large"
                fullWidth
                loading={placingBets || isLoading}
                disabled={!hasValidBets}
                onClick={handlePlaceBets}
                className="mt-4 !h-14 text-base font-bold shadow-lg hover:shadow-xl"
                gradient
              >
                <div className="flex items-center justify-center gap-2">
                  <TrophyOutlined className="text-lg" />
                  <span>
                    Place {options.length} Bet{options.length !== 1 ? 's' : ''} - ₦{currentTotalStake.toLocaleString()}
                  </span>
                </div>
              </Button>
            </div>
          )}
        </Drawer>
      </>
    );
  },
);

BetSlip.displayName = 'BetSlip';

export default BetSlip;
