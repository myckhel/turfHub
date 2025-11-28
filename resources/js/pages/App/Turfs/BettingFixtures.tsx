import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Head } from '@inertiajs/react';
import { Button, Card, Space, Typography } from 'antd';
import { useState } from 'react';
import CreateManualMatchModal from '../../../components/GameMatches/CreateManualMatchModal';
import GameMatchesTable from '../../../components/GameMatches/GameMatchesTable';

const { Title, Text } = Typography;

interface FixturesProps {
  turfId: number;
}

const BettingFixtures = ({ turfId }: FixturesProps) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleMatchCreated = () => {
    // Refresh the matches table
    setRefreshKey((prev) => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen p-6">
      <Head title="Match Fixtures - Betting Management" />

      <div className="space-y-6">
        {/* Header Section */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <Title level={3} className="!mb-2">
                Match Fixtures
              </Title>
              <Text type="secondary">
                Create and manage manual matches for swift betting. Set up fixtures, enable betting markets, and manage match outcomes.
              </Text>
            </div>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                Refresh
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
                Create Match
              </Button>
            </Space>
          </div>
        </Card>

        {/* Matches Table */}
        <GameMatchesTable key={refreshKey} turfId={turfId} title="All Fixtures" showPagination={true} autoRefresh={true} refreshInterval={30000} />
      </div>

      {/* Create Match Modal */}
      <CreateManualMatchModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} onMatchCreated={handleMatchCreated} turfId={turfId} />
    </div>
  );
};

BettingFixtures.displayName = 'BettingFixtures';

export default BettingFixtures;
