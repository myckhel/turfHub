import { SaveOutlined } from '@ant-design/icons';
import { Button, Form, InputNumber, message, Modal, Typography } from 'antd';
import { memo, useState } from 'react';
import type { Fixture } from '../../../types/tournament.types';

const { Text, Title } = Typography;

interface SubmitResultModalProps {
  visible: boolean;
  fixture: Fixture;
  onClose: () => void;
  onSubmit: (fixtureId: number, homeScore: number, awayScore: number) => Promise<void>;
  loading?: boolean;
}

const SubmitResultModal = memo(({ visible, fixture, onClose, onSubmit, loading }: SubmitResultModalProps) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await onSubmit(fixture.id, values.homeScore, values.awayScore);
      message.success('Match result submitted successfully');
      form.resetFields();
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message || 'Failed to submit result');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Submit Match Result"
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={submitting || loading}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" icon={<SaveOutlined />} onClick={handleSubmit} loading={submitting || loading}>
          Submit Result
        </Button>,
      ]}
      width={500}
    >
      <div className="space-y-4">
        {/* Match Info */}
        <div className="rounded bg-blue-50 p-4 text-center">
          <div className="flex items-center justify-center gap-4">
            <div className="text-right">
              <Title level={5} className="mb-0">
                {fixture.first_team?.name || 'TBD'}
              </Title>
              <Text className="text-xs text-gray-500">Home</Text>
            </div>
            <Text className="text-2xl font-bold text-gray-400">vs</Text>
            <div className="text-left">
              <Title level={5} className="mb-0">
                {fixture.second_team?.name || 'TBD'}
              </Title>
              <Text className="text-xs text-gray-500">Away</Text>
            </div>
          </div>
        </div>

        {/* Score Form */}
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            homeScore: fixture.first_team_score || 0,
            awayScore: fixture.second_team_score || 0,
          }}
        >
          <div className="flex items-center justify-center gap-6">
            <Form.Item
              label={
                <Text strong className="block text-center">
                  {fixture.first_team?.name || 'Home'} Score
                </Text>
              }
              name="homeScore"
              rules={[
                { required: true, message: 'Required' },
                { type: 'number', min: 0, message: 'Must be 0 or more' },
              ]}
              className="mb-0 flex-1"
            >
              <InputNumber size="large" min={0} max={99} className="w-full" style={{ fontSize: '24px', textAlign: 'center' }} />
            </Form.Item>

            <div className="mt-6 text-2xl font-bold text-gray-400">-</div>

            <Form.Item
              label={
                <Text strong className="block text-center">
                  {fixture.second_team?.name || 'Away'} Score
                </Text>
              }
              name="awayScore"
              rules={[
                { required: true, message: 'Required' },
                { type: 'number', min: 0, message: 'Must be 0 or more' },
              ]}
              className="mb-0 flex-1"
            >
              <InputNumber size="large" min={0} max={99} className="w-full" style={{ fontSize: '24px', textAlign: 'center' }} />
            </Form.Item>
          </div>
        </Form>

        {/* Info */}
        <div className="rounded border border-yellow-200 bg-yellow-50 p-3">
          <Text className="text-xs text-gray-600">
            💡 Tip: Ensure scores are accurate before submitting. This will update rankings and statistics.
          </Text>
        </div>
      </div>
    </Modal>
  );
});

SubmitResultModal.displayName = 'SubmitResultModal';

export default SubmitResultModal;
