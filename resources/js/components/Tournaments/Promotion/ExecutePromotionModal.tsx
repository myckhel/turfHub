import { AlertOutlined, CheckCircleOutlined, EditOutlined } from '@ant-design/icons';
import { Checkbox, Form, Input, message, Modal, Select, Space, Tag, Typography } from 'antd';
import { memo, useState } from 'react';
import { useTournamentStore } from '../../../stores';
import type { ExecutePromotionRequest, StageTeam } from '../../../types/tournament.types';

const { Text } = Typography;
const { TextArea } = Input;

interface ExecutePromotionModalProps {
  visible: boolean;
  stageId: number;
  promotedTeams: StageTeam[];
  nextStageName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ExecutePromotionModal = memo(({ visible, stageId, promotedTeams, nextStageName, onClose, onSuccess }: ExecutePromotionModalProps) => {
  const [form] = Form.useForm();
  const { executePromotion, isPromoting } = useTournamentStore();
  const [useOverride, setUseOverride] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const request: ExecutePromotionRequest = {
        team_ids: useOverride ? values.team_ids : undefined,
        override_reason: useOverride ? values.override_reason : undefined,
      };

      await executePromotion(stageId, request);
      message.success('Promotion executed successfully!');
      form.resetFields();
      setUseOverride(false);
      onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        message.error(`Failed to execute promotion: ${error.message}`);
      }
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setUseOverride(false);
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <CheckCircleOutlined />
          <span>Execute Promotion</span>
        </Space>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={isPromoting}
      okText="Execute Promotion"
      okButtonProps={{ danger: useOverride }}
      width={600}
    >
      <Form form={form} layout="vertical" className="mt-4">
        {/* Warning Alert */}
        <div className="mb-4 rounded bg-yellow-50 p-3">
          <Space>
            <AlertOutlined className="text-yellow-600" />
            <Text>
              This will promote {promotedTeams.length} team{promotedTeams.length !== 1 ? 's' : ''} to <strong>{nextStageName}</strong>. This action
              cannot be undone.
            </Text>
          </Space>
        </div>

        {/* Teams to Promote */}
        <div className="mb-4">
          <Text strong className="mb-2 block">
            Teams to be Promoted:
          </Text>
          <Space wrap>
            {promotedTeams.map((team) => (
              <Tag key={team.id} color="green">
                {team.name}
              </Tag>
            ))}
          </Space>
        </div>

        {/* Override Option */}
        <Form.Item>
          <Checkbox checked={useOverride} onChange={(e) => setUseOverride(e.target.checked)}>
            <Space>
              <EditOutlined />
              <Text>Manual Override (select specific teams)</Text>
            </Space>
          </Checkbox>
        </Form.Item>

        {useOverride && (
          <>
            {/* Team Selection */}
            <Form.Item name="team_ids" label="Select Teams to Promote" rules={[{ required: true, message: 'Please select at least one team' }]}>
              <Select
                mode="multiple"
                placeholder="Select teams"
                options={promotedTeams.map((team) => ({
                  label: team.name,
                  value: team.id,
                }))}
              />
            </Form.Item>

            {/* Override Reason */}
            <Form.Item
              name="override_reason"
              label="Reason for Override"
              rules={[
                { required: true, message: 'Please provide a reason for the override' },
                { min: 10, message: 'Reason must be at least 10 characters' },
              ]}
            >
              <TextArea rows={3} placeholder="Explain why you are manually overriding the automatic promotion..." />
            </Form.Item>

            {/* Override Warning */}
            <div className="rounded bg-red-50 p-3">
              <Space>
                <AlertOutlined className="text-red-600" />
                <Text className="text-red-600">Manual override will ignore automatic promotion rules. Ensure you have a valid reason.</Text>
              </Space>
            </div>
          </>
        )}

        {/* Confirmation */}
        {!useOverride && (
          <div className="rounded bg-blue-50 p-3">
            <Text>
              The promotion will follow the configured promotion rules automatically. Click <strong>Execute Promotion</strong> to proceed.
            </Text>
          </div>
        )}
      </Form>
    </Modal>
  );
});

ExecutePromotionModal.displayName = 'ExecutePromotionModal';

export default ExecutePromotionModal;
