import { CalendarOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Divider, Form, Radio, Space, Typography } from 'antd';
import { memo, useState } from 'react';
import type { GenerateFixturesRequest } from '../../../types/tournament.types';

const { Title, Text, Paragraph } = Typography;

interface FixtureGeneratorProps {
  stageId: number;
  stageName: string;
  stageType: string;
  onGenerate: (stageId: number, data: GenerateFixturesRequest) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  disabled?: boolean;
  hasExistingFixtures?: boolean;
}

const FixtureGenerator = memo(
  ({ stageId, stageName, stageType, onGenerate, onCancel, loading, disabled, hasExistingFixtures }: FixtureGeneratorProps) => {
    const [form] = Form.useForm();
    const [mode, setMode] = useState<'auto' | 'manual'>('auto');

    const handleGenerate = async () => {
      try {
        const data: GenerateFixturesRequest = {
          mode,
        };
        await onGenerate(stageId, data);
      } catch {
        // Error handled by parent
      }
    };

    return (
      <Card>
        <div className="space-y-4">
          {/* Header */}
          <div>
            <Title level={4}>
              <CalendarOutlined className="mr-2" />
              Generate Fixtures for {stageName}
            </Title>
            <Text className="text-gray-600">Configure how fixtures should be generated for this stage</Text>
          </div>

          <Divider />

          {/* Warning for existing fixtures */}
          {hasExistingFixtures && (
            <Alert
              message="Existing Fixtures"
              description="This stage already has fixtures. Generating new fixtures will replace all existing ones."
              type="warning"
              showIcon
              className="mb-4"
            />
          )}

          {/* Form */}
          <Form form={form} layout="vertical">
            <Form.Item label="Generation Mode" required>
              <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)} className="w-full">
                <Space direction="vertical" className="w-full">
                  <Card
                    size="small"
                    hoverable
                    className={`cursor-pointer ${mode === 'auto' ? 'border-primary shadow-sm' : ''}`}
                    onClick={() => setMode('auto')}
                  >
                    <Radio value="auto">
                      <Space direction="vertical" size={0}>
                        <Text strong>
                          <ThunderboltOutlined /> Automatic Generation
                        </Text>
                        <Text className="text-xs text-gray-500">
                          Generate fixtures automatically based on stage type and settings. Recommended for most cases.
                        </Text>
                      </Space>
                    </Radio>
                  </Card>

                  <Card
                    size="small"
                    hoverable
                    className={`cursor-pointer ${mode === 'manual' ? 'border-primary shadow-sm' : ''}`}
                    onClick={() => setMode('manual')}
                  >
                    <Radio value="manual">
                      <Space direction="vertical" size={0}>
                        <Text strong>
                          <CalendarOutlined /> Manual Setup
                        </Text>
                        <Text className="text-xs text-gray-500">
                          Create fixture template for manual scheduling. You'll configure dates and times later.
                        </Text>
                      </Space>
                    </Radio>
                  </Card>
                </Space>
              </Radio.Group>
            </Form.Item>
          </Form>

          {/* Info based on stage type */}
          <div className="rounded bg-blue-50 p-4">
            <Text strong className="mb-2 block">
              Generation Details for {stageType} Stage:
            </Text>
            {stageType === 'league' && (
              <Paragraph className="mb-0 text-sm">
                • Round-robin format: All teams play against each other
                <br />
                • Home and away matches if enabled
                <br />• Fixtures distributed across configured rounds
              </Paragraph>
            )}
            {stageType === 'group' && (
              <Paragraph className="mb-0 text-sm">
                • Round-robin within each group
                <br />
                • Teams play others in their group
                <br />• Separate fixtures per group
              </Paragraph>
            )}
            {stageType === 'knockout' && (
              <Paragraph className="mb-0 text-sm">
                • Elimination bracket structure
                <br />
                • Winners advance to next round
                <br />• Single or double-leg matches
              </Paragraph>
            )}
            {stageType === 'swiss' && (
              <Paragraph className="mb-0 text-sm">
                • Pairing based on performance
                <br />
                • Teams with similar records play each other
                <br />• No elimination
              </Paragraph>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            )}
            <Button type="primary" icon={<CalendarOutlined />} onClick={handleGenerate} loading={loading} disabled={disabled}>
              Generate Fixtures
            </Button>
          </div>
        </div>
      </Card>
    );
  },
);

FixtureGenerator.displayName = 'FixtureGenerator';

export default FixtureGenerator;
