import { ArrowLeftOutlined, DollarOutlined, EnvironmentOutlined, TeamOutlined } from '@ant-design/icons';
import { Head, router } from '@inertiajs/react';
import { Button, Card, Form, Input, InputNumber, message, Select, Switch, Typography } from 'antd';
import React, { useState } from 'react';
import { turfApi } from '../../../apis/turf';
import { useAuth } from '../../../hooks/useAuth';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface TurfFormData {
  name: string;
  description?: string;
  location: string;
  requires_membership: boolean;
  membership_fee?: number;
  membership_type?: string;
  team_slot_fee?: number;
  max_players_per_team: number;
  is_active: boolean;
}

const TurfCreate: React.FC = () => {
  const { user } = useAuth();
  const [form] = Form.useForm<TurfFormData>();
  const [loading, setLoading] = useState(false);
  const [requiresMembership, setRequiresMembership] = useState(false);
  const [hasTeamSlotFee, setHasTeamSlotFee] = useState(false);

  const handleSubmit = async (values: TurfFormData) => {
    if (!user) {
      message.error('You must be logged in to create a turf');
      return;
    }

    setLoading(true);
    try {
      const turfData = {
        ...values,
        owner_id: user.id,
        membership_fee: requiresMembership ? values.membership_fee : undefined,
        membership_type: requiresMembership ? values.membership_type : undefined,
        team_slot_fee: hasTeamSlotFee ? values.team_slot_fee : undefined,
      };

      const response = await turfApi.create(turfData);

      message.success('Turf created successfully!');
      router.visit(route('web.turfs.show', { turf: response.id }));
    } catch (error) {
      console.error('Failed to create turf:', error);
      message.error(error instanceof Error ? error.message : 'Failed to create turf');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.visit(route('web.turfs.index'));
  };

  return (
    <>
      <Head title="Create New Turf" />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack} className="mb-4 text-white hover:text-gray-300">
            Back to Turfs
          </Button>
          <Title level={2} className="mb-2 text-white">
            Create New Turf
          </Title>
          <Text className="text-base text-gray-300">Set up your football turf for players to join</Text>
        </div>
        {/* Form */}
        <Card className="mx-auto max-w-4xl">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              requires_membership: false,
              max_players_per_team: 11,
              is_active: true,
              membership_type: 'monthly',
              has_team_slot_fee: false,
            }}
          >
            {/* Basic Information */}
            <div className="mb-6">
              <Title level={4} className="mb-4">
                Basic Information
              </Title>

              <Form.Item
                label="Turf Name"
                name="name"
                rules={[
                  { required: true, message: 'Please enter turf name' },
                  { max: 255, message: 'Name must be less than 255 characters' },
                ]}
              >
                <Input placeholder="Enter turf name" size="large" />
              </Form.Item>

              <Form.Item
                label="Location"
                name="location"
                rules={[
                  { required: true, message: 'Please enter location' },
                  { max: 255, message: 'Location must be less than 255 characters' },
                ]}
              >
                <Input prefix={<EnvironmentOutlined />} placeholder="Enter turf location" size="large" />
              </Form.Item>

              <Form.Item label="Description" name="description" rules={[{ max: 1000, message: 'Description must be less than 1000 characters' }]}>
                <TextArea rows={4} placeholder="Describe your turf (optional)" maxLength={1000} showCount />
              </Form.Item>
            </div>

            {/* Game Settings */}
            <div className="mb-6">
              <Title level={4} className="mb-4">
                Game Settings
              </Title>

              <Form.Item
                label="Maximum Players per Team"
                name="max_players_per_team"
                rules={[
                  { required: true, message: 'Please enter maximum players per team' },
                  { type: 'number', min: 1, max: 100, message: 'Must be between 1 and 100 players' },
                ]}
              >
                <InputNumber prefix={<TeamOutlined />} placeholder="11" size="large" min={1} max={100} className="w-full" />
              </Form.Item>

              <Form.Item label="Turf Status" name="is_active" valuePropName="checked">
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" defaultChecked />
              </Form.Item>
            </div>

            {/* Membership Settings */}
            <div className="mb-6">
              <Title level={4} className="mb-4">
                Membership Settings
              </Title>

              <Form.Item label="Requires Membership" name="requires_membership" valuePropName="checked">
                <Switch checkedChildren="Required" unCheckedChildren="Not Required" onChange={setRequiresMembership} />
              </Form.Item>

              {requiresMembership && (
                <>
                  <Form.Item
                    label="Membership Fee"
                    name="membership_fee"
                    rules={[
                      { required: requiresMembership, message: 'Please enter membership fee' },
                      { type: 'number', min: 0, message: 'Fee must be a positive number' },
                    ]}
                  >
                    <InputNumber
                      prefix={<DollarOutlined />}
                      placeholder="0.00"
                      size="large"
                      min={0}
                      formatter={(value) => `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      className="w-full"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Membership Type"
                    name="membership_type"
                    rules={[
                      { required: requiresMembership, message: 'Please select membership type' },
                      { max: 100, message: 'Type must be less than 100 characters' },
                    ]}
                  >
                    <Select size="large" placeholder="Select membership type">
                      <Select.Option value="daily">Daily</Select.Option>
                      <Select.Option value="weekly">Weekly</Select.Option>
                      <Select.Option value="monthly">Monthly</Select.Option>
                      <Select.Option value="quarterly">Quarterly</Select.Option>
                      <Select.Option value="yearly">Yearly</Select.Option>
                    </Select>
                  </Form.Item>
                </>
              )}
            </div>

            {/* Team Slot Fee Settings */}
            <div className="mb-6">
              <Title level={4} className="mb-4">
                Team Slot Fee Settings
              </Title>

              <div className="mb-4">
                <Text className="text-sm text-gray-600">
                  Team slot fee is charged when players join a team in match sessions that require payment.
                </Text>
              </div>

              <Form.Item label="Enable Team Slot Fee" name="has_team_slot_fee" valuePropName="checked">
                <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" onChange={setHasTeamSlotFee} className="mb-2" />
              </Form.Item>

              {hasTeamSlotFee && (
                <Form.Item
                  label="Team Slot Fee"
                  name="team_slot_fee"
                  rules={[
                    { required: hasTeamSlotFee, message: 'Please enter team slot fee' },
                    { type: 'number', min: 0, message: 'Fee must be a positive number' },
                  ]}
                  extra="Amount charged per player when joining a team"
                >
                  <InputNumber
                    prefix={<DollarOutlined />}
                    placeholder="0.00"
                    size="large"
                    min={0}
                    step={10}
                    formatter={(value) => `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    className="w-full"
                  />
                </Form.Item>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button type="default" size="large" onClick={handleBack} disabled={loading}>
                Cancel
              </Button>
              <Button type="primary" size="large" htmlType="submit" loading={loading}>
                Create Turf
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </>
  );
};

export default TurfCreate;
