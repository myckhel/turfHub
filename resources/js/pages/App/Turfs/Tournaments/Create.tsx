import { ArrowLeftOutlined, SaveOutlined, TrophyOutlined } from '@ant-design/icons';
import { Head, router } from '@inertiajs/react';
import { Button, Card, Col, DatePicker, Form, Input, InputNumber, message, Row, Select, Steps, Typography } from 'antd';
import dayjs from 'dayjs';
import { memo, useState } from 'react';
import { tournamentApi } from '../../../../apis/tournament';
import type { Turf } from '../../../../types/turf.types';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Step } = Steps;

interface CreateProps {
  turf: Turf;
}

const Create = ({ turf }: CreateProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [processing, setProcessing] = useState(false);

  const [data, setData] = useState({
    name: '',
    turf_id: turf.id,
    type: 'multi_stage_tournament' as const,
    starts_at: '',
    ends_at: '',
    settings: {
      description: '',
      location: turf.location,
      registration_fee: 0,
      prize_pool: 0,
    },
  });

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      setProcessing(true);

      await tournamentApi.create(data);

      message.success('Tournament created successfully');
      router.visit(route('web.turfs.tournaments.index', { turf: turf.id }));
    } catch (error) {
      console.error('Form submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create tournament. Please try again.';
      message.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleBack = () => {
    router.visit(route('web.turfs.tournaments.index', { turf: turf.id }));
  };

  const steps = [
    {
      title: 'Basic Info',
      description: 'Tournament details',
    },
    {
      title: 'Settings',
      description: 'Additional configuration',
    },
    {
      title: 'Review',
      description: 'Confirm and create',
    },
  ];

  const next = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields(['name', 'type', 'starts_at']);
      } else if (currentStep === 1) {
        await form.validateFields(['location', 'description']);
      }
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <>
      <Head title={`Create Tournament - ${turf.name}`} />
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
                  Create Tournament
                </Title>
                <Text className="text-gray-600">Create a new tournament for {turf.name}</Text>
              </div>
            </div>
          </Card>

          {/* Steps */}
          <Card className="mb-6 shadow-sm">
            <Steps current={currentStep}>
              {steps.map((item) => (
                <Step key={item.title} title={item.title} description={item.description} />
              ))}
            </Steps>
          </Card>

          {/* Form */}
          <Card className="shadow-sm">
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                name: data.name,
                type: data.type,
                location: data.settings?.location,
                description: data.settings?.description,
              }}
              onValuesChange={(changedValues) => {
                if ('name' in changedValues) {
                  setData({ ...data, name: changedValues.name });
                }
                if ('type' in changedValues) {
                  setData({ ...data, type: changedValues.type });
                }
                if ('location' in changedValues) {
                  setData({ ...data, settings: { ...data.settings, location: changedValues.location } });
                }
                if ('description' in changedValues) {
                  setData({ ...data, settings: { ...data.settings, description: changedValues.description } });
                }
                if ('registration_fee' in changedValues) {
                  setData({ ...data, settings: { ...data.settings, registration_fee: changedValues.registration_fee } });
                }
                if ('prize_pool' in changedValues) {
                  setData({ ...data, settings: { ...data.settings, prize_pool: changedValues.prize_pool } });
                }
              }}
            >
              {/* Step 1: Basic Info */}
              {currentStep === 0 && (
                <BasicInfoStep
                  data={data}
                  onStartDateChange={(date) => setData({ ...data, starts_at: date ? date.toISOString() : '' })}
                  onEndDateChange={(date) => setData({ ...data, ends_at: date ? date.toISOString() : '' })}
                />
              )}

              {/* Step 2: Settings */}
              {currentStep === 1 && <SettingsStep />}

              {/* Step 3: Review */}
              {currentStep === 2 && <ReviewStep data={data} turf={turf} />}
            </Form>

            {/* Navigation */}
            <div className="mt-6 flex justify-between border-t pt-4">
              <div>{currentStep > 0 && <Button onClick={prev}>Previous</Button>}</div>
              <div>
                {currentStep < steps.length - 1 && (
                  <Button type="primary" onClick={next}>
                    Next
                  </Button>
                )}
                {currentStep === steps.length - 1 && (
                  <Button type="primary" icon={<SaveOutlined />} loading={processing} onClick={handleSubmit}>
                    Create Tournament
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

// Step Components
interface StepProps {
  data: {
    name: string;
    type: string;
    starts_at: string;
    ends_at?: string;
    settings?: {
      location?: string;
      description?: string;
      registration_fee?: number;
      prize_pool?: number;
    };
  };
  onStartDateChange?: (date: dayjs.Dayjs | null) => void;
  onEndDateChange?: (date: dayjs.Dayjs | null) => void;
}

const BasicInfoStep = memo(({ data, onStartDateChange, onEndDateChange }: StepProps) => (
  <Row gutter={[16, 16]}>
    <Col span={24}>
      <Form.Item label="Tournament Name" name="name" rules={[{ required: true, message: 'Please enter tournament name' }]}>
        <Input placeholder="e.g., Summer Championship 2025" size="large" />
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
      <Form.Item label="Start Date" name="starts_at" rules={[{ required: true, message: 'Please select start date' }]}>
        <DatePicker
          size="large"
          className="w-full"
          format="YYYY-MM-DD"
          disabledDate={(current) => current && current < dayjs().startOf('day')}
          onChange={onStartDateChange}
        />
      </Form.Item>
    </Col>

    <Col span={24}>
      <Form.Item label="End Date (Optional)" name="ends_at">
        <DatePicker
          size="large"
          className="w-full"
          format="YYYY-MM-DD"
          disabledDate={(current) => current && current < dayjs(data.starts_at)}
          onChange={onEndDateChange}
        />
      </Form.Item>
    </Col>
  </Row>
));

BasicInfoStep.displayName = 'BasicInfoStep';

const SettingsStep = memo(() => (
  <Row gutter={[16, 16]}>
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
));

SettingsStep.displayName = 'SettingsStep';

interface ReviewStepProps {
  data: StepProps['data'];
  turf: Turf;
}

const ReviewStep = memo(({ data, turf }: ReviewStepProps) => (
  <div className="space-y-4">
    <div>
      <Title level={5}>Tournament Details</Title>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Text strong>Name:</Text>
          <div>{data.name}</div>
        </Col>
        <Col span={12}>
          <Text strong>Type:</Text>
          <div>{data.type === 'multi_stage_tournament' ? 'Multi-Stage Tournament' : 'Single Session'}</div>
        </Col>
        <Col span={12}>
          <Text strong>Turf:</Text>
          <div>{turf.name}</div>
        </Col>
        <Col span={12}>
          <Text strong>Start Date:</Text>
          <div>{data.starts_at ? dayjs(data.starts_at).format('MMM DD, YYYY') : 'Not set'}</div>
        </Col>
        {data.ends_at && (
          <Col span={12}>
            <Text strong>End Date:</Text>
            <div>{dayjs(data.ends_at).format('MMM DD, YYYY')}</div>
          </Col>
        )}
      </Row>
    </div>

    {(data.settings?.location || data.settings?.description || data.settings?.registration_fee || data.settings?.prize_pool) && (
      <div>
        <Title level={5}>Settings</Title>
        <Row gutter={[16, 16]}>
          {data.settings?.location && (
            <Col span={24}>
              <Text strong>Location:</Text>
              <div>{data.settings.location}</div>
            </Col>
          )}
          {data.settings?.description && (
            <Col span={24}>
              <Text strong>Description:</Text>
              <div>{data.settings.description}</div>
            </Col>
          )}
          {data.settings?.registration_fee && (
            <Col span={12}>
              <Text strong>Registration Fee:</Text>
              <div>₦{data.settings.registration_fee.toLocaleString()}</div>
            </Col>
          )}
          {data.settings?.prize_pool && (
            <Col span={12}>
              <Text strong>Prize Pool:</Text>
              <div>₦{data.settings.prize_pool.toLocaleString()}</div>
            </Col>
          )}
        </Row>
      </div>
    )}
  </div>
));

ReviewStep.displayName = 'ReviewStep';

export default Create;
