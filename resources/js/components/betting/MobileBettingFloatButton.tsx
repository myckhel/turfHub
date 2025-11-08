import { DollarOutlined, WifiOutlined } from '@ant-design/icons';
import { Badge, Button, Card, FloatButton, Modal, Space, Typography } from 'antd';
import React, { useState } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { useOfflineBettingStore } from '../../stores/offlineBetting.store';

const { Text, Title } = Typography;

interface MobileBettingFloatButtonProps {
  className?: string;
}

const MobileBettingFloatButton: React.FC<MobileBettingFloatButtonProps> = ({ className }) => {
  const { isMobile } = useResponsive();
  const [modalVisible, setModalVisible] = useState(false);
  const { draftBets, pendingSyncBets, clearDraftBets, clearPendingSyncBets } = useOfflineBettingStore();

  const totalDrafts = draftBets.length;
  const totalPending = pendingSyncBets.length;
  const totalBets = totalDrafts + totalPending;

  if (!isMobile || totalBets === 0) return null;

  const handleOpenModal = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  const totalDraftAmount = draftBets.reduce((sum, bet) => sum + bet.amount, 0);
  const totalPendingAmount = pendingSyncBets.reduce((sum, bet) => sum + bet.amount, 0);

  return (
    <>
      <FloatButton
        className={className}
        icon={
          <Badge count={totalBets} size="small">
            <DollarOutlined />
          </Badge>
        }
        type="primary"
        onClick={handleOpenModal}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '16px',
          width: '60px',
          height: '60px',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          border: 'none',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
        }}
      />

      <Modal
        title="Offline Betting"
        open={modalVisible}
        onCancel={handleCloseModal}
        width="95%"
        style={{ maxWidth: '400px', top: '10px' }}
        footer={[
          <Button key="close" onClick={handleCloseModal}>
            Close
          </Button>,
        ]}
      >
        <div className="space-y-4">
          {/* Draft Bets Section */}
          {totalDrafts > 0 && (
            <Card size="small" title={`Draft Bets (${totalDrafts})`} className="border border-orange-200">
              <div className="space-y-2">
                <Text type="secondary" className="text-sm">
                  Total Draft Amount: {formatCurrency(totalDraftAmount)}
                </Text>

                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {draftBets.map((bet) => (
                    <div key={bet.id} className="flex items-center justify-between rounded bg-orange-50 p-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{bet.marketName}</div>
                        <div className="text-xs text-gray-500">{bet.optionName}</div>
                        <div className="text-xs">
                          {formatCurrency(bet.amount)} @ {bet.odds}x
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button size="small" danger ghost onClick={clearDraftBets} className="w-full">
                  Clear All Drafts
                </Button>
              </div>
            </Card>
          )}

          {/* Pending Sync Bets Section */}
          {totalPending > 0 && (
            <Card
              size="small"
              title={
                <Space>
                  <WifiOutlined className="text-blue-500" />
                  Pending Sync ({totalPending})
                </Space>
              }
              className="border border-blue-200"
            >
              <div className="space-y-2">
                <Text type="secondary" className="text-sm">
                  Total Pending Amount: {formatCurrency(totalPendingAmount)}
                </Text>

                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {pendingSyncBets.map((bet) => (
                    <div key={bet.id} className="flex items-center justify-between rounded bg-blue-50 p-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{bet.marketName}</div>
                        <div className="text-xs text-gray-500">{bet.optionName}</div>
                        <div className="text-xs">
                          {formatCurrency(bet.amount)} @ {bet.odds}x
                        </div>
                      </div>
                      <div className="text-xs text-blue-600">Syncing...</div>
                    </div>
                  ))}
                </div>

                <Button size="small" danger ghost onClick={clearPendingSyncBets} className="w-full">
                  Clear Pending
                </Button>
              </div>
            </Card>
          )}

          {/* Empty State */}
          {totalBets === 0 && (
            <div className="py-8 text-center">
              <DollarOutlined className="mb-2 text-4xl text-gray-300" />
              <Title level={5} type="secondary">
                No Offline Bets
              </Title>
              <Text type="secondary">Your draft and pending bets will appear here when you're offline.</Text>
            </div>
          )}

          {/* Info Text */}
          <div className="text-center text-xs text-gray-500">Draft bets are saved locally. Pending bets will sync when you're back online.</div>
        </div>
      </Modal>
    </>
  );
};

export default MobileBettingFloatButton;
