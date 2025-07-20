import { DeleteOutlined, EditOutlined, PlusOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, InputNumber, Modal, Popconfirm, Row, Select, Space, Table, Tag, Typography, message } from 'antd';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { matchEventApi } from '../../apis/gameMatch';
import type { CreateMatchEventRequest, GameMatch, MatchEvent, UpdateMatchEventRequest } from '../../types/gameMatch.types';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface MatchEventsListProps {
  gameMatch: GameMatch;
}

interface EventFormData {
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution_in' | 'substitution_out';
  player_id: number;
  team_id: number;
  minute: number;
  comment?: string;
  related_player_id?: number;
}

const MatchEventsList: React.FC<MatchEventsListProps> = memo(({ gameMatch }) => {
  const [events, setEvents] = useState<MatchEvent[]>(gameMatch.match_events || []);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MatchEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<EventFormData>();

  // merge both teams' players into a single list
  const teamPlayers = useMemo(
    () => [...(gameMatch.first_team?.teamPlayers || []), ...(gameMatch.second_team?.teamPlayers || [])],
    [gameMatch.first_team, gameMatch.second_team],
  );

  // Load events
  const loadEvents = useCallback(async () => {
    try {
      const response = await matchEventApi.getByGameMatch(gameMatch.id, {
        include: 'player.user,team,relatedPlayer.user',
      });
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  }, [gameMatch.id]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleAddEvent = () => {
    form.resetFields();
    setEditingEvent(null);
    setIsModalVisible(true);
  };

  const handleEditEvent = (event: MatchEvent) => {
    setEditingEvent(event);
    form.setFieldsValue({
      type: event.type,
      player_id: event.player_id,
      team_id: event.team_id,
      minute: event.minute,
      comment: event.comment,
      related_player_id: event.related_player_id,
    });
    setIsModalVisible(true);
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      await matchEventApi.delete(eventId);
      message.success('Event deleted successfully');
      await loadEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
      message.error('Failed to delete event');
    }
  };

  const handleSubmit = async (values: EventFormData) => {
    setLoading(true);
    try {
      if (editingEvent) {
        const updateData: UpdateMatchEventRequest = {
          type: values.type,
          player_id: values.player_id,
          team_id: values.team_id,
          minute: values.minute,
          comment: values.comment,
          related_player_id: values.related_player_id,
        };
        await matchEventApi.update(editingEvent.id, updateData);
        message.success('Event updated successfully');
      } else {
        const createData: CreateMatchEventRequest = {
          game_match_id: gameMatch.id,
          type: values.type,
          player_id: values.player_id,
          team_id: values.team_id,
          minute: values.minute,
          comment: values.comment,
          related_player_id: values.related_player_id,
        };
        await matchEventApi.create(createData);
        message.success('Event created successfully');
      }

      setIsModalVisible(false);
      await loadEvents();
    } catch (error) {
      console.error('Failed to save event:', error);
      message.error('Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'goal':
        return 'green';
      case 'yellow_card':
        return 'yellow';
      case 'red_card':
        return 'red';
      case 'substitution_in':
        return 'blue';
      case 'substitution_out':
        return 'orange';
      default:
        return 'default';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return '⚽';
      case 'yellow_card':
        return '🟨';
      case 'red_card':
        return '🟥';
      case 'substitution_in':
        return '🔄';
      case 'substitution_out':
        return '🔄';
      default:
        return '';
    }
  };

  const columns = [
    {
      title: 'Minute',
      dataIndex: 'minute',
      key: 'minute',
      width: 80,
      render: (minute: number) => <Text strong>{minute}'</Text>,
    },
    {
      title: 'Event',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Space>
          <span>{getEventTypeIcon(type)}</span>
          <Tag color={getEventTypeColor(type)}>{type.replace('_', ' ').toUpperCase()}</Tag>
        </Space>
      ),
    },
    {
      title: 'Player',
      key: 'player',
      render: (record: MatchEvent) => (
        <Space>
          <UserOutlined />
          <Text>{record.player?.user?.name || 'Unknown Player'}</Text>
        </Space>
      ),
    },
    {
      title: 'Team',
      key: 'team',
      render: (record: MatchEvent) => (
        <Tag color={record.team_id === gameMatch.first_team_id ? 'blue' : 'red'}>{record.team?.name || 'Unknown Team'}</Tag>
      ),
    },
    {
      title: 'Comment',
      dataIndex: 'comment',
      key: 'comment',
      render: (comment: string) => <Text type="secondary">{comment || '-'}</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (record: MatchEvent) => (
        <Space size="small">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEditEvent(record)} />
          <Popconfirm
            title="Delete Event"
            description="Are you sure you want to delete this event?"
            onConfirm={() => handleDeleteEvent(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title={
          <div className="flex items-center justify-between">
            <Title level={4} className="mb-0">
              Match Events
            </Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddEvent}>
              Add Event
            </Button>
          </div>
        }
      >
        {events.length > 0 ? (
          <Table dataSource={events} columns={columns} rowKey="id" pagination={false} size="small" scroll={{ x: 'max-content' }} />
        ) : (
          <div className="py-8 text-center">
            <Text type="secondary">No events recorded yet</Text>
          </div>
        )}
      </Card>

      {/* Add/Edit Event Modal */}
      <Modal
        title={editingEvent ? 'Edit Event' : 'Add Event'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="Event Type" rules={[{ required: true, message: 'Please select event type' }]}>
                <Select placeholder="Select event type">
                  <Option value="goal">⚽ Goal</Option>
                  <Option value="yellow_card">🟨 Yellow Card</Option>
                  <Option value="red_card">🟥 Red Card</Option>
                  <Option value="substitution_in">🔄 Substitution In</Option>
                  <Option value="substitution_out">🔄 Substitution Out</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="minute"
                label="Minute"
                rules={[
                  { required: true, message: 'Please enter minute' },
                  { type: 'number', min: 0, max: 120, message: 'Minute must be between 0 and 120' },
                ]}
              >
                <InputNumber min={0} max={120} placeholder="Match minute" className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="team_id" label="Team" rules={[{ required: true, message: 'Please select team' }]}>
                <Select placeholder="Select team">
                  <Option value={gameMatch.first_team_id}>{gameMatch.first_team?.name}</Option>
                  <Option value={gameMatch.second_team_id}>{gameMatch.second_team?.name}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="player_id" label="Player" rules={[{ required: true, message: 'Please select player' }]}>
                <Select placeholder="Select player" showSearch optionFilterProp="children">
                  {teamPlayers.map((player) => (
                    <Option key={player.player_id} value={player.player_id}>
                      {player.player.user.name} (
                      {player.team_id === gameMatch.first_team_id ? gameMatch.first_team?.name : gameMatch.second_team?.name})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}>
            {({ getFieldValue }) => {
              const eventType = getFieldValue('type');
              return eventType === 'substitution_in' || eventType === 'substitution_out' ? (
                <Form.Item name="related_player_id" label="Related Player (for substitution)">
                  <Select placeholder="Select related player" allowClear>
                    {teamPlayers.map((player) => (
                      <Option key={player.player_id} value={player.player_id}>
                        {player.player.user.name} (
                        {player.team_id === gameMatch.first_team_id ? gameMatch.first_team?.name : gameMatch.second_team?.name})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              ) : null;
            }}
          </Form.Item>

          <Form.Item name="comment" label="Comment">
            <TextArea rows={3} placeholder="Optional comment about the event" />
          </Form.Item>

          <div className="flex justify-end space-x-4">
            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
              {editingEvent ? 'Update Event' : 'Add Event'}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
});

export { MatchEventsList };
export default MatchEventsList;
