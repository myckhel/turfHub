import { AppstoreOutlined, CrownOutlined, StarOutlined, TeamOutlined, ToolOutlined, TrophyOutlined } from '@ant-design/icons';
import { Card, Col, Radio, Row, Space, Typography } from 'antd';
import { memo } from 'react';
import type { StageType } from '../../../types/tournament.types';

const { Title, Text, Paragraph } = Typography;

interface StageTypeSelectorProps {
  value?: StageType;
  onChange?: (value: StageType) => void;
  disabled?: boolean;
}

const stageTypeOptions = [
  {
    value: 'league' as StageType,
    label: 'League (Round Robin)',
    icon: <TrophyOutlined className="text-3xl text-blue-500" />,
    description: 'Every team plays against every other team. Best for small groups.',
    features: ['Home & Away options', 'Multiple rounds', 'Points-based ranking'],
  },
  {
    value: 'group' as StageType,
    label: 'Group Stage',
    icon: <TeamOutlined className="text-3xl text-green-500" />,
    description: 'Teams divided into groups, each group plays round-robin.',
    features: ['Multiple groups', 'Top teams advance', 'Parallel matches'],
  },
  {
    value: 'knockout' as StageType,
    label: 'Knockout',
    icon: <StarOutlined className="text-3xl text-red-500" />,
    description: 'Single or double elimination bracket. Win or go home.',
    features: ['Bracket format', 'Single/Double leg', 'Seeded draws'],
  },
  {
    value: 'swiss' as StageType,
    label: 'Swiss System',
    icon: <AppstoreOutlined className="text-3xl text-purple-500" />,
    description: 'Teams with similar records play each other. No eliminations.',
    features: ['No eliminations', 'Balanced matchups', 'Fair rankings'],
  },
  {
    value: 'king_of_hill' as StageType,
    label: 'King of the Hill',
    icon: <CrownOutlined className="text-3xl text-yellow-500" />,
    description: 'Winner stays on, loser goes to back of queue.',
    features: ['Queue-based', 'Dynamic matchups', 'Fast-paced'],
  },
  {
    value: 'custom' as StageType,
    label: 'Custom',
    icon: <ToolOutlined className="text-3xl text-gray-500" />,
    description: 'Create custom rules and match formats.',
    features: ['Flexible rules', 'Manual fixtures', 'Custom scoring'],
  },
];

const StageTypeSelector = memo(({ value, onChange, disabled }: StageTypeSelectorProps) => {
  return (
    <div>
      <Title level={5} className="mb-4">
        Select Stage Type
      </Title>

      <Radio.Group value={value} onChange={(e) => onChange?.(e.target.value)} className="w-full" disabled={disabled}>
        <Row gutter={[16, 16]}>
          {stageTypeOptions.map((option) => (
            <Col key={option.value} xs={24} md={12} lg={8}>
              <Radio value={option.value} className="hidden">
                {option.label}
              </Radio>
              <Card
                hoverable={!disabled}
                className={`h-full cursor-pointer transition-all ${
                  value === option.value ? 'border-2 border-blue-500 shadow-md' : 'border border-gray-200 hover:border-blue-300'
                } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                onClick={() => !disabled && onChange?.(option.value)}
              >
                <Space direction="vertical" size="middle" className="w-full">
                  <div className="flex items-center gap-3">
                    {option.icon}
                    <Title level={5} className="mb-0">
                      {option.label}
                    </Title>
                  </div>

                  <Paragraph className="mb-0 text-sm text-gray-600">{option.description}</Paragraph>

                  <div>
                    <Text className="text-xs font-semibold text-gray-500">Key Features:</Text>
                    <ul className="mt-1 mb-0 list-inside list-disc text-xs text-gray-600">
                      {option.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Radio.Group>
    </div>
  );
});

StageTypeSelector.displayName = 'StageTypeSelector';

export default StageTypeSelector;
