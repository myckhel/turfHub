import { DashboardOutlined } from '@ant-design/icons';
import { Col, Row, Typography } from 'antd';
import React, { memo } from 'react';
import BankAccountList from './BankAccountList';
import TransactionHistory from './TransactionHistory';
import WalletOverview from './WalletOverview';

const { Title } = Typography;

interface WalletDashboardProps {
  turfId?: number;
  compact?: boolean;
}

const WalletDashboard: React.FC<WalletDashboardProps> = memo(({ turfId, compact = false }) => {
  return (
    <div className={`wallet-dashboard ${compact ? 'wallet-dashboard-compact' : ''}`}>
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <DashboardOutlined className="text-primary text-xl" />
          <Title level={2} className="mb-0">
            {turfId ? 'Turf Wallet Dashboard' : 'Wallet Dashboard'}
          </Title>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {/* Wallet Overview */}
        <Col xs={24} lg={12}>
          <WalletOverview turfId={turfId} showActions={true} compact={compact} />
        </Col>

        {/* Bank Accounts */}
        <Col xs={24} lg={12}>
          <BankAccountList turfId={turfId} showActions={true} compact={compact} />
        </Col>

        {/* Transaction History */}
        <Col xs={24}>
          <TransactionHistory turfId={turfId} showFilters={true} compact={compact} initialLimit={10} />
        </Col>
      </Row>
    </div>
  );
});

WalletDashboard.displayName = 'WalletDashboard';

export default WalletDashboard;
