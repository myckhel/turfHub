import {
  CheckOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  SettingOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { usePage } from '@inertiajs/react';
import { App, Button, Card, Col, Form, Input, message, Modal, Row, Select, Space, Statistic, Table, Tag, Tooltip, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { turfBettingApi } from '../../../apis/turfBetting';
import type { Bet, BetStatus, BettingMarket } from '../../../types/betting.types';
import type { PageProps } from '../../../types/global.types';

const { Title } = Typography;
const { Option } = Select;

interface BettingManagementPageProps extends PageProps {
  turfId: number;
}

const BettingManagement: React.FC = () => {
  const { turfId } = usePage<BettingManagementPageProps>().props;
  const { modal } = App.useApp();
  const [markets, setMarkets] = useState<BettingMarket[]>([]);
  const [bettingHistory, setBettingHistory] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<BettingMarket | null>(null);
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);
  const [settleModalVisible, setSettleModalVisible] = useState(false);
  const [betDetailsModalVisible, setBetDetailsModalVisible] = useState(false);
  const [settlingMarket, setSettlingMarket] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [marketsResponse, betsResponse] = await Promise.all([turfBettingApi.getTurfMarkets(turfId), turfBettingApi.getTurfBets(turfId)]);

      setMarkets(marketsResponse.data);
      setBettingHistory(betsResponse.data);
    } catch {
      message.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [turfId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSettleMarket = (market: BettingMarket) => {
    setSelectedMarket(market);
    setSettleModalVisible(true);
  };

  const handleViewBetDetails = (bet: Bet) => {
    setSelectedBet(bet);
    setBetDetailsModalVisible(true);
  };

  const onSettleMarket = async () => {
    if (!selectedMarket) return;

    try {
      setSettlingMarket(true);
      const values = await form.validateFields();
      await turfBettingApi.settleMarket(turfId, selectedMarket.id, {
        winning_option_ids: [values.winningOptionId],
        settlement_notes: values.settlementNotes,
        settlement_result: 'settled',
      });
      message.success(`Market "${selectedMarket.name}" settled successfully`);
      setSettleModalVisible(false);
      setSelectedMarket(null);
      form.resetFields();
      await fetchData();
    } catch (error) {
      if (error && typeof error === 'object' && 'errors' in error) {
        // Validation errors from form
        return;
      }
      const errorMessage = error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Failed to settle market';
      message.error(errorMessage);
    } finally {
      setSettlingMarket(false);
    }
  };

  const handleConfirmOfflinePayment = (bet: Bet) => {
    modal.confirm({
      title: 'Confirm Offline Payment',
      content: `Are you sure you want to confirm offline payment for bet #${bet.id}?`,
      icon: <ExclamationCircleOutlined />,
      okText: 'Confirm',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await turfBettingApi.confirmOfflinePayment(turfId, { bet_id: bet.id });
          message.success('Offline payment confirmed successfully');
          fetchData();
        } catch {
          message.error('Failed to confirm payment');
        }
      },
    });
  };

  const marketColumns = [
    {
      title: 'Market Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: BettingMarket) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-sm text-gray-500">ID: {record.id}</div>
        </div>
      ),
    },
    {
      title: 'Game Match',
      dataIndex: ['game_match', 'first_team', 'name'],
      key: 'gameMatch',
      render: (_: unknown, record: BettingMarket) => (
        <div className="text-sm">
          {record.game_match?.first_team?.name} vs {record.game_match?.second_team?.name}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          open: 'green',
          suspended: 'orange',
          settled: 'blue',
          cancelled: 'red',
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Total Bets',
      dataIndex: 'total_bets',
      key: 'totalBets',
      render: (value: number) => value || 0,
    },
    {
      title: 'Total Stake',
      dataIndex: 'total_stake',
      key: 'totalStake',
      render: (value: number) => `₦${(value || 0).toLocaleString()}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: BettingMarket) => (
        <Space>
          <Tooltip title="View Details">
            <Button icon={<EyeOutlined />} size="small" />
          </Tooltip>
          {record.status === 'active' && (
            <Tooltip title="Settle Market">
              <Button icon={<CheckOutlined />} size="small" type="primary" onClick={() => handleSettleMarket(record)} />
            </Tooltip>
          )}
          <Tooltip title="Market Settings">
            <Button icon={<SettingOutlined />} size="small" />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const betColumns = [
    {
      title: 'Bet ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'User',
      dataIndex: ['user', 'name'],
      key: 'user',
      render: (name: string, record: Bet) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-gray-500">ID: {record.user_id}</div>
        </div>
      ),
    },
    {
      title: 'Market & Option',
      key: 'marketOption',
      render: (record: Bet) => (
        <div>
          <div className="font-medium">{record.market_option?.betting_market?.name}</div>
          <div className="text-sm text-gray-500">{record.market_option?.name}</div>
        </div>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `₦${(amount || 0).toLocaleString()}`,
    },
    {
      title: 'Potential Payout',
      dataIndex: 'potential_payout',
      key: 'potentialPayout',
      render: (payout: number) => `₦${(payout || 0).toLocaleString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: BetStatus) => {
        const colors = {
          pending: 'orange',
          active: 'blue',
          won: 'green',
          lost: 'red',
          cancelled: 'red',
          refunded: 'gray',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Payment Method',
      dataIndex: 'payment_method',
      key: 'paymentMethod',
      render: (method: string) => method?.toUpperCase() || 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Bet) => (
        <Space>
          <Tooltip title="View Details">
            <Button icon={<EyeOutlined />} size="small" onClick={() => handleViewBetDetails(record)} />
          </Tooltip>
          {record.status === 'pending' && record.payment_method === 'offline' && (
            <Tooltip title="Confirm Offline Payment">
              <Button icon={<CheckOutlined />} size="small" type="primary" onClick={() => handleConfirmOfflinePayment(record)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const pendingBets = bettingHistory?.filter((bet: Bet) => bet.status === 'pending') || [];
  const totalStake = bettingHistory?.reduce((sum: number, bet: Bet) => sum + bet.stake_amount, 0) || 0;

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <Title level={2} className="mb-0 text-white">
            Turf Betting Management
          </Title>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            Refresh
          </Button>
        </div>

        {/* Quick Stats */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Active Markets" value={markets?.length || 0} prefix={<TrophyOutlined />} valueStyle={{ color: '#3f8600' }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Pending Bets" value={pendingBets.length} prefix={<ExclamationCircleOutlined />} valueStyle={{ color: '#faad14' }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Total Stakes"
                value={totalStake}
                prefix={<DollarOutlined />}
                formatter={(value) => `₦${Number(value).toLocaleString()}`}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Markets Table */}
        <Card title="Betting Markets" className="mb-6">
          <Table dataSource={markets} columns={marketColumns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 800 }} />
        </Card>

        {/* Bets Table */}
        <Card title="Recent Bets">
          <Table dataSource={bettingHistory} columns={betColumns} rowKey="id" loading={loading} pagination={{ pageSize: 15 }} scroll={{ x: 1000 }} />
        </Card>

        {/* Settle Market Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <TrophyOutlined className="text-yellow-500" />
              <span>Settle Market: {selectedMarket?.name}</span>
            </div>
          }
          open={settleModalVisible}
          onCancel={() => {
            setSettleModalVisible(false);
            form.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Form form={form} onFinish={onSettleMarket} layout="vertical">
            <Form.Item name="winningOptionId" label="Winning Option" rules={[{ required: true, message: 'Please select the winning option' }]}>
              <Select placeholder="Select the winning option" size="large">
                {selectedMarket?.market_options?.map((option) => (
                  <Option key={option.id} value={option.id}>
                    <div className="flex items-center justify-between">
                      <span>{option.name}</span>
                      <Tag color="blue">Odds: {option.odds}</Tag>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="settlementNotes" label="Settlement Notes (Optional)" help="Provide additional context for this settlement if needed">
              <Input.TextArea rows={3} placeholder="Enter any notes about this settlement..." maxLength={1000} showCount />
            </Form.Item>
            <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Note:</strong> Once settled, all confirmed bets will be processed automatically. Winning bets will receive payouts, and losing
                bets will be marked as lost.
              </p>
            </div>
            <Form.Item className="mt-6 mb-0">
              <Space className="w-full justify-end">
                <Button onClick={() => setSettleModalVisible(false)} disabled={settlingMarket}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" icon={<CheckOutlined />} loading={settlingMarket}>
                  Settle Market
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Bet Details Modal */}
        <Modal
          title={`Bet Details #${selectedBet?.id}`}
          open={betDetailsModalVisible}
          onCancel={() => setBetDetailsModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setBetDetailsModalVisible(false)}>
              Close
            </Button>,
          ]}
        >
          {selectedBet && (
            <div className="space-y-4">
              <div>
                <strong>User:</strong> {selectedBet.user?.name} (ID: {selectedBet.user_id})
              </div>
              <div>
                <strong>Market:</strong> {selectedBet.market_option?.betting_market?.name}
              </div>
              <div>
                <strong>Option:</strong> {selectedBet.market_option?.name}
              </div>
              <div>
                <strong>Amount:</strong> ₦{selectedBet.stake_amount.toLocaleString()}
              </div>
              <div>
                <strong>Potential Payout:</strong> ₦{selectedBet.potential_payout.toLocaleString()}
              </div>
              <div>
                <strong>Status:</strong> <Tag color="blue">{selectedBet.status.toUpperCase()}</Tag>
              </div>
              <div>
                <strong>Payment Method:</strong> {selectedBet.payment_method?.toUpperCase()}
              </div>
              <div>
                <strong>Created At:</strong> {new Date(selectedBet.created_at).toLocaleString()}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default BettingManagement;
