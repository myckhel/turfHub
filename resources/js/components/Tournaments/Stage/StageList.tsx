import { ArrowRightOutlined, DeleteOutlined, EditOutlined, PlusOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons';
import { router } from '@inertiajs/react';
import { Button, Card, Empty, Space, Tag, Typography } from 'antd';
import { memo, useCallback } from 'react';
import type { Stage } from '../../../types/tournament.types';

const { Title, Text } = Typography;

interface StageListProps {
  stages: Stage[];
  tournamentId: number;
  turfId: number;
  onAddStage?: () => void;
  onEditStage?: (stage: Stage) => void;
  onDeleteStage?: (stageId: number) => void;
}

const StageList = memo(({ stages, tournamentId, turfId, onAddStage, onEditStage, onDeleteStage }: StageListProps) => {
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  const handleViewStage = useCallback(
    (stageId: number) => {
      router.visit(route('web.tournaments.stages.show', { turf: turfId, tournament: tournamentId, stage: stageId }));
    },
    [turfId, tournamentId],
  );

  if (stages.length === 0) {
    return (
      <Card className="text-center">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical" size="small">
              <Text>No stages created yet</Text>
              <Text type="secondary">Create stages to organize your tournament</Text>
            </Space>
          }
        >
          {onAddStage && (
            <Button type="primary" icon={<PlusOutlined />} onClick={onAddStage}>
              Add First Stage
            </Button>
          )}
        </Empty>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Title level={4} className="mb-0">
          Tournament Stages
        </Title>
        {onAddStage && (
          <Button type="primary" icon={<PlusOutlined />} onClick={onAddStage}>
            Add Stage
          </Button>
        )}
      </div>

      <div className="relative">
        {sortedStages.map((stage, index) => (
          <div key={stage.id} className="relative">
            <StageCard
              stage={stage}
              onView={() => handleViewStage(stage.id)}
              onEdit={onEditStage ? () => onEditStage(stage) : undefined}
              onDelete={onDeleteStage ? () => onDeleteStage(stage.id) : undefined}
            />
            {index < sortedStages.length - 1 && (
              <div className="flex justify-center py-2">
                <ArrowRightOutlined className="rotate-90 text-2xl text-blue-500" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

StageList.displayName = 'StageList';

// Stage Card Component
interface StageCardProps {
  stage: Stage;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const StageCard = memo(({ stage, onView, onEdit, onDelete }: StageCardProps) => {
  const statusColors: Record<string, string> = {
    pending: 'default',
    active: 'processing',
    completed: 'success',
    cancelled: 'error',
  };

  const typeColors: Record<string, string> = {
    league: 'blue',
    group: 'green',
    knockout: 'red',
    swiss: 'purple',
    king_of_hill: 'orange',
    custom: 'default',
  };

  const typeLabels: Record<string, string> = {
    league: 'League',
    group: 'Group Stage',
    knockout: 'Knockout',
    swiss: 'Swiss System',
    king_of_hill: 'King of Hill',
    custom: 'Custom',
  };

  return (
    <Card hoverable={!!onView} onClick={onView} className="border-l-4 border-blue-500 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">{stage.order}</div>
            <Title level={5} className="mb-0">
              {stage.name}
            </Title>
          </div>

          <Space size="small" wrap>
            <Tag color={typeColors[stage.stage_type]}>{typeLabels[stage.stage_type] || stage.stage_type}</Tag>
            <Tag color={statusColors[stage.status]}>{stage.status.toUpperCase()}</Tag>
          </Space>

          <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <TeamOutlined />
              <span>{stage.teams_count || 0} teams</span>
            </div>
            <div className="flex items-center gap-1">
              <TrophyOutlined />
              <span>{stage.fixtures_count || 0} fixtures</span>
            </div>
            {stage.groups_count && stage.groups_count > 0 && (
              <div className="flex items-center gap-1">
                <span>{stage.groups_count} groups</span>
              </div>
            )}
          </div>

          {stage.next_stage && (
            <div className="mt-2 text-xs text-gray-500">
              Promotes to: <span className="font-medium">{stage.next_stage.name}</span>
            </div>
          )}
        </div>

        <Space>
          {onEdit && (
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            />
          )}
          {onDelete && (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            />
          )}
        </Space>
      </div>
    </Card>
  );
});

StageCard.displayName = 'StageCard';

export default StageList;
