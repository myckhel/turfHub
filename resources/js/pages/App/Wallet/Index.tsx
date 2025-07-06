import { WalletOutlined } from '@ant-design/icons';
import { Card, Typography } from 'antd';
import React from 'react';
import WalletDashboard from '../../../components/wallet/WalletDashboard';

const { Title } = Typography;

const WalletIndex: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <WalletOutlined className="text-2xl text-green-600" />
          <Title level={1} className="mb-0">
            My Wallet
          </Title>
        </div>
        <Typography.Text type="secondary" className="text-base">
          Manage your wallet balance, transactions, and bank accounts
        </Typography.Text>
      </div>

      <Card className="shadow-sm">
        <WalletDashboard compact={false} />
      </Card>
    </div>
  );
};

export default WalletIndex;
