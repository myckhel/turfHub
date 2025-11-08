import { formatCurrency } from '@/utils/format';
import { DollarOutlined, EyeOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { App, Button, Modal, Space, Switch, Table, Tag, Typography } from 'antd';
import { format } from 'date-fns';
import { memo, useCallback, useEffect, useState } from 'react';
import { bettingApi } from '../../apis/betting';
import type { BettingMarket, MarketOption } from '../../types/betting.types';
import type { GameMatch } from '../../types/gameMatch.types';
import BettingMarketForm from './BettingMarketForm';
import MarketDetailsModal from './MarketDetailsModal';
import MarketSettlementModal from './MarketSettlementModal';

const { Text } = Typography;

interface GameMatchBettingMarketsModalProps {
  open: boolean;
  onClose: () => void;
  gameMatch: GameMatch | null;
}

const GameMatchBettingMarketsModal = memo(({ open, onClose, gameMatch }: GameMatchBettingMarketsModalProps) => {
  const [markets, setMarkets] = useState<BettingMarket[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<number | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<BettingMarket | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);

  const { message } = App.useApp();

  // Load betting markets for the specific game match
  const loadMarkets = useCallback(async () => {
    if (!gameMatch?.id) return;

    setLoading(true);
    try {
      const response = await bettingApi.getMarkets({
        game_match_id: gameMatch.id,
        include: 'options',
        per_page: 100,
      });
      setMarkets(response.data);
    } catch (error) {
      console.error('Failed to load betting markets:', error);
      message.error('Failed to load betting markets');
    } finally {
      setLoading(false);
    }
  }, [gameMatch?.id, message]);

  useEffect(() => {
    if (open && gameMatch) {
      loadMarkets();
    }
  }, [open, gameMatch, loadMarkets]);

  // Handle market status toggle
  const handleToggleMarket = useCallback(
    async (market: BettingMarket) => {
      setToggleLoading(market.id);
      try {
        const newStatus = market.status === 'active' ? 'suspended' : 'active';
        await bettingApi.updateMarket(market.id, { status: newStatus });
        message.success(`Market ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
        await loadMarkets();
      } catch (error) {
        console.error('Failed to toggle market status:', error);
        message.error('Failed to update market status');
      } finally {
        setToggleLoading(null);
      }
    },
    [loadMarkets, message],
  );

  const handleViewMarket = useCallback((market: BettingMarket) => {
    setSelectedMarket(market);
    setViewModalOpen(true);
  }, []);

  const handleSettleMarket = useCallback((market: BettingMarket) => {
    setSelectedMarket(market);
    setSettleModalOpen(true);
  }, []);

  const handleCreateMarket = useCallback(() => {
    setCreateModalOpen(true);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'suspended':
        return 'warning';
      case 'settled':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Market',
      key: 'market',
      render: (record: BettingMarket) => (
        <div>
          <Text strong className="block">
            {record.name}
          </Text>
          <Text type="secondary" className="text-sm">
            {record.market_type?.replace('_', ' ').toUpperCase()}
          </Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>,
      width: 100,
    },
    {
      title: 'Total Volume',
      key: 'total_volume',
      render: (record: BettingMarket) => <Text strong>{formatCurrency(record.total_stake || 0)}</Text>,
      width: 120,
    },
    {
      title: 'Options',
      dataIndex: 'market_options',
      key: 'market_options',
      render: (options: MarketOption[]) => <Text>{options?.length || 0} options</Text>,
      width: 100,
    },
    {
      title: 'Deadline',
      dataIndex: 'closes_at',
      key: 'closes_at',
      render: (deadline: string) => (
        <Text type="secondary" className="text-sm">
          {deadline ? format(new Date(deadline), 'HH:mm dd/MM') : '-'}
        </Text>
      ),
      width: 120,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: BettingMarket) => (
        <Space size="small">
          {/* Toggle Active/Suspended */}
          <Switch
            size="small"
            checked={record.status === 'active'}
            loading={toggleLoading === record.id}
            onChange={() => handleToggleMarket(record)}
            checkedChildren="Active"
            unCheckedChildren="Suspended"
            disabled={record.status === 'settled' || record.status === 'cancelled'}
          />

          {/* View Details */}
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewMarket(record)} size="small" />

          {/* Settle Market */}
          {(record.status === 'active' || record.status === 'suspended') && (
            <Button
              type="link"
              icon={<SettingOutlined />}
              onClick={() => handleSettleMarket(record)}
              size="small"
              className="text-green-600 hover:text-green-700"
              title="Settle Market"
            />
          )}
        </Space>
      ),
      width: 200,
    },
  ];

  if (!gameMatch) return null;

  return (
    <>
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <DollarOutlined />
            <span>
              Betting Markets - {gameMatch.first_team?.name} vs {gameMatch.second_team?.name}
            </span>
          </div>
        }
        open={open}
        onCancel={onClose}
        width={1000}
        footer={[
          <Button key="close" onClick={onClose}>
            Close
          </Button>,
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreateMarket} disabled={gameMatch.status !== 'upcoming'}>
            Create Market
          </Button>,
        ]}
      >
        <div className="mb-4">
          <Text type="secondary">
            Match: {gameMatch.first_team?.name} vs {gameMatch.second_team?.name} • Status:{' '}
            <Tag color={gameMatch.status === 'upcoming' ? 'blue' : 'default'}>{gameMatch.status?.toUpperCase()}</Tag> • Betting:{' '}
            <Tag color={gameMatch.betting_enabled ? 'success' : 'default'}>{gameMatch.betting_enabled ? 'Enabled' : 'Disabled'}</Tag>
          </Text>
        </div>

        <Table
          dataSource={markets}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="small"
          scroll={{ x: 800 }}
          locale={{
            emptyText: (
              <div className="py-8 text-center">
                <DollarOutlined className="mb-2 text-4xl text-gray-300" />
                <Text type="secondary" className="block">
                  No betting markets created yet
                </Text>
                <Text type="secondary" className="text-sm">
                  Create your first market to start accepting bets
                </Text>
              </div>
            ),
          }}
        />
      </Modal>

      {/* Create Market Modal */}
      <Modal title="Create Betting Market" open={createModalOpen} onCancel={() => setCreateModalOpen(false)} footer={null} width={800}>
        <BettingMarketForm
          gameMatch={gameMatch}
          onSuccess={() => {
            setCreateModalOpen(false);
            loadMarkets();
          }}
          onCancel={() => setCreateModalOpen(false)}
        />
      </Modal>

      {/* View Market Details Modal */}
      <MarketDetailsModal open={viewModalOpen} onClose={() => setViewModalOpen(false)} market={selectedMarket} />

      {/* Settle Market Modal */}
      <MarketSettlementModal
        open={settleModalOpen}
        onClose={() => setSettleModalOpen(false)}
        market={selectedMarket}
        onSuccess={() => {
          setSettleModalOpen(false);
          loadMarkets();
        }}
      />
    </>
  );
});

GameMatchBettingMarketsModal.displayName = 'GameMatchBettingMarketsModal';

export default GameMatchBettingMarketsModal;
