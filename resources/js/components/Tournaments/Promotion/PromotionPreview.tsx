import { AlertOutlined, ArrowRightOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Empty, List, Space, Spin, Tag, Typography } from 'antd';
import { memo, useEffect, useState } from 'react';
import { useTournamentStore } from '../../../stores';
import type { StageTeam } from '../../../types/tournament.types';

const { Text, Title } = Typography;

interface PromotionPreviewProps {
  stageId: number;
  onExecute?: () => void;
}

const PromotionPreview = memo(({ stageId, onExecute }: PromotionPreviewProps) => {
  const { promotionSimulation, simulatePromotion, isSimulating } = useTournamentStore();
  const [error, setError] = useState<string | null>(null);

  const loadSimulation = async () => {
    try {
      setError(null);
      await simulatePromotion(stageId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load promotion preview');
    }
  };

  useEffect(() => {
    loadSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageId]);

  if (isSimulating) {
    return (
      <Card>
        <div className="flex min-h-[200px] items-center justify-center">
          <Spin size="large" tip="Loading promotion preview..." />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error Loading Preview"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={loadSimulation}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!promotionSimulation) {
    return (
      <Card>
        <Empty description="No promotion preview available" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Preview Header */}
      <Card
        title={
          <Space>
            <InfoCircleOutlined />
            <span>Promotion Preview</span>
          </Space>
        }
        extra={
          <Tag color="blue" icon={<CheckCircleOutlined />}>
            {promotionSimulation.promoted_teams.length} Team{promotionSimulation.promoted_teams.length !== 1 ? 's' : ''}
          </Tag>
        }
      >
        <div className="space-y-3">
          {/* Rule Explanation */}
          <div className="rounded bg-blue-50 p-3">
            <Text strong className="mb-1 block">
              Promotion Rule:
            </Text>
            <Text>{promotionSimulation.promotion_rule}</Text>
          </div>

          {/* Next Stage Info */}
          <div className="flex items-center justify-between rounded bg-green-50 p-3">
            <Text>Teams will advance to:</Text>
            <Tag color="green" className="text-base">
              {promotionSimulation.next_stage.name}
              <ArrowRightOutlined className="ml-2" />
            </Tag>
          </div>

          {/* Explanation */}
          <Alert message="How This Works" description={promotionSimulation.explanation} type="info" showIcon icon={<InfoCircleOutlined />} />
        </div>
      </Card>

      {/* Teams Preview */}
      <Card title="Teams to be Promoted">
        {promotionSimulation.promoted_teams.length === 0 ? (
          <Empty description="No teams meet the promotion criteria" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            dataSource={promotionSimulation.promoted_teams}
            renderItem={(team: StageTeam, index) => (
              <List.Item>
                <div className="flex w-full items-center justify-between">
                  <Space>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 font-bold text-yellow-700">{index + 1}</div>
                    <div>
                      <Title level={5} className="mb-0">
                        {team.name}
                      </Title>
                      {team.captain && <Text className="text-xs text-gray-500">Captain: {team.captain.name}</Text>}
                    </div>
                  </Space>
                  <Space>
                    {team.seed !== undefined && <Tag color="blue">Seed #{team.seed}</Tag>}
                    {team.group_id && <Tag color="cyan">Group {team.group_id}</Tag>}
                    <ArrowRightOutlined className="text-xl text-green-500" />
                  </Space>
                </div>
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* Action Buttons */}
      {promotionSimulation.promoted_teams.length > 0 && (
        <Card>
          <div className="space-y-3">
            <Alert
              message="Ready to Execute"
              description="Once you execute this promotion, the selected teams will be moved to the next stage. This action cannot be undone."
              type="warning"
              showIcon
              icon={<AlertOutlined />}
            />
            <div className="flex justify-end gap-2">
              <Button onClick={loadSimulation}>Refresh Preview</Button>
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={onExecute}>
                Execute Promotion
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
});

PromotionPreview.displayName = 'PromotionPreview';

export default PromotionPreview;
