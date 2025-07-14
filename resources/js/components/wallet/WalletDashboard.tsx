import { Col, Row } from 'antd';
import React, { memo } from 'react';
import BankAccountList from './BankAccountList';
import TransactionHistory from './TransactionHistory';
import WalletOverview from './WalletOverview';

interface WalletDashboardProps {
  turfId?: number;
  compact?: boolean;
}

const WalletDashboard: React.FC<WalletDashboardProps> = memo(({ turfId, compact = false }) => {
  return (
    <div className={`wallet-dashboard ${compact ? 'wallet-dashboard-compact' : ''}`}>
      <Row gutter={[16, 16]} className="lg:gutter-24">
        {/* Wallet Overview */}
        <Col xs={24} sm={24} lg={12}>
          <WalletOverview turfId={turfId} showActions={true} compact={compact} />
        </Col>

        {/* Bank Accounts */}
        <Col xs={24} sm={24} lg={12}>
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
