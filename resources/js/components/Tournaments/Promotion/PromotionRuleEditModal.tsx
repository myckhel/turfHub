import { SaveOutlined } from '@ant-design/icons';
import { App, Modal, Select } from 'antd';
import { memo, useEffect, useState } from 'react';
import { stagePromotionApi } from '../../../apis/stagePromotion';
import { useTournamentStore } from '../../../stores';
import type { PromotionRuleConfig, PromotionRuleType, Stage } from '../../../types/tournament.types';
import PromotionRuleForm from '../Stage/PromotionRuleForm';

interface PromotionRuleEditModalProps {
  visible: boolean;
  stage: Stage;
  onClose: () => void;
  onSuccess: () => void;
}

const PromotionRuleEditModal = memo(({ visible, stage, onClose, onSuccess }: PromotionRuleEditModalProps) => {
  const { message } = App.useApp();
  const { currentTournament, fetchTournament } = useTournamentStore();
  const [loading, setLoading] = useState(false);
  const [nextStageId, setNextStageId] = useState<number | undefined>(stage.promotion?.next_stage_id);
  const [promotionRule, setPromotionRule] = useState<{ rule_type: PromotionRuleType; rule_config: PromotionRuleConfig }>({
    rule_type: stage.promotion?.rule_type || 'top_n',
    rule_config: stage.promotion?.rule_config || { n: 1 },
  });

  console.log({ visible });

  useEffect(() => {
    if (stage.tournament_id && !currentTournament) {
      fetchTournament(stage.tournament_id);
    }
  }, [stage.tournament_id, currentTournament, fetchTournament]);

  useEffect(() => {
    if (visible) {
      setNextStageId(stage.promotion?.next_stage_id);
      setPromotionRule({
        rule_type: stage.promotion?.rule_type || 'top_n',
        rule_config: stage.promotion?.rule_config || { n: 1 },
      });
    }
  }, [visible, stage.promotion]);

  const handleSubmit = async () => {
    if (!nextStageId) {
      message.error('Please select a next stage');
      return;
    }

    setLoading(true);
    try {
      if (stage.promotion) {
        // Update existing promotion
        await stagePromotionApi.update(stage.id, {
          next_stage_id: nextStageId,
          rule_type: promotionRule.rule_type,
          rule_config: promotionRule.rule_config,
        });
        message.success('Promotion rules updated successfully');
      } else {
        // Create new promotion
        await stagePromotionApi.create(stage.id, {
          next_stage_id: nextStageId,
          rule_type: promotionRule.rule_type,
          rule_config: promotionRule.rule_config,
        });
        message.success('Promotion rules created successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save promotion rules:', error);
      message.error('Failed to save promotion rules');
    } finally {
      setLoading(false);
    }
  };

  const availableStages = currentTournament?.stages?.filter((s) => s.id !== stage.id && s.order > stage.order) || [];

  return (
    <Modal
      title={stage.promotion ? 'Edit Promotion Rules' : 'Create Promotion Rules'}
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={stage.promotion ? 'Update Rules' : 'Create Rules'}
      okButtonProps={{ icon: <SaveOutlined />, loading }}
      cancelButtonProps={{ disabled: loading }}
      width={700}
      destroyOnClose
    >
      <div className="space-y-4 py-4">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Next Stage <span className="text-red-500">*</span>
          </label>
          <Select
            className="w-full"
            placeholder="Select next stage for promotion"
            value={nextStageId}
            onChange={setNextStageId}
            disabled={loading}
            size="large"
          >
            {availableStages.map((s) => (
              <Select.Option key={s.id} value={s.id}>
                Stage {s.order}: {s.name}
              </Select.Option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-gray-500">Teams will advance to this stage based on promotion rules</p>
          {availableStages.length === 0 && (
            <p className="mt-1 text-xs text-orange-600">No available stages found. Create a stage with higher order first.</p>
          )}
        </div>

        {nextStageId && <PromotionRuleForm value={promotionRule} onChange={setPromotionRule} nextStageId={nextStageId} disabled={loading} />}
      </div>
    </Modal>
  );
});

PromotionRuleEditModal.displayName = 'PromotionRuleEditModal';

export default PromotionRuleEditModal;
