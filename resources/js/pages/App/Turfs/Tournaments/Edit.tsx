import { ArrowLeftOutlined, SaveOutlined, TrophyOutlined } from '@ant-design/icons';
import { Head, router, useForm } from '@inertiajs/react';
import { Button, Card, Col, DatePicker, Form, Input, InputNumber, message, Row, Select, Typography } from 'antd';
import dayjs from 'dayjs';
import type { Tournament } from '../../../../types/tournament.types';
import type { Turf } from '../../../../types/turf.types';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface EditProps {
  turf: Turf;
  tournament: Tournament;
}

const Edit = ({ turf, tournament }: EditProps) => {
  const [form] = Form.useForm();

  const { data, setData, patch, processing } = useForm({
    name: tournament.name,
    type: tournament.type,
    starts_at: tournament.starts_at,
    ends_at: tournament.ends_at || '',
    status: tournament.status,
    location: tournament.settings?.location || '',
    description: tournament.settings?.description || '',
    registration_fee: tournament.settings?.registration_fee || 0,
    prize_pool: tournament.settings?.prize_pool || 0,
  });

  const handleSubmit = async () => {
    try {
      await form.validateFields();

      patch(route('web.turfs.tournaments.update', { turf: turf.id, tournament: tournament.id }), {
        onSuccess: () => {
          message.success('Tournament updated successfully');
          router.visit(route('web.turfs.tournaments.show', { turf: turf.id, tournament: tournament.id }));
        },
        onError: (errors) => {
          console.error('Validation errors:', errors);
          message.error('Please fix the errors and try again');
        },
      });
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleBack = () => {
    router.visit(route('web.turfs.tournaments.show', { turf: turf.id, tournament: tournament.id }));
  };

  return (
    <>
      <Head title={`Edit ${tournament.name} - ${turf.name}`} />
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-6">
          {/* Header */}
          <Card className="mb-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
                Back
              </Button>
              <div>
                <Title level={2} className="mb-1 flex items-center gap-2">
                  <TrophyOutlined className="text-yellow-500" />
                  Edit Tournament
                </Title>
                <Text className="text-gray-600">{tournament.name}</Text>
              </div>
            </div>
          </Card>

          {/* Form */}
          <Card className="shadow-sm">
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                name: data.name,
                type: data.type,
                status: data.status,
                starts_at: data.starts_at ? dayjs(data.starts_at) : undefined,
                ends_at: data.ends_at ? dayjs(data.ends_at) : undefined,
                location: data.location,
                description: data.description,
                registration_fee: data.registration_fee,
                prize_pool: data.prize_pool,
              }}
              onValuesChange={(changedValues) => {
                if ('name' in changedValues) setData('name', changedValues.name);
                if ('type' in changedValues) setData('type', changedValues.type);
                if ('status' in changedValues) setData('status', changedValues.status);
                if ('starts_at' in changedValues) {
                  setData('starts_at', changedValues.starts_at ? changedValues.starts_at.toISOString() : '');
                }
                if ('ends_at' in changedValues) {
                  setData('ends_at', changedValues.ends_at ? changedValues.ends_at.toISOString() : '');
                }
                if ('location' in changedValues) setData('location', changedValues.location);
                if ('description' in changedValues) setData('description', changedValues.description);
                if ('registration_fee' in changedValues) setData('registration_fee', changedValues.registration_fee);
                if ('prize_pool' in changedValues) setData('prize_pool', changedValues.prize_pool);
              }}
            >
              <Row gutter={[16, 16]}>
                {/* Basic Information */}
                <Col span={24}>
                  <Title level={4}>Basic Information</Title>
                </Col>

                <Col span={24}>
                  <Form.Item label="Tournament Name" name="name" rules={[{ required: true, message: 'Please enter tournament name' }]}>
                    <Input placeholder="Tournament name" size="large" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Tournament Type" name="type" rules={[{ required: true, message: 'Please select tournament type' }]}>
                    <Select size="large" placeholder="Select type">
                      <Select.Option value="multi_stage_tournament">Multi-Stage Tournament</Select.Option>
                      <Select.Option value="single_session">Single Session</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Status" name="status">
                    <Select size="large" placeholder="Select status">
                      <Select.Option value="pending">Pending</Select.Option>
                      <Select.Option value="active">Active</Select.Option>
                      <Select.Option value="completed">Completed</Select.Option>
                      <Select.Option value="cancelled">Cancelled</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Start Date" name="starts_at" rules={[{ required: true, message: 'Please select start date' }]}>
                    <DatePicker size="large" className="w-full" format="YYYY-MM-DD" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="End Date (Optional)" name="ends_at">
                    <DatePicker size="large" className="w-full" format="YYYY-MM-DD" />
                  </Form.Item>
                </Col>

                {/* Settings */}
                <Col span={24}>
                  <Title level={4} className="mt-4">
                    Settings
                  </Title>
                </Col>

                <Col span={24}>
                  <Form.Item label="Location" name="location">
                    <Input placeholder="Tournament location" size="large" />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item label="Description" name="description">
                    <TextArea rows={4} placeholder="Describe the tournament..." />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Registration Fee (₦)" name="registration_fee">
                    <InputNumber className="w-full" size="large" min={0} placeholder="0" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Prize Pool (₦)" name="prize_pool">
                    <InputNumber className="w-full" size="large" min={0} placeholder="0" />
                  </Form.Item>
                </Col>
              </Row>

              {/* Actions */}
              <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                <Button onClick={handleBack}>Cancel</Button>
                <Button type="primary" icon={<SaveOutlined />} loading={processing} onClick={handleSubmit}>
                  Save Changes
                </Button>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Edit;
