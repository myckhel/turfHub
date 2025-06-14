import { CalendarOutlined, CheckCircleOutlined, CreditCardOutlined, TeamOutlined } from '@ant-design/icons';
import { Head, Link } from '@inertiajs/react';
import { Button, Card, Descriptions, Result, Space, Tag } from 'antd';

interface Payment {
    id: number;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    payment_method: string;
    description: string;
    paid_at: string;
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

export default function Success({ payment }: Props) {
    return (
        <>
            <Head title="Payment Successful" />

            <div className="min-h-screen bg-gray-50 py-8">
                <div className="mx-auto max-w-2xl px-4">
                    <Card>
                        <Result
                            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            status="success"
                            title="Payment Successful!"
                            subTitle={`Your payment of ₦${payment.amount.toLocaleString()} has been processed successfully.`}
                        />

                        <div className="mt-6">
                            <Card size="small" title="Payment Details" className="mb-4">
                                <Descriptions column={1} size="small">
                                    <Descriptions.Item label="Reference">
                                        <code>{payment.reference}</code>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Amount">
                                        <span className="text-lg font-semibold text-green-600">₦{payment.amount.toLocaleString()}</span>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Payment Method">
                                        <Tag color="blue">{payment.payment_method}</Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Status">
                                        <Tag color="green">Successful</Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Paid At">{new Date(payment.paid_at).toLocaleString()}</Descriptions.Item>
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

                            {payment.description && (
                                <Card size="small" title="Description" className="mb-4">
                                    <p>{payment.description}</p>
                                </Card>
                            )}

                            <div className="text-center">
                                <Space>
                                    <Link href={route('dashboard')}>
                                        <Button type="primary" size="large">
                                            Go to Dashboard
                                        </Button>
                                    </Link>
                                    <Link href={route('payment.history')}>
                                        <Button size="large" icon={<CreditCardOutlined />}>
                                            View Payment History
                                        </Button>
                                    </Link>
                                </Space>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}
