import { MinusCircleOutlined, PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { App, Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, Tooltip, Typography } from 'antd';
import { format } from 'date-fns';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { bettingApi } from '../../apis/betting';
import type { CreateMarketRequest, MarketType } from '../../types/betting.types';
import { MARKET_TYPE_CONFIGS } from '../../types/betting.types';
import type { GameMatch } from '../../types/gameMatch.types';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface BettingMarketFormProps {
  gameMatch?: GameMatch;
  gameMatchId?: number;
  onSuccess?: (marketId: number) => void;
  onCancel?: () => void;
  loading?: boolean;
  className?: string;
}

interface FormData {
  name: string;
  description?: string;
  market_type: MarketType;
  options: FormOptionData[];
  min_stake_amount?: number;
  max_stake_amount?: number;
}

interface FormOptionData {
  name: string;
  odds: number;
}

const BettingMarketForm: React.FC<BettingMarketFormProps> = memo(
  ({ gameMatch, gameMatchId, onSuccess, onCancel, loading: externalLoading = false, className }) => {
    const { message } = App.useApp();
    const [form] = Form.useForm<FormData>();
    const [loading, setLoading] = useState(false);

    const finalGameMatchId = gameMatchId || gameMatch?.id;

    useEffect(() => {
      // Set default values when component mounts
      if (gameMatch) {
        form.setFieldsValue({
          name: `${gameMatch.first_team?.name || 'Team 1'} vs ${gameMatch.second_team?.name || 'Team 2'} - Match Result`,
          market_type: '1x2',
          min_stake_amount: gameMatch.min_stake_amount,
          max_stake_amount: gameMatch.max_stake_amount,
        });
      }
    }, [gameMatch, form]);

    const handleMarketTypeChange = useCallback(
      (marketType: MarketType) => {
        const config = MARKET_TYPE_CONFIGS[marketType];

        // Update market name
        const baseName = gameMatch ? `${gameMatch.first_team?.name || 'Team 1'} vs ${gameMatch.second_team?.name || 'Team 2'}` : 'Game Match';

        // Generate dynamic options for player_scoring market type
        let bettingOptions: FormOptionData[] = [];

        if (marketType === 'player_scoring' && gameMatch) {
          // Get players from both teams
          const firstTeamPlayers = gameMatch.first_team?.teamPlayers || [];
          const secondTeamPlayers = gameMatch.second_team?.teamPlayers || [];

          const firstTeamName = gameMatch.first_team?.name || 'Team 1';
          const secondTeamName = gameMatch.second_team?.name || 'Team 2';

          // Create betting options for each player
          bettingOptions = [
            ...firstTeamPlayers.map((teamPlayer, index) => ({
              name: `${teamPlayer.player.user.name} (${firstTeamName})`,
              odds: 3.5 + index * 0.1,
            })),
            ...secondTeamPlayers.map((teamPlayer, index) => ({
              name: `${teamPlayer.player.user.name} (${secondTeamName})`,
              odds: 3.5 + index * 0.1,
            })),
          ];
        } else {
          // Use default options for other market types
          bettingOptions = config.defaultOptions.map((option, index) => ({
            name: option,
            odds: 2.0 + index * 0.1, // Default odds starting from 2.0
          }));
        }

        form.setFieldsValue({
          name: `${baseName} - ${config.label}`,
          description: config.description,
          options: bettingOptions,
        });
      },
      [gameMatch, form],
    );

    const handleSubmit = useCallback(
      async (values: FormData) => {
        if (!finalGameMatchId) {
          message.error('Game match ID is required');
          return;
        }

        setLoading(true);
        try {
          const marketData: CreateMarketRequest = {
            game_match_id: finalGameMatchId,
            name: values.name,
            description: values.description || '',
            market_type: values.market_type,
            options: values.options.map((option) => ({
              name: option.name,
              key: option.name.toLowerCase().replace(/\s+/g, '_'),
              odds: option.odds,
            })),
            min_stake_amount: values.min_stake_amount,
            max_stake_amount: values.max_stake_amount,
          };

          const response = await bettingApi.createMarket(finalGameMatchId, marketData);
          message.success('Betting market created successfully');
          onSuccess?.(response.data.id);
          form.resetFields();
        } catch (error) {
          console.error('Failed to create betting market:', error);
          message.error('Failed to create betting market. Please try again.');
        } finally {
          setLoading(false);
        }
      },
      [finalGameMatchId, onSuccess, form, message],
    );

    const getTeamNames = useCallback(() => {
      if (gameMatch?.first_team?.name && gameMatch?.second_team?.name) {
        return {
          team1: gameMatch.first_team.name,
          team2: gameMatch.second_team.name,
        };
      }
      return {
        team1: 'Team 1',
        team2: 'Team 2',
      };
    }, [gameMatch]);

    const renderMarketTypeOptions = () => {
      return Object.entries(MARKET_TYPE_CONFIGS).map(([type, config]) => (
        <Option key={type} value={type}>
          <Space>
            <span>{config.icon}</span>
            <div>
              <div>{config.label}</div>
              {/* <Text type="secondary" style={{ fontSize: '12px' }}>
                {config.description}
              </Text> */}
            </div>
          </Space>
        </Option>
      ));
    };

    const renderGameMatchInfo = () => {
      if (!gameMatch) return null;

      return (
        <Card size="small" className="mb-4">
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Match:</Text>
              <div>
                {gameMatch.first_team?.name || 'Team 1'} vs {gameMatch.second_team?.name || 'Team 2'}
              </div>
            </Col>
            <Col span={12}>
              <Text strong>Match Time:</Text>
              <div>{gameMatch.match_time ? format(new Date(gameMatch.match_time), 'MMM dd, yyyy HH:mm') : 'Not scheduled'}</div>
            </Col>
          </Row>
        </Card>
      );
    };

    const { team1, team2 } = getTeamNames();

    return (
      <div className={className}>
        {renderGameMatchInfo()}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            market_type: '1x2',
            options: [
              { name: `${team1} Win`, odds: 2.0 },
              { name: 'Draw', odds: 3.2 },
              { name: `${team2} Win`, odds: 2.5 },
            ],
          }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Market Type" name="market_type" rules={[{ required: true, message: 'Please select a market type' }]}>
                <Select placeholder="Select market type" onChange={handleMarketTypeChange} size="large">
                  {renderMarketTypeOptions()}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Market Name" name="name" rules={[{ required: true, message: 'Please enter market name' }]}>
                <Input placeholder="Enter market name" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Description" name="description">
                <TextArea placeholder="Enter market description (optional)" rows={2} maxLength={255} showCount />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Min Stake Amount (₦)"
                name="min_stake_amount"
                tooltip="Minimum amount players can stake. Leave empty to use default (₦10)"
              >
                <InputNumber
                  placeholder="Default: 10"
                  min={1}
                  max={1000000}
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Max Stake Amount (₦)"
                name="max_stake_amount"
                tooltip="Maximum amount players can stake. Leave empty to use default (₦50,000)"
              >
                <InputNumber
                  placeholder="Default: 50,000"
                  min={1}
                  max={10000000}
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="mb-4">
            <Space align="center" className="mb-3">
              <Title level={5} style={{ margin: 0 }}>
                Betting Options
              </Title>
              <Tooltip title="Add betting options with their respective odds. Players will bet on these options.">
                <QuestionCircleOutlined />
              </Tooltip>
            </Space>

            <Form.List name="options">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field, index) => {
                    const { key, ...fieldProps } = field;
                    return (
                      <Card size="small" key={key} className="mb-3">
                        <Row gutter={16} align="middle">
                          <Col span={14}>
                            <Form.Item
                              {...fieldProps}
                              name={[field.name, 'name']}
                              label={`Option ${index + 1} Name`}
                              rules={[{ required: true, message: 'Please enter option name' }]}
                              style={{ marginBottom: 0 }}
                            >
                              <Input placeholder="e.g., Home Win" />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              {...fieldProps}
                              name={[field.name, 'odds']}
                              label="Odds"
                              rules={[
                                { required: true, message: 'Enter odds' },
                                { type: 'number', min: 1.01, message: 'Odds must be at least 1.01' },
                              ]}
                              style={{ marginBottom: 0 }}
                            >
                              <InputNumber placeholder="2.00" min={1.01} max={999.99} step={0.1} precision={2} style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>
                          <Col span={4}>
                            <Button
                              type="text"
                              danger
                              icon={<MinusCircleOutlined />}
                              onClick={() => remove(field.name)}
                              disabled={fields.length <= 2}
                              style={{ marginTop: '30px' }}
                            >
                              Remove
                            </Button>
                          </Col>
                        </Row>
                      </Card>
                    );
                  })}

                  <Button type="dashed" onClick={() => add({ name: '', odds: 2.0 })} block icon={<PlusOutlined />} disabled={fields.length >= 10}>
                    Add Betting Option {fields.length >= 10 ? '(Max 10)' : ''}
                  </Button>
                </>
              )}
            </Form.List>
          </div>

          <Row gutter={16} className="mt-6">
            <Col span={24}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                {onCancel && (
                  <Button onClick={onCancel} disabled={loading || externalLoading}>
                    Cancel
                  </Button>
                )}
                <Button type="primary" htmlType="submit" loading={loading || externalLoading} size="large">
                  Create Market
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </div>
    );
  },
);

BettingMarketForm.displayName = 'BettingMarketForm';

export default BettingMarketForm;
