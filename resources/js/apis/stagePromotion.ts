import type { CreateStagePromotionRequest, StagePromotion, UpdateStagePromotionRequest } from '../types/tournament.types';
import api from './index';

export const stagePromotionApi = {
  /**
   * Get promotion rules for a stage
   */
  show: (stageId: number): Promise<StagePromotion> => api.get(route('api.stages.promotion.show', { stage: stageId })),

  /**
   * Create promotion rules for a stage
   */
  create: (stageId: number, data: CreateStagePromotionRequest): Promise<StagePromotion> =>
    api.post(route('api.stages.promotion.store', { stage: stageId }), data),

  /**
   * Update promotion rules for a stage
   */
  update: (stageId: number, data: UpdateStagePromotionRequest): Promise<StagePromotion> =>
    api.patch(route('api.stages.promotion.update', { stage: stageId }), data),

  /**
   * Delete promotion rules for a stage
   */
  delete: (stageId: number): Promise<void> => api.delete(route('api.stages.promotion.destroy', { stage: stageId })),
};
