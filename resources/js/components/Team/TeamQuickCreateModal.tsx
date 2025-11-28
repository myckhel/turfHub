import { Form, Input, Modal, message } from 'antd';
import { memo, useState } from 'react';
import { teamApi } from '../../apis/team';
import type { TeamDetails } from '../../types/team.types';

interface TeamQuickCreateModalProps {
  open: boolean;
  onClose: () => void;
  onTeamCreated: (team: TeamDetails) => void;
  turfId?: number;
  matchSessionId?: number;
}

const TeamQuickCreateModal = memo(({ open, onClose, onTeamCreated, turfId, matchSessionId }: TeamQuickCreateModalProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { name: string; color?: string }) => {
    setLoading(true);
    try {
      const data = await teamApi.createQuick({
        name: values.name,
        color: values.color || '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
        turf_id: turfId,
        match_session_id: matchSessionId,
      });

      message.success('Team created successfully');
      form.resetFields();
      onTeamCreated(data);
      onClose();
    } catch (error: unknown) {
      console.error('Failed to create team:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create team';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal title="Create New Team" open={open} onCancel={handleCancel} onOk={() => form.submit()} okText="Create" confirmLoading={loading}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Team Name"
          name="name"
          rules={[
            { required: true, message: 'Please enter team name' },
            { min: 2, message: 'Team name must be at least 2 characters' },
            { max: 50, message: 'Team name must not exceed 50 characters' },
          ]}
        >
          <Input placeholder="Enter team name" autoFocus />
        </Form.Item>

        <Form.Item
          label="Team Color"
          name="color"
          tooltip="Leave blank for random color"
          rules={[
            {
              pattern: /^#[0-9A-F]{6}$/i,
              message: 'Please enter a valid hex color (e.g., #FF5733)',
            },
          ]}
        >
          <Input placeholder="#FF5733" maxLength={7} />
        </Form.Item>
      </Form>
    </Modal>
  );
});

TeamQuickCreateModal.displayName = 'TeamQuickCreateModal';

export default TeamQuickCreateModal;
