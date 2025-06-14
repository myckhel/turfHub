import { CalendarOutlined, CreditCardOutlined, TeamOutlined } from '@ant-design/icons';
import { Head, useForm } from '@inertiajs/react';
import { Alert, Button, Card, Descriptions, Form, InputNumber, Select, Space, Typography } from 'antd';
import { useState } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;

interface MatchSession {
    id: number;
    name: string;
    session_date: string;
    time_slot: string;
    turf: {
        id: number;
        name: string;
    };
}

interface Team {
    id: number;
    name: string;
}

interface Props {
    matchSession: MatchSession;
    team?: Team;
    paymentType: string;
    suggestedAmount: number;
    paymentTypes: Record<string, string>;
}

export default function Create({ matchSession, team, paymentType, suggestedAmount, paymentTypes }: Props) {
    const [loading, setLoading] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        match_session_id: matchSession.id,
        team_id: team?.id || null,
        amount: suggestedAmount,
        payment_type: paymentType,
        description: '',
    });

    const handleSubmit = () => {
        setLoading(true);
        post(route('payment.initialize'), {
            onFinish: () => setLoading(false),
            onError: () => setLoading(false),
        });
    };

    return (
        <>
            <Head title="Initialize Payment" />

            <div className="min-h-screen bg-gray-50 py-8">
                <div className="mx-auto max-w-2xl px-4">
                    <Card>
                        <div className="mb-6">
                            <Title level={2} className="mb-4 text-center">
                                <CreditCardOutlined className="mr-2" />
                                Payment Initialization
                            </Title>

                            {/* Match Session Info */}
                            <Card size="small" className="mb-4 bg-blue-50">
                                <Descriptions column={1} size="small">
                                    <Descriptions.Item
                                        label={
                                            <>
                                                <CalendarOutlined /> Match Session
                                            </>
                                        }
                                    >
                                        <Text strong>{matchSession.name}</Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Date">
                                        {new Date(matchSession.session_date).toLocaleDateString()} - {matchSession.time_slot}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Turf">{matchSession.turf.name}</Descriptions.Item>
                                    {team && (
                                        <Descriptions.Item
                                            label={
                                                <>
                                                    <TeamOutlined /> Team
                                                </>
                                            }
                                        >
                                            <Text strong>{team.name}</Text>
                                        </Descriptions.Item>
                                    )}
                                </Descriptions>
                            </Card>
                        </div>

                        {errors.payment && <Alert message="Payment Error" description={errors.payment} type="error" showIcon className="mb-4" />}

                        <Form layout="vertical" onFinish={handleSubmit}>
                            <Form.Item label="Payment Type" validateStatus={errors.payment_type ? 'error' : ''} help={errors.payment_type}>
                                <Select value={data.payment_type} onChange={(value) => setData('payment_type', value)} size="large">
                                    {Object.entries(paymentTypes).map(([key, label]) => (
                                        <Option key={key} value={key}>
                                            {label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                label="Amount (₦)"
                                validateStatus={errors.amount ? 'error' : ''}
                                help={errors.amount}
                                extra="Suggested amount based on session type"
                            >
                                <InputNumber
                                    value={data.amount}
                                    onChange={(value) => setData('amount', value || 0)}
                                    min={100}
                                    max={50000}
                                    size="large"
                                    style={{ width: '100%' }}
                                    formatter={(value) => `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(value) => value!.replace(/₦\s?|(,*)/g, '')}
                                />
                            </Form.Item>

                            <Form.Item label="Description (Optional)" validateStatus={errors.description ? 'error' : ''} help={errors.description}>
                                <Input.TextArea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    placeholder="Add any additional notes for this payment..."
                                />
                            </Form.Item>

                            <div className="mt-6">
                                <Space size="middle" className="w-full" direction="vertical">
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={processing || loading}
                                        size="large"
                                        block
                                        icon={<CreditCardOutlined />}
                                    >
                                        Proceed to Payment (₦{data.amount?.toLocaleString()})
                                    </Button>

                                    <Text type="secondary" className="block text-center">
                                        You will be redirected to Paystack to complete your payment
                                    </Text>
                                </Space>
                            </div>
                        </Form>
                    </Card>
                </div>
            </div>
        </>
    );
}
