import { PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Divider, Empty, Progress, Space, Statistic, Typography } from 'antd';
import { memo, useState } from 'react';
import type { Fixture, FixtureSimulation } from '../../../types/tournament.types';
import FixtureCard from './FixtureCard';

const { Title, Text } = Typography;

interface FixtureSimulatorProps {
  stageId: number;
  stageName: string;
  pendingFixtures: Fixture[];
  simulation: FixtureSimulation | null;
  onSimulate: (stageId: number) => Promise<void>;
  onReset?: () => void;
  loading?: boolean;
}

const FixtureSimulator = memo(({ stageId, stageName, pendingFixtures, simulation, onSimulate, onReset, loading }: FixtureSimulatorProps) => {
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = async () => {
    try {
      setIsSimulating(true);
      await onSimulate(stageId);
    } finally {
      setIsSimulating(false);
    }
  };

  const hasSimulation = simulation && simulation.fixtures && simulation.fixtures.length > 0;
  const completionRate = hasSimulation ? Math.round((simulation.fixtures.length / (simulation.fixtures.length + pendingFixtures.length)) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Title level={4} className="mb-1">
                <PlayCircleOutlined className="mr-2" />
                Fixture Simulator - {stageName}
              </Title>
              <Text className="text-gray-600">Preview and simulate match results</Text>
            </div>
            <Space>
              {hasSimulation && onReset && (
                <Button icon={<ReloadOutlined />} onClick={onReset} disabled={loading || isSimulating}>
                  Reset
                </Button>
              )}
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleSimulate}
                loading={loading || isSimulating}
                disabled={pendingFixtures.length === 0}
              >
                Simulate All Pending
              </Button>
            </Space>
          </div>

          {pendingFixtures.length === 0 && !hasSimulation && <Alert message="No pending fixtures to simulate" type="info" showIcon />}
        </div>
      </Card>

      {/* Stats */}
      {(hasSimulation || pendingFixtures.length > 0) && (
        <Card>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Statistic title="Total Fixtures" value={(simulation?.fixtures?.length || 0) + pendingFixtures.length} />
            <Statistic title="Pending" value={pendingFixtures.length} valueStyle={{ color: '#faad14' }} />
            <Statistic title="Simulated" value={simulation?.fixtures?.length || 0} valueStyle={{ color: '#52c41a' }} />
            <div>
              <Text className="text-sm text-gray-500">Completion Rate</Text>
              <Progress percent={completionRate} status={completionRate === 100 ? 'success' : 'active'} />
            </div>
          </div>

          {simulation?.estimated_duration && (
            <div className="mt-4 rounded bg-blue-50 p-3">
              <Text className="text-sm">
                ⏱️ Estimated Total Duration: <strong>{simulation.estimated_duration} minutes</strong>
              </Text>
            </div>
          )}

          {simulation?.warnings && simulation.warnings.length > 0 && (
            <Alert
              message="Simulation Warnings"
              description={
                <ul className="mb-0">
                  {simulation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              }
              type="warning"
              showIcon
              className="mt-4"
            />
          )}
        </Card>
      )}

      {/* Simulated Fixtures */}
      {hasSimulation && (
        <>
          <Divider>
            <Text strong>Simulated Fixtures ({simulation.fixtures.length})</Text>
          </Divider>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {simulation.fixtures.map((fixture) => (
              <FixtureCard key={fixture.id} fixture={fixture} showActions={false} />
            ))}
          </div>
        </>
      )}

      {/* Pending Fixtures */}
      {pendingFixtures.length > 0 && (
        <>
          <Divider>
            <Text strong>Pending Fixtures ({pendingFixtures.length})</Text>
          </Divider>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {pendingFixtures.map((fixture) => (
              <FixtureCard key={fixture.id} fixture={fixture} showActions={false} />
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {!hasSimulation && pendingFixtures.length === 0 && (
        <Card>
          <Empty description="No fixtures available to simulate" />
        </Card>
      )}
    </div>
  );
});

FixtureSimulator.displayName = 'FixtureSimulator';

export default FixtureSimulator;
