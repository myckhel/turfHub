import {
  CheckOutlined,
  CloseOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileImageOutlined,
  ReloadOutlined,
  SettingOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { Head, usePage } from '@inertiajs/react';
import { App, Button, Card, Checkbox, Col, Form, Input, message, Modal, Row, Space, Statistic, Table, Tag, Tooltip, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { turfBettingApi } from '../../../apis/turfBetting';
import BetReceiptDisplay from '../../../components/betting/BetReceiptDisplay';
import type { Bet, BetStatus, BettingMarket, MarketOption } from '../../../types/betting.types';
import type { PageProps } from '../../../types/global.types';
import { formatCurrency } from '../../../utils/format';

const { Title, Text } = Typography;

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
  const [selectedWinningOptions, setSelectedWinningOptions] = useState<number[]>([]);
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
    setSelectedWinningOptions([]);
    setSettleModalVisible(true);
  };

  const handleOptionSelect = (optionId: number, checked: boolean) => {
    setSelectedWinningOptions((prev) => {
      if (checked) {
        return [...prev, optionId];
      } else {
        return prev.filter((id) => id !== optionId);
      }
    });
  };

  const handleViewBetDetails = (bet: Bet) => {
    setSelectedBet(bet);
    setBetDetailsModalVisible(true);
  };

  const onSettleMarket = async () => {
    if (!selectedMarket) return;

    if (selectedWinningOptions.length === 0) {
      message.error('Please select at least one winning option');
      return;
    }

    try {
      setSettlingMarket(true);
      const values = await form.validateFields();
      await turfBettingApi.settleMarket(turfId, selectedMarket.id, {
        winning_option_ids: selectedWinningOptions,
        settlement_notes: values.settlementNotes,
        settlement_result: 'settled',
      });
      message.success(`Market "${selectedMarket.name}" settled successfully`);
      setSettleModalVisible(false);
      setSelectedMarket(null);
      setSelectedWinningOptions([]);
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
      content: `Are you sure you want to confirm offline payment for bet #${bet.id}? This will activate the bet and the user will be eligible for payouts if they win.`,
      icon: <CheckOutlined className="text-green-500" />,
      okText: 'Confirm Payment',
      okType: 'primary',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await turfBettingApi.confirmOfflinePayment(turfId, { bet_id: bet.id });
          message.success('Offline payment confirmed successfully');
          setBetDetailsModalVisible(false);
          await fetchData();
        } catch {
          message.error('Failed to confirm payment');
        }
      },
    });
  };

  const handleRejectOfflinePayment = (bet: Bet) => {
    let reason = '';

    modal.confirm({
      title: 'Reject Offline Payment',
      content: (
        <div className="space-y-3">
          <p className="text-red-600">Are you sure you want to reject this payment? This action cannot be undone.</p>
          <div>
            <label className="mb-1 block text-sm font-medium">Rejection Reason (Optional):</label>
            <Input.TextArea
              placeholder="e.g., Invalid receipt, incorrect amount, unclear image..."
              rows={3}
              maxLength={500}
              onChange={(e) => (reason = e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      ),
      icon: <CloseOutlined className="text-red-500" />,
      okText: 'Reject Payment',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await turfBettingApi.rejectOfflinePayment(turfId, { bet_id: bet.id, reason: reason || undefined });
          message.success('Payment rejected successfully');
          setBetDetailsModalVisible(false);
          await fetchData();
        } catch {
          message.error('Failed to reject payment');
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
      render: (id: number, record: Bet) => (
        <div className="flex items-center gap-2">
          <span>{id}</span>
          {record.has_receipt && (
            <Tooltip title="Has payment receipt">
              <FileImageOutlined className="text-blue-500" />
            </Tooltip>
          )}
        </div>
      ),
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
      dataIndex: 'stake_amount',
      key: 'stake_amount',
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
          {record.status === 'pending' && record.payment_method === 'offline' && record.has_receipt && (
            <>
              <Tooltip title="Confirm Payment">
                <Button icon={<CheckOutlined />} size="small" type="primary" onClick={() => handleViewBetDetails(record)} />
              </Tooltip>
              <Tooltip title="Reject Payment">
                <Button icon={<CloseOutlined />} size="small" danger onClick={() => handleViewBetDetails(record)} />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  const pendingBets = bettingHistory?.filter((bet: Bet) => bet.status === 'pending') || [];
  const totalStake = bettingHistory?.reduce((sum: number, bet: Bet) => sum + bet.stake_amount, 0) || 0;

  return (
    <div className="min-h-screen p-6">
      <Head title="Betting Management" />
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
            setSelectedWinningOptions([]);
            form.resetFields();
          }}
          footer={null}
          width={800}
        >
          <Form form={form} onFinish={onSettleMarket} layout="vertical">
            <div className="space-y-4">
              <Card title="Market Information" size="small">
                <div className="space-y-2">
                  <div>
                    <Text strong>Market: </Text>
                    <Text>{selectedMarket?.name}</Text>
                  </div>
                  {selectedMarket?.game_match && (
                    <div>
                      <Text strong>Match: </Text>
                      <Text>
                        {selectedMarket.game_match.first_team?.name || 'Team 1'} vs {selectedMarket.game_match.second_team?.name || 'Team 2'}
                      </Text>
                      {selectedMarket.game_match.first_team_score !== undefined && selectedMarket.game_match.second_team_score !== undefined && (
                        <Text>
                          {' '}
                          ({selectedMarket.game_match.first_team_score} - {selectedMarket.game_match.second_team_score})
                        </Text>
                      )}
                    </div>
                  )}
                  <div>
                    <Text strong>Total Bets: </Text>
                    <Text>{selectedMarket?.total_bets || 0}</Text>
                  </div>
                  <div>
                    <Text strong>Total Stake: </Text>
                    <Text>{formatCurrency(selectedMarket?.total_stake || 0)}</Text>
                  </div>
                </div>
              </Card>

              <Card title="Select Winning Options" size="small">
                <div className="mb-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Settlement Instructions:</strong> Select the winning betting options based on the actual match result. Multiple options
                    can be selected if applicable.
                  </p>
                </div>

                <Table
                  dataSource={selectedMarket?.market_options}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: 'Select Winner',
                      key: 'select',
                      width: 120,
                      align: 'center' as const,
                      render: (_: unknown, record: MarketOption) => (
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={selectedWinningOptions.includes(record.id)}
                            onChange={(e) => handleOptionSelect(record.id, e.target.checked)}
                            disabled={selectedMarket?.status !== 'active'}
                          />
                        </div>
                      ),
                    },
                    {
                      title: 'Option',
                      dataIndex: 'name',
                      key: 'name',
                      render: (name: string) => <Text strong>{name}</Text>,
                    },
                    {
                      title: 'Odds',
                      dataIndex: 'odds',
                      key: 'odds',
                      render: (odds: string | number) => <Text>{odds ? parseFloat(String(odds)).toFixed(2) : '-'}</Text>,
                    },
                    {
                      title: 'Total Bets',
                      dataIndex: 'bet_count',
                      key: 'bet_count',
                      render: (count: number) => count || 0,
                    },
                    {
                      title: 'Total Stake',
                      dataIndex: 'total_stake',
                      key: 'total_stake',
                      render: (stake: string | number) => formatCurrency(parseFloat(String(stake)) || 0),
                    },
                  ]}
                />
              </Card>

              {selectedWinningOptions.length > 0 && (
                <Card title="Settlement Summary" size="small">
                  <div className="space-y-2">
                    <div>
                      <Text strong>Selected Winners: </Text>
                      <Text>
                        {selectedWinningOptions
                          .map((optionId) => {
                            const option = selectedMarket?.market_options?.find((opt) => opt.id === optionId);
                            return option?.name;
                          })
                          .join(', ')}
                      </Text>
                    </div>
                    <div>
                      <Text strong>Estimated Total Payout: </Text>
                      <Text strong style={{ color: '#f5222d' }}>
                        <DollarOutlined />{' '}
                        {formatCurrency(
                          selectedWinningOptions.reduce((total, optionId) => {
                            const option = selectedMarket?.market_options?.find((opt) => opt.id === optionId);
                            if (option) {
                              const stake = parseFloat(String(option.total_stake || 0));
                              const odds = parseFloat(String(option.odds || 0));
                              return total + stake * odds;
                            }
                            return total;
                          }, 0),
                        )}
                      </Text>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        * This is an estimate. Actual payouts will be calculated based on individual bet amounts and odds.
                      </Text>
                    </div>
                  </div>
                </Card>
              )}

              <Form.Item name="settlementNotes" label="Settlement Notes (Optional)" help="Provide additional context for this settlement if needed">
                <Input.TextArea rows={3} placeholder="Enter any notes about this settlement..." maxLength={1000} showCount />
              </Form.Item>
            </div>

            <Form.Item className="mt-6 mb-0">
              <Space className="w-full justify-end">
                <Button
                  onClick={() => {
                    setSettleModalVisible(false);
                    setSelectedWinningOptions([]);
                    form.resetFields();
                  }}
                  disabled={settlingMarket}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<CheckOutlined />}
                  loading={settlingMarket}
                  disabled={selectedWinningOptions.length === 0}
                >
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
          width={700}
          footer={
            selectedBet?.payment_method === 'offline' && selectedBet?.status === 'pending' && selectedBet?.has_receipt ? (
              <Space>
                <Button key="reject" icon={<CloseOutlined />} danger onClick={() => handleRejectOfflinePayment(selectedBet)}>
                  Reject Payment
                </Button>
                <Button key="confirm" icon={<CheckOutlined />} type="primary" onClick={() => handleConfirmOfflinePayment(selectedBet)}>
                  Confirm Payment
                </Button>
                <Button key="close" onClick={() => setBetDetailsModalVisible(false)}>
                  Close
                </Button>
              </Space>
            ) : (
              <Button key="close" onClick={() => setBetDetailsModalVisible(false)}>
                Close
              </Button>
            )
          }
        >
          {selectedBet && (
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong className="text-gray-600 dark:text-gray-400">User:</strong>
                    <div>{selectedBet.user?.name}</div>
                    <div className="text-sm text-gray-500">ID: {selectedBet.user_id}</div>
                  </div>
                  <div>
                    <strong className="text-gray-600 dark:text-gray-400">Status:</strong>
                    <div>
                      <Tag color="blue">{selectedBet.status.toUpperCase()}</Tag>
                      {selectedBet.payment_status && <Tag color="orange">{selectedBet.payment_status.toUpperCase()}</Tag>}
                    </div>
                  </div>
                  <div>
                    <strong className="text-gray-600 dark:text-gray-400">Market:</strong>
                    <div>{selectedBet.market_option?.betting_market?.name}</div>
                  </div>
                  <div>
                    <strong className="text-gray-600 dark:text-gray-400">Option:</strong>
                    <div>{selectedBet.market_option?.name}</div>
                  </div>
                  <div>
                    <strong className="text-gray-600 dark:text-gray-400">Stake Amount:</strong>
                    <div className="text-lg font-semibold text-green-600">₦{selectedBet.stake_amount.toLocaleString()}</div>
                  </div>
                  <div>
                    <strong className="text-gray-600 dark:text-gray-400">Potential Payout:</strong>
                    <div className="text-lg font-semibold text-blue-600">₦{selectedBet.potential_payout.toLocaleString()}</div>
                  </div>
                  <div>
                    <strong className="text-gray-600 dark:text-gray-400">Payment Method:</strong>
                    <div className="uppercase">{selectedBet.payment_method}</div>
                  </div>
                  <div>
                    <strong className="text-gray-600 dark:text-gray-400">Created At:</strong>
                    <div className="text-sm">{new Date(selectedBet.created_at).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Receipt Display */}
              {selectedBet.has_receipt && selectedBet.receipt && (
                <div className="mt-4">
                  <BetReceiptDisplay bet={selectedBet} showActions={false} />
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default BettingManagement;
