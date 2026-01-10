import { Alert, App, Button, Modal, Typography } from 'antd';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { paymentApi } from '../../apis/payment';
import { teamApi } from '../../apis/team';
import { walletApi } from '../../apis/wallet';
import usePaystack from '../../hooks/usePaystack';
import type { TeamDetails } from '../../types/team.types';
import type { WalletBalance } from '../../types/wallet.types';
import PaymentMethodModal from '../payment/PaymentMethodModal';

const { Text } = Typography;

interface JoinTeamPaymentModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  team: TeamDetails;
  slotFee: number;
  title?: string;
  description?: string;
  position?: number; // Optional position, will auto-assign if not provided
}

const JoinTeamPaymentModal: React.FC<JoinTeamPaymentModalProps> = memo(
  ({ open, onCancel, onSuccess, team, slotFee, title, description, position = 1 }) => {
    const { message } = App.useApp();
    const [loading, setLoading] = useState(false);
    const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [verifyingPayment, setVerifyingPayment] = useState(false);
    const paymentReferenceRef = useRef<string | null>(null);

    // Handle player removal from team on payment failure
    const removePlayerFromTeam = useCallback(
      async (paymentReference: string | null) => {
        if (!paymentReference) return;

        try {
          await paymentApi.removePlayerFromTeam(team.id, paymentReference);
          console.log('Player removed from team due to payment failure');
        } catch (error) {
          console.error('Failed to remove player from team:', error);
          // Don't show user error as this is a cleanup operation
        }
      },
      [team.id],
    );

    const { resumeTransaction } = usePaystack({
      onSuccess: async (transaction) => {
        paymentReferenceRef.current = transaction.reference;
        await handlePaymentSuccess(transaction.reference);
      },
      onError: (error) => {
        console.log({ error });

        setLoading(false);
        setError(error.message || 'Payment failed');
        removePlayerFromTeam(paymentReferenceRef.current);
      },
      onCancel: () => {
        console.log(paymentReferenceRef.current);

        setLoading(false);
        setError('Payment was cancelled');
        removePlayerFromTeam(paymentReferenceRef.current);
      },
    });

    const loadWalletBalance = useCallback(async () => {
      try {
        const response = await walletApi.getBalance();
        setWalletBalance(response);
      } catch (error) {
        console.error('Failed to load wallet balance:', error);
        // Don't show error message for wallet balance as it's optional
      }
    }, []);

    // Handle payment success and verify with backend
    const handlePaymentSuccess = useCallback(
      async (paymentReference: string) => {
        setVerifyingPayment(true);
        try {
          // Verify payment and complete team join (handles race conditions)
          const verificationResponse = await paymentApi.verify(paymentReference);

          if (verificationResponse.success) {
            message.success('Payment verified! Successfully joined the team.');
            setLoading(false);
            onSuccess();
          } else {
            setError(verificationResponse.message || 'Payment verification failed');
            setLoading(false);
          }
        } catch (error: unknown) {
          console.error('Payment verification failed:', error);
          const axiosError = error as { response?: { data?: { message?: string } } };
          setError(axiosError?.response?.data?.message || 'Payment verification failed. Please contact support.');
          setLoading(false);
        } finally {
          setVerifyingPayment(false);
        }
      },
      [onSuccess],
    );

    const processTeamJoin = useCallback(
      async (paymentMethod: 'wallet' | 'paystack' | 'none') => {
        setLoading(true);
        setError(null);

        try {
          // For paid slots, check availability and reserve slot first
          if (paymentMethod !== 'none' && slotFee > 0) {
            // Process payment
            const paymentResponse = await teamApi.processSlotPayment({
              team_id: team.id,
              position,
              payment_method: paymentMethod,
            });

            if (paymentMethod === 'paystack' && paymentResponse.access_code) {
              // Use Paystack inline payment with access code
              paymentReferenceRef.current = paymentResponse.reference as string;
              resumeTransaction(paymentResponse.access_code);
              return; // Don't set loading to false here as it will be handled by Paystack callbacks
            }

            if (paymentMethod === 'wallet') {
              message.success('Payment verified! Successfully joined the team.');
              setLoading(false);
              onSuccess();
              // Refresh wallet balance after successful wallet payment
              await loadWalletBalance();
            }
          } else {
            // Direct join if no payment required
            await teamApi.joinSlot({ team_id: team.id, position });
            setLoading(false);
            message.success('Successfully joined the team!');
            onSuccess();
          }
        } catch (error: unknown) {
          console.error('Failed to join team:', error);
          const axiosError = error as { response?: { data?: { message?: string } } };
          const errorMessage = axiosError?.response?.data?.message || 'Failed to join team. Please try again.';
          setError(errorMessage);
          message.error(errorMessage);
          setLoading(false);
          // remove player from team if payment fails
          removePlayerFromTeam(paymentReferenceRef.current);
        }
      },
      [team.id, slotFee, position, onSuccess, resumeTransaction, loadWalletBalance, removePlayerFromTeam, paymentReferenceRef],
    );

    const handleJoinTeam = useCallback(async () => {
      if (slotFee > 0) {
        // Load wallet balance if payment is required and not already loaded
        if (!walletBalance) {
          await loadWalletBalance();
        }
      } else {
        // Direct join if no payment required
        await processTeamJoin('none');
      }
    }, [slotFee, walletBalance, loadWalletBalance, processTeamJoin]);

    const handlePaymentMethodConfirm = useCallback(
      (paymentMethod: 'wallet' | 'paystack') => {
        processTeamJoin(paymentMethod);
      },
      [processTeamJoin],
    );

    // Clear error when modal opens
    useEffect(() => {
      if (open) {
        setError(null);
      }
    }, [open]);

    // If payment is required, show payment method modal
    if (open && slotFee > 0 && walletBalance !== null) {
      return (
        <PaymentMethodModal
          open={open}
          onCancel={onCancel}
          onConfirm={handlePaymentMethodConfirm}
          amount={slotFee}
          title={title || 'Join Team Payment'}
          description={description || `Pay team slot fee to join ${team.name}`}
          walletBalance={walletBalance}
          loading={loading}
        />
      );
    }

    // Show loading/confirmation modal for free teams or initial loading
    return (
      <Modal
        open={open}
        title={title || 'Join Team'}
        onCancel={onCancel}
        footer={[
          <Button key="cancel" onClick={onCancel} disabled={loading || verifyingPayment}>
            Cancel
          </Button>,
          <Button key="join" type="primary" loading={loading || verifyingPayment} onClick={handleJoinTeam}>
            {slotFee > 0 ? 'Continue to Payment' : 'Join Team'}
          </Button>,
        ]}
        width={400}
      >
        <div className="space-y-4">
          {description && (
            <Text type="secondary" className="block text-center">
              {description}
            </Text>
          )}

          {verifyingPayment && (
            <Alert
              type="info"
              message="Verifying Payment"
              description="Please wait while we verify your payment and assign your team slot..."
              showIcon
              className="mb-4"
            />
          )}

          {slotFee > 0 ? (
            <div className="space-y-3">
              <Text className="block text-center">
                You are about to join <strong>{team.name}</strong>
              </Text>
              <div className="rounded border border-blue-200 bg-blue-50 p-3 text-center dark:border-blue-800 dark:bg-blue-900/20">
                <Text strong className="text-blue-600 dark:text-blue-400">
                  Team Slot Fee: ₦{slotFee.toLocaleString()}
                </Text>
              </div>
              <Text type="secondary" className="block text-center text-sm">
                You will be able to choose your payment method on the next step.
              </Text>
            </div>
          ) : (
            <div className="text-center">
              <Text>
                You are about to join <strong>{team.name}</strong> for free.
              </Text>
            </div>
          )}

          {error && <Alert type="error" message="Join Team Failed" description={error} showIcon className="mt-4" />}
        </div>
      </Modal>
    );
  },
);

JoinTeamPaymentModal.displayName = 'JoinTeamPaymentModal';

export default JoinTeamPaymentModal;
