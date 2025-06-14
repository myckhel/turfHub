import { CalendarOutlined, CloseCircleOutlined, CreditCardOutlined, TeamOutlined } from '@ant-design/icons';
import { Head, Link } from '@inertiajs/react';
import { Button, Card, Descriptions, Result, Space, Tag } from 'antd';

interface Payment {
    id: number;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    gateway_response: string;
    description: string;
    created_at: string;
    match_session: {
        id: number;
        name: string;
        session_date: string;
        time_slot: string;
        turf: {
            id: number;
            name: string;
        };
    };
    team?: {
        id: number;
        name: string;
    };
}

interface Props {
    payment: Payment;
}

export default function Failed({ payment }: Props) {
    return (
        <>
            <Head title="Payment Failed" />

            <div className="min-h-screen bg-gray-50 py-8">
                <div className="mx-auto max-w-2xl px-4">
                    <Card>
                        <Result
                            icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                            status="error"
                            title="Payment Failed"
                            subTitle={`We couldn't process your payment of ₦${payment.amount.toLocaleString()}. Please try again.`}
                        />

                        <div className="mt-6">
                            <Card size="small" title="Payment Details" className="mb-4">
                                <Descriptions column={1} size="small">
                                    <Descriptions.Item label="Reference">
                                        <code>{payment.reference}</code>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Amount">
                                        <span className="text-lg font-semibold">₦{payment.amount.toLocaleString()}</span>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Status">
                                        <Tag color="red">Failed</Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Reason">{payment.gateway_response || 'Payment processing failed'}</Descriptions.Item>
                                    <Descriptions.Item label="Attempted At">{new Date(payment.created_at).toLocaleString()}</Descriptions.Item>
                                </Descriptions>
                            </Card>

                            <Card size="small" title="Match Session Details" className="mb-4">
                                <Descriptions column={1} size="small">
                                    <Descriptions.Item
                                        label={
                                            <>
                                                <CalendarOutlined /> Session
                                            </>
                                        }
                                    >
                                        {payment.match_session.name}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Date">
                                        {new Date(payment.match_session.session_date).toLocaleDateString()} - {payment.match_session.time_slot}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Turf">{payment.match_session.turf.name}</Descriptions.Item>
                                    {payment.team && (
                                        <Descriptions.Item
                                            label={
                                                <>
                                                    <TeamOutlined /> Team
                                                </>
                                            }
                                        >
                                            {payment.team.name}
                                        </Descriptions.Item>
                                    )}
                                </Descriptions>
                            </Card>

                            <div className="text-center">
                                <Space direction="vertical" size="middle">
                                    <Link
                                        href={route('payment.create', {
                                            match_session_id: payment.match_session.id,
                                            team_id: payment.team?.id,
                                            payment_type: 'session_fee',
                                        })}
                                    >
                                        <Button type="primary" size="large" danger>
                                            Try Payment Again
                                        </Button>
                                    </Link>

                                    <Space>
                                        <Link href={route('dashboard')}>
                                            <Button size="large">Go to Dashboard</Button>
                                        </Link>
                                        <Link href={route('payment.history')}>
                                            <Button size="large" icon={<CreditCardOutlined />}>
                                                View Payment History
                                            </Button>
                                        </Link>
                                    </Space>
                                </Space>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}
