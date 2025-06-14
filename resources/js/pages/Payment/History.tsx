import { CreditCardOutlined, EyeOutlined } from '@ant-design/icons';
import { Head, Link } from '@inertiajs/react';
import { Button, Card, Pagination, Table, Tag, Typography } from 'antd';
import { useState } from 'react';

const { Title, Text } = Typography;

interface Payment {
    id: number;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    payment_type: string;
    payment_method: string;
    description: string;
    paid_at: string | null;
    created_at: string;
    match_session: {
        id: number;
        name: string;
        session_date: string;
        time_slot: string;
        turf: {
            name: string;
        };
    };
    team?: {
        name: string;
    };
}

interface PaymentHistory {
    payments: Payment[];
    total_amount: number;
    successful_payments: number;
}

interface Props {
    paymentHistory: PaymentHistory;
}

export default function History({ paymentHistory }: Props) {
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success':
                return 'green';
            case 'pending':
                return 'orange';
            case 'failed':
                return 'red';
            case 'cancelled':
                return 'default';
            default:
                return 'default';
        }
    };

    const getPaymentTypeLabel = (type: string) => {
        switch (type) {
            case 'session_fee':
                return 'Session Fee';
            case 'team_joining_fee':
                return 'Team Joining Fee';
            default:
                return type;
        }
    };

    const columns = [
        {
            title: 'Reference',
            dataIndex: 'reference',
            key: 'reference',
            render: (reference: string) => <code className="text-xs">{reference}</code>,
        },
        {
            title: 'Match Session',
            key: 'match_session',
            render: (record: Payment) => (
                <div>
                    <div className="font-medium">{record.match_session.name}</div>
                    <div className="text-sm text-gray-500">
                        {new Date(record.match_session.session_date).toLocaleDateString()} - {record.match_session.time_slot}
                    </div>
                    <div className="text-xs text-gray-400">{record.match_session.turf.name}</div>
                </div>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'payment_type',
            key: 'payment_type',
            render: (type: string) => <Tag color="blue">{getPaymentTypeLabel(type)}</Tag>,
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number) => <span className="font-medium">₦{amount.toLocaleString()}</span>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => <Tag color={getStatusColor(status)}>{status.charAt(0).toUpperCase() + status.slice(1)}</Tag>,
        },
        {
            title: 'Method',
            dataIndex: 'payment_method',
            key: 'payment_method',
            render: (method: string) => (method ? <Tag>{method}</Tag> : '-'),
        },
        {
            title: 'Date',
            key: 'date',
            render: (record: Payment) => (
                <div className="text-sm">
                    {record.paid_at ? new Date(record.paid_at).toLocaleDateString() : new Date(record.created_at).toLocaleDateString()}
                </div>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (record: Payment) => (
                <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => {
                        // Navigate to payment details or show modal
                        console.log('View payment details:', record.id);
                    }}
                >
                    View
                </Button>
            ),
        },
    ];

    const paginatedPayments = paymentHistory.payments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <>
            <Head title="Payment History" />

            <div className="min-h-screen bg-gray-50 py-8">
                <div className="mx-auto max-w-7xl px-4">
                    <div className="mb-6">
                        <Title level={2}>
                            <CreditCardOutlined className="mr-2" />
                            Payment History
                        </Title>
                    </div>

                    {/* Summary Cards */}
                    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Card>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">₦{paymentHistory.total_amount.toLocaleString()}</div>
                                <Text type="secondary">Total Amount Paid</Text>
                            </div>
                        </Card>
                        <Card>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{paymentHistory.successful_payments}</div>
                                <Text type="secondary">Successful Payments</Text>
                            </div>
                        </Card>
                        <Card>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-600">{paymentHistory.payments.length}</div>
                                <Text type="secondary">Total Transactions</Text>
                            </div>
                        </Card>
                    </div>

                    {/* Payments Table */}
                    <Card>
                        {paymentHistory.payments.length > 0 ? (
                            <>
                                <Table columns={columns} dataSource={paginatedPayments} rowKey="id" pagination={false} scroll={{ x: 800 }} />

                                {paymentHistory.payments.length > pageSize && (
                                    <div className="mt-4 text-center">
                                        <Pagination
                                            current={currentPage}
                                            pageSize={pageSize}
                                            total={paymentHistory.payments.length}
                                            onChange={setCurrentPage}
                                            showSizeChanger={false}
                                            showQuickJumper
                                            showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} payments`}
                                        />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="py-8 text-center">
                                <CreditCardOutlined className="mb-4 text-4xl text-gray-400" />
                                <Title level={4} type="secondary">
                                    No payments yet
                                </Title>
                                <Text type="secondary">You haven't made any payments yet. Start by joining a match session!</Text>
                                <div className="mt-4">
                                    <Link href={route('dashboard')}>
                                        <Button type="primary">Go to Dashboard</Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </>
    );
}
