import { PlusOutlined } from '@ant-design/icons';
import { Button, DatePicker, Form, InputNumber, Modal, Select, Space, Switch, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { memo, useCallback, useEffect, useState } from 'react';
import { gameMatchApi } from '../../apis/gameMatch';
import { teamApi } from '../../apis/team';
import type { CreateGameMatchRequest, GameMatch } from '../../types/gameMatch.types';
import type { TeamDetails } from '../../types/team.types';
import TeamQuickCreateModal from '../Team/TeamQuickCreateModal';

const { Text } = Typography;

interface CreateManualMatchModalProps {
  open: boolean;
  onClose: () => void;
  onMatchCreated: (match: GameMatch) => void;
  turfId: number;
}

const CreateManualMatchModal = memo(({ open, onClose, onMatchCreated, turfId }: CreateManualMatchModalProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<TeamDetails[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teamCreateModalOpen, setTeamCreateModalOpen] = useState(false);
  const [creatingTeamFor, setCreatingTeamFor] = useState<'first' | 'second' | null>(null);

  const loadTeams = useCallback(async () => {
    setLoadingTeams(true);
    try {
      const response = await teamApi.getByTurf(turfId);
      setTeams(response.data || []);
    } catch (error) {
      console.error('Failed to load teams:', error);
      message.error('Failed to load teams');
    } finally {
      setLoadingTeams(false);
    }
  }, [turfId]);

  useEffect(() => {
    if (open) {
      loadTeams();
    }
  }, [open, loadTeams]);

  const handleSubmit = async (values: {
    first_team_id: number;
    second_team_id: number;
    starts_at: dayjs.Dayjs;
    status?: string;
    betting_enabled?: boolean;
    min_stake_amount?: number;
    max_stake_amount?: number;
  }) => {
    setLoading(true);
    try {
      const matchData: CreateGameMatchRequest = {
        turf_id: turfId,
        first_team_id: values.first_team_id,
        second_team_id: values.second_team_id,
        starts_at: values.starts_at?.toISOString(),
        status: (values.status as 'upcoming' | 'in_progress' | 'completed' | 'postponed') || 'upcoming',
        betting_enabled: values.betting_enabled || false,
        min_stake_amount: values.min_stake_amount,
        max_stake_amount: values.max_stake_amount,
      };

      const response = await gameMatchApi.create(matchData);

      message.success('Match created successfully');
      form.resetFields();
      onMatchCreated(response);
      onClose();
    } catch (error: unknown) {
      console.error('Failed to create match:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create match';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const handleCreateTeam = (teamType: 'first' | 'second') => {
    setCreatingTeamFor(teamType);
    setTeamCreateModalOpen(true);
  };

  const handleTeamCreated = (team: TeamDetails) => {
    setTeams([...teams, team]);

    // Auto-select the newly created team
    if (creatingTeamFor === 'first') {
      form.setFieldValue('first_team_id', team.id);
    } else if (creatingTeamFor === 'second') {
      form.setFieldValue('second_team_id', team.id);
    }

    setCreatingTeamFor(null);
  };

  const renderTeamSelect = (fieldName: 'first_team_id' | 'second_team_id', label: string, otherFieldName: 'first_team_id' | 'second_team_id') => {
    const selectedOtherTeamId = form.getFieldValue(otherFieldName);

    return (
      <Form.Item
        label={label}
        name={fieldName}
        rules={[
          { required: true, message: `Please select ${label.toLowerCase()}` },
          {
            validator: (_, value) => {
              if (value && value === selectedOtherTeamId) {
                return Promise.reject('Teams must be different');
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <Select
          placeholder={`Select ${label.toLowerCase()}`}
          loading={loadingTeams}
          showSearch
          filterOption={(input, option) => (option?.label?.toString().toLowerCase() ?? '').includes(input.toLowerCase())}
          dropdownRender={(menu) => (
            <>
              {menu}
              <div className="border-t p-2">
                <Button
                  type="link"
                  icon={<PlusOutlined />}
                  onClick={() => handleCreateTeam(fieldName === 'first_team_id' ? 'first' : 'second')}
                  className="w-full"
                >
                  Create New Team
                </Button>
              </div>
            </>
          )}
          options={teams.map((team) => ({
            label: (
              <Space>
                <div className="h-3 w-3 rounded-full border" style={{ backgroundColor: team.color || '#1890ff' }} />
                <span>{team.name}</span>
              </Space>
            ),
            value: team.id,
            disabled: team.id === selectedOtherTeamId,
          }))}
        />
      </Form.Item>
    );
  };

  return (
    <>
      <Modal
        title="Create Manual Match"
        open={open}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        okText="Create Match"
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            {renderTeamSelect('first_team_id', 'First Team', 'second_team_id')}
            {renderTeamSelect('second_team_id', 'Second Team', 'first_team_id')}
          </div>

          <Form.Item
            label="Match Start Time"
            name="starts_at"
            rules={[{ required: true, message: 'Please select match start time' }]}
            initialValue={dayjs().add(1, 'hour')}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              placeholder="Select date and time"
              className="w-full"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          <Form.Item label="Status" name="status" initialValue="upcoming">
            <Select placeholder="Select match status">
              <Select.Option value="upcoming">Upcoming</Select.Option>
              <Select.Option value="in_progress">In Progress</Select.Option>
              <Select.Option value="completed">Completed</Select.Option>
              <Select.Option value="postponed">Postponed</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Enable Betting"
            name="betting_enabled"
            valuePropName="checked"
            initialValue={false}
            tooltip="Enable betting for this match. Default 1X2 market will be created automatically."
          >
            <Switch />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.betting_enabled !== currentValues.betting_enabled}>
            {({ getFieldValue }) =>
              getFieldValue('betting_enabled') ? (
                <div className="grid grid-cols-2 gap-4">
                  <Form.Item label="Min Stake (₦)" name="min_stake_amount" tooltip="Minimum bet amount. Leave empty to use default (₦10)">
                    <InputNumber
                      placeholder="Default: 10"
                      min={1}
                      max={1000000}
                      className="w-full"
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    />
                  </Form.Item>
                  <Form.Item label="Max Stake (₦)" name="max_stake_amount" tooltip="Maximum bet amount. Leave empty to use default (₦50,000)">
                    <InputNumber
                      placeholder="Default: 50,000"
                      min={1}
                      max={10000000}
                      className="w-full"
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    />
                  </Form.Item>
                </div>
              ) : null
            }
          </Form.Item>

          <div className="rounded bg-blue-50 p-3 dark:bg-blue-900/20">
            <Text type="secondary" className="text-sm">
              💡 <strong>Tip:</strong> You can create teams on the fly by clicking "Create New Team" in the team selection dropdown. Betting markets
              can be managed after match creation.
            </Text>
          </div>
        </Form>
      </Modal>

      <TeamQuickCreateModal
        open={teamCreateModalOpen}
        onClose={() => {
          setTeamCreateModalOpen(false);
          setCreatingTeamFor(null);
        }}
        onTeamCreated={handleTeamCreated}
        turfId={turfId}
      />
    </>
  );
});

CreateManualMatchModal.displayName = 'CreateManualMatchModal';

export default CreateManualMatchModal;
