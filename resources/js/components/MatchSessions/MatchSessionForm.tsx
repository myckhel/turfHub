import { SaveOutlined } from '@ant-design/icons';
import { router } from '@inertiajs/react';
import { Button, Card, Col, DatePicker, Form, Input, InputNumber, Row, Select, TimePicker, Typography, message } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { matchSessionApi } from '../../apis/matchSession';
import { usePermissions } from '../../hooks/usePermissions';
import type { CreateMatchSessionRequest, MatchSession, UpdateMatchSessionRequest } from '../../types/matchSession.types';

const { Title } = Typography;
const { Option } = Select;

interface MatchSessionFormProps {
  turfId: number;
  matchSession?: MatchSession;
  isEditing?: boolean;
}

interface FormValues {
  name: string;
  session_date: dayjs.Dayjs;
  time_slot: 'morning' | 'evening';
  start_time: dayjs.Dayjs;
  end_time: dayjs.Dayjs;
  max_teams: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
}

const MatchSessionForm: React.FC<MatchSessionFormProps> = ({ turfId, matchSession, isEditing = false }) => {
  const [form] = Form.useForm<FormValues>();
  const permissions = usePermissions();
  const canManageSessions = permissions.canManageSessions();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (matchSession && isEditing) {
      form.setFieldsValue({
        name: matchSession.name,
        session_date: dayjs(matchSession.session_date),
        time_slot: matchSession.time_slot,
        start_time: dayjs(matchSession.start_time, 'HH:mm'),
        end_time: dayjs(matchSession.end_time, 'HH:mm'),
        max_teams: matchSession.max_teams,
        status: matchSession.status,
      });
    }
  }, [matchSession, isEditing, form]);

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!canManageSessions) {
      message.error('You do not have permission to manage match sessions');
      router.visit(route('web.turfs.show', { turf: turfId }));
    }
  }, [canManageSessions, turfId]);

  const handleSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const formData = {
        turf_id: turfId,
        name: values.name,
        session_date: values.session_date.format('YYYY-MM-DD'),
        time_slot: values.time_slot,
        start_time: values.start_time.format('HH:mm'),
        end_time: values.end_time.format('HH:mm'),
        max_teams: values.max_teams,
        status: values.status || 'scheduled',
      };

      if (isEditing && matchSession) {
        const updateData: UpdateMatchSessionRequest = formData;
        await matchSessionApi.update(matchSession.id, updateData);
        message.success('Match session updated successfully');
      } else {
        const createData: CreateMatchSessionRequest = formData;
        await matchSessionApi.create(createData);
        message.success('Match session created successfully');
      }

      // Navigate back to turf details
      router.visit(route('web.turfs.show', { turf: turfId }));
    } catch (error: unknown) {
      console.error('Failed to save match session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save match session';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.visit(route('web.turfs.show', { turf: turfId }));
  };

  if (!canManageSessions) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-green-900">
      <div className="container mx-auto px-4 py-6">
        <Card className="mx-auto max-w-2xl">
          <Title level={2} className="mb-6 text-center">
            {isEditing ? 'Edit Match Session' : 'Create Match Session'}
          </Title>

          <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off" className="space-y-4">
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="name"
                  label="Session Name"
                  rules={[
                    { required: true, message: 'Please enter session name' },
                    { max: 255, message: 'Session name must be less than 255 characters' },
                  ]}
                >
                  <Input placeholder="e.g., Weekend Morning Match" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="session_date" label="Session Date" rules={[{ required: true, message: 'Please select session date' }]}>
                  <DatePicker
                    size="large"
                    className="w-full"
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="time_slot" label="Time Slot" rules={[{ required: true, message: 'Please select time slot' }]}>
                  <Select size="large" placeholder="Select time slot">
                    <Option value="morning">🌅 Morning</Option>
                    <Option value="evening">🌆 Evening</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="start_time" label="Start Time" rules={[{ required: true, message: 'Please select start time' }]}>
                  <TimePicker size="large" className="w-full" format="HH:mm" minuteStep={15} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="end_time"
                  label="End Time"
                  rules={[
                    { required: true, message: 'Please select end time' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const startTime = getFieldValue('start_time');
                        if (!value || !startTime) {
                          return Promise.resolve();
                        }
                        if (value.isAfter(startTime)) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('End time must be after start time'));
                      },
                    }),
                  ]}
                >
                  <TimePicker size="large" className="w-full" format="HH:mm" minuteStep={15} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="max_teams"
                  label="Maximum Teams"
                  rules={[
                    { required: true, message: 'Please enter maximum teams' },
                    { type: 'number', min: 4, max: 8, message: 'Teams must be between 4 and 8' },
                  ]}
                >
                  <InputNumber size="large" className="w-full" min={4} max={8} placeholder="4-8 teams" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="status" label="Status" initialValue="scheduled">
                  <Select size="large" placeholder="Select status">
                    <Option value="scheduled">Scheduled</Option>
                    <Option value="active">Active</Option>
                    <Option value="completed">Completed</Option>
                    <Option value="cancelled">Cancelled</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <div className="flex justify-end space-x-4 pt-6">
              <Button size="large" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                htmlType="submit"
                loading={loading}
                className="border-green-600 bg-green-600 hover:border-green-700 hover:bg-green-700"
              >
                {isEditing ? 'Update Session' : 'Create Session'}
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default MatchSessionForm;
