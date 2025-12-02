import { DragOutlined, SaveOutlined, TeamOutlined } from '@ant-design/icons';
import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Card, Empty, Space, Tag, Typography, message } from 'antd';
import { memo, useState } from 'react';
import type { StageTeam } from '../../../types/tournament.types';

const { Title, Text } = Typography;

interface SeedingConfigurationProps {
  teams: StageTeam[];
  onSave: (orderedTeamIds: number[]) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

// Sortable Team Item Component
interface SortableTeamItemProps {
  team: StageTeam;
  index: number;
}

const SortableTeamItem = memo(({ team, index }: SortableTeamItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: team.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <Card size="small" className={`cursor-move hover:shadow-md ${isDragging ? 'shadow-lg' : ''}`} bodyStyle={{ padding: '12px 16px' }}>
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div
              {...attributes}
              {...listeners}
              className="flex h-8 w-8 cursor-grab items-center justify-center rounded bg-gray-100 hover:bg-gray-200 active:cursor-grabbing"
            >
              <DragOutlined className="text-gray-500" />
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">{index + 1}</div>

            <TeamOutlined className="text-blue-500" />

            <div className="flex-1">
              <Text strong>{team.name}</Text>
              {team.captain && <Text className="ml-2 text-xs text-gray-500">Captain: {team.captain.name}</Text>}
            </div>
          </div>

          {team.seed && (
            <div className="text-sm text-gray-500">
              Previous Seed: <span className="font-semibold">#{team.seed}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
});

SortableTeamItem.displayName = 'SortableTeamItem';

// Main Component
const SeedingConfiguration = memo(({ teams: initialTeams, onSave, onCancel, loading }: SeedingConfigurationProps) => {
  const [teams, setTeams] = useState<StageTeam[]>([...initialTeams].sort((a, b) => (a.seed || 0) - (b.seed || 0) || a.id - b.id));
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = teams.findIndex((team) => team.id === active.id);
      const newIndex = teams.findIndex((team) => team.id === over.id);

      const newTeams = arrayMove(teams, oldIndex, newIndex);
      setTeams(newTeams);
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const orderedTeamIds = teams.map((team) => team.id);
      await onSave(orderedTeamIds);
      message.success('Seeding order saved successfully');
      setHasChanges(false);
    } catch {
      message.error('Failed to save seeding order');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setTeams([...initialTeams].sort((a, b) => (a.seed || 0) - (b.seed || 0) || a.id - b.id));
    setHasChanges(false);
  };

  if (teams.length === 0) {
    return (
      <Card>
        <Empty description="No teams assigned to this stage yet" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Title level={5} className="mb-0">
              Team Seeding Order
            </Title>
            <Tag color="blue">Preview</Tag>
          </div>
          <Text className="text-gray-600">Drag teams to reorder their seeding position</Text>
        </div>
        <Space>
          {hasChanges && (
            <Button onClick={handleReset} disabled={saving || loading}>
              Reset
            </Button>
          )}
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving} disabled={!hasChanges || loading}>
            Save Order
          </Button>
          {onCancel && (
            <Button onClick={onCancel} disabled={saving || loading}>
              Cancel
            </Button>
          )}
        </Space>
      </div>

      {/* Info */}
      {hasChanges && (
        <div className="rounded border border-yellow-200 bg-yellow-50 p-3">
          <Text className="text-sm text-yellow-800">⚠️ You have unsaved changes. Click "Save Order" to apply the new seeding.</Text>
        </div>
      )}

      {/* Draggable List */}
      <Card>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={teams.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {teams.map((team, index) => (
              <SortableTeamItem key={team.id} team={team} index={index} />
            ))}
          </SortableContext>
        </DndContext>
      </Card>

      {/* Footer Stats */}
      <div className="rounded bg-blue-50 p-3">
        <Text className="text-sm text-gray-600">Total Teams: {teams.length}</Text>
      </div>
    </div>
  );
});

SeedingConfiguration.displayName = 'SeedingConfiguration';

export default SeedingConfiguration;
