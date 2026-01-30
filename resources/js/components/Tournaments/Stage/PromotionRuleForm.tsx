import { ArrowUpOutlined, NumberOutlined, TrophyOutlined } from '@ant-design/icons';
import { Card, Col, Form, Input, InputNumber, Radio, Row, Space, Typography } from 'antd';
import { memo } from 'react';
import type { PromotionRuleConfig, PromotionRuleType } from '../../../types/tournament.types';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface PromotionRuleFormProps {
  value?: {
    rule_type: PromotionRuleType;
    rule_config: PromotionRuleConfig;
  };
  onChange?: (value: { rule_type: PromotionRuleType; rule_config: PromotionRuleConfig }) => void;
  nextStageId?: number;
  disabled?: boolean;
}

const PromotionRuleForm = memo(({ value, onChange, nextStageId, disabled }: PromotionRuleFormProps) => {
  const ruleType = value?.rule_type || 'top_n';
  const ruleConfig = value?.rule_config || {};

  const handleRuleTypeChange = (newType: PromotionRuleType) => {
    // Reset config when type changes
    const defaultConfigs: Record<PromotionRuleType, PromotionRuleConfig> = {
      top_n: { n: 1 },
      top_per_group: { n: 1 },
      points_threshold: { threshold: 10 },
      knockout_winners: { n: 1 },
      custom: { handler_class: '', params: {} },
    };

    onChange?.({
      rule_type: newType,
      rule_config: defaultConfigs[newType],
    });
  };

  const handleConfigChange = (key: string, val: unknown) => {
    onChange?.({
      rule_type: ruleType,
      rule_config: {
        ...ruleConfig,
        [key]: val,
      },
    });
  };

  const handleParamsChange = (params: Record<string, unknown>) => {
    onChange?.({
      rule_type: ruleType,
      rule_config: {
        ...ruleConfig,
        params,
      },
    });
  };

  const ruleTypeOptions = [
    {
      value: 'top_n' as PromotionRuleType,
      label: 'Top N Teams',
      description: 'Promote the top N teams from the overall standings',
      icon: <TrophyOutlined />,
    },
    {
      value: 'top_per_group' as PromotionRuleType,
      label: 'Top Per Group',
      description: 'Promote the top N teams from each group',
      icon: <ArrowUpOutlined />,
    },
    {
      value: 'points_threshold' as PromotionRuleType,
      label: 'Points Threshold',
      description: 'Promote teams that reach a specific points threshold',
      icon: <NumberOutlined />,
    },
    {
      value: 'knockout_winners' as PromotionRuleType,
      label: 'Knockout Winners',
      description: 'Promote teams that won their knockout fixtures (based on match results)',
      icon: <TrophyOutlined />,
    },
    {
      value: 'custom' as PromotionRuleType,
      label: 'Custom Rule',
      description: 'Define a custom promotion handler with specific parameters',
      icon: <NumberOutlined />,
    },
  ];

  const getPreview = () => {
    if (!nextStageId) {
      return 'Select a next stage to preview promotion rules';
    }

    switch (ruleType) {
      case 'top_n':
        return `Top ${ruleConfig.n || 1} team(s) will advance to the next stage`;
      case 'top_per_group':
        return `Top ${ruleConfig.n || 1} team(s) from each group will advance to the next stage`;
      case 'points_threshold':
        return `Teams with ${ruleConfig.threshold || 0}+ points will advance to the next stage`;
      case 'knockout_winners':
        return `Teams that won their knockout fixtures will advance to the next stage`;
      case 'custom':
        return `Custom promotion using handler: ${ruleConfig.handler_class || 'Not specified'}`;
      default:
        return 'No promotion rule configured';
    }
  };

  return (
    <div className="space-y-4">
      {/* Rule Type Selection */}
      <div>
        <Text strong className="mb-2 block">
          Promotion Rule Type
        </Text>
        <Radio.Group value={ruleType} onChange={(e) => handleRuleTypeChange(e.target.value)} disabled={disabled} className="w-full">
          <Row gutter={[12, 12]}>
            {ruleTypeOptions.map((option) => (
              <Col xs={24} sm={12} key={option.value}>
                <Card
                  size="small"
                  hoverable={!disabled}
                  className={`cursor-pointer ${ruleType === option.value ? 'border-primary shadow-sm' : ''}`}
                  onClick={() => !disabled && handleRuleTypeChange(option.value)}
                >
                  <Radio value={option.value}>
                    <Space direction="vertical" size={0}>
                      <Text strong>
                        {option.icon} {option.label}
                      </Text>
                      <Text type="secondary" className="text-xs">
                        {option.description}
                      </Text>
                    </Space>
                  </Radio>
                </Card>
              </Col>
            ))}
          </Row>
        </Radio.Group>
      </div>

      {/* Rule Configuration */}
      <Card title="Rule Configuration" size="small">
        {ruleType === 'top_n' && (
          <Form.Item label="Number of Teams to Promote">
            <InputNumber
              value={ruleConfig.n}
              onChange={(val) => handleConfigChange('n', val)}
              min={1}
              className="w-full"
              placeholder="e.g., 2"
              disabled={disabled}
            />
          </Form.Item>
        )}

        {ruleType === 'top_per_group' && (
          <Form.Item label="Teams Per Group to Promote">
            <InputNumber
              value={ruleConfig.n}
              onChange={(val) => handleConfigChange('n', val)}
              min={1}
              className="w-full"
              placeholder="e.g., 1"
              disabled={disabled}
            />
          </Form.Item>
        )}

        {ruleType === 'points_threshold' && (
          <Form.Item label="Minimum Points Required">
            <InputNumber
              value={ruleConfig.threshold}
              onChange={(val) => handleConfigChange('threshold', val)}
              min={0}
              className="w-full"
              placeholder="e.g., 10"
              disabled={disabled}
            />
          </Form.Item>
        )}

        {ruleType === 'knockout_winners' && (
          <div className="rounded bg-blue-50 p-4">
            <Text strong className="mb-2 block text-sm">
              Fixture-Based Winner Promotion
            </Text>
            <Text className="text-sm text-gray-600">
              Teams that won their knockout fixtures will be promoted to the next stage. Winners are determined by actual match results
              (winning_team_id), not by computed rankings. No configuration needed.
            </Text>
          </div>
        )}

        {ruleType === 'custom' && (
          <>
            <Form.Item label="Handler Class" required>
              <Input
                value={ruleConfig.handler_class}
                onChange={(e) => handleConfigChange('handler_class', e.target.value)}
                placeholder="e.g., App\Handlers\CustomPromotionHandler"
                disabled={disabled}
              />
            </Form.Item>
            <Form.Item label="Custom Parameters (JSON)">
              <TextArea
                value={JSON.stringify(ruleConfig.params || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const params = JSON.parse(e.target.value);
                    handleParamsChange(params);
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                rows={4}
                placeholder='{"key": "value"}'
                disabled={disabled}
              />
            </Form.Item>
          </>
        )}

        {!nextStageId && (
          <div className="mb-2 rounded border border-yellow-200 bg-yellow-50 p-3">
            <Text type="warning" className="text-sm">
              ⚠️ This stage needs a next stage to enable promotion rules
            </Text>
          </div>
        )}
      </Card>

      {/* Rule Preview */}
      <Card title="Rule Preview" size="small" className="bg-blue-50">
        <Paragraph className="mb-0">{getPreview()}</Paragraph>
      </Card>
    </div>
  );
});

PromotionRuleForm.displayName = 'PromotionRuleForm';

export default PromotionRuleForm;
