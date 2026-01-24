import { Form, Input, message, Modal } from 'antd';
import { memo, useEffect } from 'react';
import { teamApi } from '../../apis/team';

interface TeamFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tournamentId: number;
  team?: {
    id: number;
    name: string;
  };
}

interface TeamFormValues {
  name: string;
}

const TeamFormModal = memo(({ open, onClose, onSuccess, tournamentId, team }: TeamFormModalProps) => {
  const [form] = Form.useForm<TeamFormValues>();
  const isEditing = !!team;

  useEffect(() => {
    if (open && team) {
      form.setFieldsValue({ name: team.name });
    } else if (open) {
      form.resetFields();
    }
  }, [open, team, form]);

  const handleSubmit = async (values: TeamFormValues) => {
    try {
      if (isEditing && team) {
        await teamApi.update(team.id, {
          name: values.name,
          tournament_id: tournamentId,
        });
        message.success('Team updated successfully');
      } else {
        await teamApi.create({
          name: values.name,
          tournament_id: tournamentId,
        });
        message.success('Team created successfully');
      }
      form.resetFields();
      onSuccess();
      onClose();
    } catch {
      message.error(isEditing ? 'Failed to update team' : 'Failed to create team');
    }
  };

  return (
    <Modal
      title={isEditing ? 'Edit Team' : 'Create Team'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={isEditing ? 'Update' : 'Create'}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="name"
          label="Team Name"
          rules={[
            { required: true, message: 'Please enter team name' },
            { max: 255, message: 'Team name must be less than 255 characters' },
          ]}
        >
          <Input placeholder="Enter team name" autoFocus />
        </Form.Item>
      </Form>
    </Modal>
  );
});

TeamFormModal.displayName = 'TeamFormModal';

export default TeamFormModal;
