import api, { type ApiResponse } from './index';

/**
 * Payment API module
 * Handles payment verification and management
 */
export const paymentApi = {
  // Verify team slot payment with race condition protection
  verify: async (
    paymentReference: string,
  ): Promise<{
    success: boolean;
    message: string;
    data?: {
      team_id: number;
      player_id: number;
      is_captain: boolean;
      confirmed_at: string;
    };
    refund_required?: boolean;
  }> => {
    return api.post('/payment-verification/verify-team-slot', {
      payment_reference: paymentReference,
    });
  },

  // Remove player from team (cleanup on payment failure)
  removePlayerFromTeam: async (
    teamId: number,
    paymentReference?: string,
  ): Promise<
    ApiResponse<{
      success: boolean;
      message: string;
    }>
  > => {
    return api.post('/payment-verification/remove-player-from-team', {
      team_id: teamId,
      payment_reference: paymentReference,
    });
  },
};
