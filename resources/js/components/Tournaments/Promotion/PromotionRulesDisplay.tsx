import { ArrowRightOutlined, InfoCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import { Alert, Card, Descriptions, Space, Tag, Typography } from 'antd';
import { memo } from 'react';
import type { PromotionRuleType, StagePromotion } from '../../../types/tournament.types';

const { Text, Title } = Typography;

interface PromotionRulesDisplayProps {
  promotion?: StagePromotion;
  stageType: string;
}

const PromotionRulesDisplay = memo(({ promotion, stageType }: PromotionRulesDisplayProps) => {
  if (!promotion) {
    return (
      <Alert
        message="No Promotion Rules"
        description="This stage does not have promotion rules configured. Teams will not automatically advance to the next stage."
        type="info"
        showIcon
      />
    );
  }

  const getRuleTypeDescription = (ruleType: PromotionRuleType) => {
    const descriptions: Record<PromotionRuleType, string> = {
      top_n: 'Top ranked teams will be promoted based on their final standings',
      top_per_group: 'Top teams from each group will advance to the next stage',
      points_threshold: 'Teams that reach a minimum points threshold will be promoted',
      custom: 'Custom promotion logic will be applied',
    };
    return descriptions[ruleType];
  };

  const getRuleTypeIcon = (ruleType: PromotionRuleType) => {
    const icons: Record<PromotionRuleType, string> = {
      top_n: '🏆',
      top_per_group: '👥',
      points_threshold: '🎯',
      custom: '⚙️',
    };
    return icons[ruleType];
  };

  const getRuleConfig = () => {
    const config = promotion.rule_config;
    if (promotion.rule_type === 'top_n' && config.n) {
      return `Top ${config.n} team${config.n > 1 ? 's' : ''} will advance`;
    }
    if (promotion.rule_type === 'top_per_group' && config.n) {
      return `Top ${config.n} team${config.n > 1 ? 's' : ''} from each group`;
    }
    if (promotion.rule_type === 'points_threshold' && config.threshold) {
      return `Teams with ${config.threshold}+ points`;
    }
    if (promotion.rule_type === 'custom' && config.handler_class) {
      return `Custom handler: ${config.handler_class}`;
    }
    return 'Configuration not specified';
  };

  return (
    <Card
      title={
        <Space>
          <TrophyOutlined />
          <span>Promotion Rules</span>
        </Space>
      }
    >
      <div className="space-y-4">
        {/* Rule Overview */}
        <div className="rounded bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <Text className="text-2xl">{getRuleTypeIcon(promotion.rule_type)}</Text>
            <div className="flex-1">
              <Title level={5} className="mb-1">
                {promotion.rule_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </Title>
              <Text className="text-gray-600">{getRuleTypeDescription(promotion.rule_type)}</Text>
            </div>
          </div>
        </div>

        {/* Details */}
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Rule Type">
            <Tag color="blue">{promotion.rule_type.replace(/_/g, ' ')}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Configuration">
            <Text strong>{getRuleConfig()}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Next Stage">
            <Space>
              <Text>{promotion.next_stage?.name || 'Not specified'}</Text>
              {promotion.next_stage && (
                <Tag color="green">
                  <ArrowRightOutlined /> Stage {promotion.next_stage_id}
                </Tag>
              )}
            </Space>
          </Descriptions.Item>
        </Descriptions>

        {/* Additional Info */}
        {promotion.rule_config.params && Object.keys(promotion.rule_config.params).length > 0 && (
          <Card size="small" className="bg-gray-50">
            <Space direction="vertical" className="w-full">
              <Text strong className="flex items-center gap-2">
                <InfoCircleOutlined />
                Additional Parameters
              </Text>
              {Object.entries(promotion.rule_config.params).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <Text className="text-gray-600">{key.replace(/_/g, ' ')}:</Text>
                  <Text strong>{String(value)}</Text>
                </div>
              ))}
            </Space>
          </Card>
        )}

        {/* Stage Type Specific Info */}
        {stageType === 'group' && promotion.rule_type === 'top_per_group' && (
          <Alert
            message="Group Stage Promotion"
            description="After all group matches are completed, the top teams from each group will automatically advance to the next stage."
            type="success"
            showIcon
          />
        )}

        {stageType === 'league' && promotion.rule_type === 'top_n' && (
          <Alert
            message="League Promotion"
            description="After all league matches are completed, the top ranked teams will advance to the next stage based on final standings."
            type="success"
            showIcon
          />
        )}
      </div>
    </Card>
  );
});

PromotionRulesDisplay.displayName = 'PromotionRulesDisplay';

export default PromotionRulesDisplay;
