import { Col, Form, InputNumber, Row, Select, Switch, Typography } from 'antd';
import { memo } from 'react';
import type { StageSettings, StageType } from '../../../types/tournament.types';

const { Title, Text } = Typography;

interface StageSettingsFormProps {
  stageType: StageType;
  value?: StageSettings;
  onChange?: (value: StageSettings) => void;
}

const StageSettingsForm = memo(({ stageType, value, onChange }: StageSettingsFormProps) => {
  const handleFieldChange = (field: keyof StageSettings, fieldValue: unknown) => {
    onChange?.({
      ...value,
      [field]: fieldValue,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Title level={5}>Stage Settings</Title>
        <Text type="secondary">Configure settings specific to {stageType} stage</Text>
      </div>

      <Row gutter={[16, 16]}>
        {/* Common Settings */}
        <Col xs={24} md={12}>
          <Form.Item label="Match Duration (minutes)" tooltip="Duration of each match in minutes">
            <InputNumber
              className="w-full"
              min={1}
              max={120}
              value={value?.match_duration || 12}
              onChange={(val) => handleFieldChange('match_duration', val)}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item label="Match Interval (minutes)" tooltip="Break time between matches">
            <InputNumber
              className="w-full"
              min={0}
              max={60}
              value={value?.match_interval || 5}
              onChange={(val) => handleFieldChange('match_interval', val)}
            />
          </Form.Item>
        </Col>

        {/* League-specific Settings */}
        {(stageType === 'league' || stageType === 'group') && (
          <>
            <Col xs={24} md={12}>
              <Form.Item label="Number of Rounds" tooltip="How many times teams play each other">
                <InputNumber className="w-full" min={1} max={4} value={value?.rounds || 1} onChange={(val) => handleFieldChange('rounds', val)} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Home & Away" tooltip="Enable home and away fixtures">
                <Switch checked={value?.home_and_away || false} onChange={(checked) => handleFieldChange('home_and_away', checked)} />
              </Form.Item>
            </Col>
          </>
        )}

        {/* Group-specific Settings */}
        {stageType === 'group' && (
          <>
            <Col xs={24} md={12}>
              <Form.Item label="Number of Groups" tooltip="How many groups to create" required>
                <InputNumber
                  className="w-full"
                  min={2}
                  max={8}
                  value={value?.groups_count || 2}
                  onChange={(val) => handleFieldChange('groups_count', val)}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Teams per Group" tooltip="Target number of teams in each group">
                <InputNumber
                  className="w-full"
                  min={2}
                  max={16}
                  value={value?.teams_per_group || 4}
                  onChange={(val) => handleFieldChange('teams_per_group', val)}
                />
              </Form.Item>
            </Col>
          </>
        )}

        {/* Knockout-specific Settings */}
        {stageType === 'knockout' && (
          <>
            <Col xs={24} md={12}>
              <Form.Item label="Legs" tooltip="Single-leg (one match) or two-leg (home & away)">
                <Select
                  className="w-full"
                  value={value?.legs || 1}
                  onChange={(val) => handleFieldChange('legs', val)}
                  options={[
                    { label: 'Single Leg', value: 1 },
                    { label: 'Two Legs (Home & Away)', value: 2 },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Seeding" tooltip="Use team rankings for bracket seeding">
                <Switch checked={value?.seeding || false} onChange={(checked) => handleFieldChange('seeding', checked)} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Third Place Match" tooltip="Play match for 3rd/4th place">
                <Switch checked={value?.third_place_match || false} onChange={(checked) => handleFieldChange('third_place_match', checked)} />
              </Form.Item>
            </Col>
          </>
        )}

        {/* Scoring System */}
        <Col span={24}>
          <Title level={5} className="mt-4">
            Scoring System
          </Title>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item label="Points for Win">
            <InputNumber
              className="w-full"
              min={0}
              value={value?.scoring?.win || 3}
              onChange={(val) =>
                handleFieldChange('scoring', {
                  win: val || 3,
                  draw: value?.scoring?.draw || 1,
                  loss: value?.scoring?.loss || 0,
                })
              }
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item label="Points for Draw">
            <InputNumber
              className="w-full"
              min={0}
              value={value?.scoring?.draw || 1}
              onChange={(val) =>
                handleFieldChange('scoring', {
                  win: value?.scoring?.win || 3,
                  draw: val || 1,
                  loss: value?.scoring?.loss || 0,
                })
              }
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item label="Points for Loss">
            <InputNumber
              className="w-full"
              min={0}
              value={value?.scoring?.loss || 0}
              onChange={(val) =>
                handleFieldChange('scoring', {
                  win: value?.scoring?.win || 3,
                  draw: value?.scoring?.draw || 1,
                  loss: val || 0,
                })
              }
            />
          </Form.Item>
        </Col>

        {/* Tie Breakers */}
        {(stageType === 'league' || stageType === 'group' || stageType === 'swiss') && (
          <Col span={24}>
            <Form.Item label="Tie Breaker Rules" tooltip="Order of tie-breaking rules when teams have equal points">
              <Select
                mode="multiple"
                className="w-full"
                placeholder="Select tie-breaker order"
                value={value?.tie_breakers || ['goal_difference', 'goals_for']}
                onChange={(val) => handleFieldChange('tie_breakers', val)}
                options={[
                  { label: 'Goal Difference', value: 'goal_difference' },
                  { label: 'Goals For', value: 'goals_for' },
                  { label: 'Head-to-Head', value: 'head_to_head' },
                  { label: 'Fair Play', value: 'fair_play' },
                  { label: 'Random', value: 'random' },
                ]}
              />
            </Form.Item>
          </Col>
        )}
      </Row>
    </div>
  );
});

StageSettingsForm.displayName = 'StageSettingsForm';

export default StageSettingsForm;
