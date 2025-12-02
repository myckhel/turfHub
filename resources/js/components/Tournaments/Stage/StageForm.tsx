import { SaveOutlined } from '@ant-design/icons';
import { router } from '@inertiajs/react';
import { App, Button, Col, Form, Input, InputNumber, Row, Select, Steps } from 'antd';
import { memo, useEffect, useState } from 'react';
import { useTournamentStore } from '../../../stores';
import type { CreateStageRequest, PromotionRuleConfig, PromotionRuleType, Stage, StageSettings, StageType } from '../../../types/tournament.types';
import PromotionRuleForm from './PromotionRuleForm';
import StageSettingsForm from './StageSettingsForm';
import StageTypeSelector from './StageTypeSelector';

const { Step } = Steps;
const { TextArea } = Input;

interface StageFormProps {
  tournamentId: number;
  existingStage?: Stage;
  nextOrder?: number;
  onCancel?: () => void;
}

const StageForm = memo(({ existingStage, nextOrder = 1, onCancel, tournamentId }: StageFormProps) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const { createStage, updateStage, isLoadingStage, fetchTournament, currentTournament } = useTournamentStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [stageType, setStageType] = useState<StageType>(existingStage?.stage_type || 'league');
  const [settings, setSettings] = useState<StageSettings>(
    existingStage?.settings || {
      match_duration: 12,
      match_interval: 5,
      rounds: 1,
      home_and_away: false,
      scoring: {
        win: 3,
        draw: 1,
        loss: 0,
      },
      tie_breakers: ['goal_difference', 'goals_for'],
    },
  );
  const [nextStageId, setNextStageId] = useState<number | undefined>(existingStage?.promotion?.next_stage_id);
  const [promotionRule, setPromotionRule] = useState<{ rule_type: PromotionRuleType; rule_config: PromotionRuleConfig }>({
    rule_type: existingStage?.promotion?.rule_type || 'top_n',
    rule_config: existingStage?.promotion?.rule_config || { n: 1 },
  });

  useEffect(() => {
    if (tournamentId) {
      fetchTournament(tournamentId);
    }
  }, [tournamentId, fetchTournament]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields(['name', 'order']);

      const data: CreateStageRequest = {
        name: values.name,
        order: values.order,
        stage_type: stageType,
        settings: settings,
        ...(nextStageId && {
          next_stage_id: nextStageId,
          rule_type: promotionRule.rule_type,
          rule_config: promotionRule.rule_config,
        }),
      };

      let stage: Stage;

      if (existingStage) {
        stage = await updateStage(existingStage.id, data);
      } else {
        stage = await createStage(tournamentId, data);
      }

      message.success(`Stage ${existingStage ? 'updated' : 'created'} successfully`);
      router.visit(route('web.tournaments.stages.show', { tournament: tournamentId, stage: stage.id }));
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message || 'Failed to save stage');
      }
    }
  };

  const steps = [
    {
      title: 'Basic Info',
      description: 'Stage details',
    },
    {
      title: 'Type',
      description: 'Select format',
    },
    {
      title: 'Settings',
      description: 'Configure rules',
    },
    {
      title: 'Promotion',
      description: 'Advancement rules',
    },
  ];

  const next = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields(['name', 'order']);
      }
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <div className="space-y-6">
      {/* Steps */}
      <Steps current={currentStep} size="small">
        {steps.map((item) => (
          <Step key={item.title} title={item.title} description={item.description} />
        ))}
      </Steps>

      {/* Form */}
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: existingStage?.name || '',
          order: existingStage?.order || nextOrder,
        }}
      >
        {/* Step 0: Basic Info */}
        {currentStep === 0 && (
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Form.Item
                label="Stage Name"
                name="name"
                rules={[
                  { required: true, message: 'Please enter stage name' },
                  { min: 3, message: 'Stage name must be at least 3 characters' },
                ]}
              >
                <Input placeholder="e.g., Group Stage, Quarter Finals" size="large" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label="Stage Order"
                name="order"
                rules={[{ required: true, message: 'Please enter stage order' }]}
                tooltip="The sequence of this stage in the tournament"
              >
                <InputNumber className="w-full" min={1} size="large" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label="Description (Optional)" name="description">
                <TextArea rows={3} placeholder="Optional description of this stage" />
              </Form.Item>
            </Col>
          </Row>
        )}

        {/* Step 1: Stage Type */}
        {currentStep === 1 && <StageTypeSelector value={stageType} onChange={setStageType} disabled={!!existingStage} />}

        {/* Step 2: Settings */}
        {currentStep === 2 && <StageSettingsForm stageType={stageType} value={settings} onChange={setSettings} />}

        {/* Step 3: Promotion */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Next Stage (Optional)</label>
              <Select
                className="w-full"
                placeholder="Select next stage for promotion"
                value={nextStageId}
                onChange={setNextStageId}
                allowClear
                size="large"
              >
                {currentTournament?.stages
                  ?.filter((s) => s.id !== existingStage?.id && s.order > (existingStage?.order || nextOrder))
                  .map((stage) => (
                    <Select.Option key={stage.id} value={stage.id}>
                      Stage {stage.order}: {stage.name}
                    </Select.Option>
                  ))}
              </Select>
              <p className="mt-1 text-xs text-gray-500">Teams will advance to this stage based on promotion rules</p>
            </div>

            {nextStageId && <PromotionRuleForm value={promotionRule} onChange={setPromotionRule} nextStageId={nextStageId} />}

            {!nextStageId && (
              <div className="rounded border border-gray-200 bg-gray-50 p-4 text-center">
                <p className="text-sm text-gray-600">No promotion configured. Teams will not automatically advance from this stage.</p>
                <p className="mt-1 text-xs text-gray-500">You can skip this step or configure promotion rules later.</p>
              </div>
            )}
          </div>
        )}
      </Form>

      {/* Navigation */}
      <div className="flex justify-between border-t pt-4">
        <div>
          {currentStep > 0 && (
            <Button onClick={prev} disabled={isLoadingStage}>
              Previous
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button onClick={onCancel} disabled={isLoadingStage}>
              Cancel
            </Button>
          )}
          {currentStep < steps.length - 1 && (
            <Button type="primary" onClick={next} disabled={isLoadingStage}>
              Next
            </Button>
          )}
          {currentStep === steps.length - 1 && (
            <Button type="primary" icon={<SaveOutlined />} loading={isLoadingStage} onClick={handleSubmit}>
              {existingStage ? 'Update Stage' : 'Create Stage'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

StageForm.displayName = 'StageForm';

export default StageForm;
