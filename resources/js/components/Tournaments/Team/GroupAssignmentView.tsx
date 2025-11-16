import { SaveOutlined, ShakeOutlined, TeamOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Card, Col, Empty, message, Row, Space, Tag, Tooltip, Typography } from 'antd';
import { memo, useState } from 'react';
import type { Group, StageTeam } from '../../../types/tournament.types';

const { Title, Text } = Typography;

interface GroupAssignmentViewProps {
  groups: Group[];
  unassignedTeams: StageTeam[];
  onSave: (assignments: Record<number, number[]>) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

// Draggable Team Card
interface DraggableTeamProps {
  team: StageTeam;
  isDragging?: boolean;
}

const DraggableTeam = memo(({ team, isDragging }: DraggableTeamProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: team.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-2">
      <Card size="small" hoverable className="cursor-move" bodyStyle={{ padding: '8px 12px' }}>
        <div className="flex items-center gap-2">
          <TeamOutlined className="text-blue-500" />
          <Text strong className="text-sm">
            {team.name}
          </Text>
          {team.seed && (
            <Tag color="blue" className="text-xs">
              Seed {team.seed}
            </Tag>
          )}
        </div>
      </Card>
    </div>
  );
});

DraggableTeam.displayName = 'DraggableTeam';

// Group Container (Drop Zone)
interface GroupContainerProps {
  group: Group;
  teams: StageTeam[];
  teamsPerGroup?: number;
}

const GroupContainer = memo(({ group, teams, teamsPerGroup }: GroupContainerProps) => {
  const isFull = teamsPerGroup ? teams.length >= teamsPerGroup : false;

  return (
    <Card
      title={
        <Space>
          <UsergroupAddOutlined />
          <Text strong>{group.name}</Text>
          <Tag color={isFull ? 'red' : 'blue'}>
            {teams.length}
            {teamsPerGroup ? `/${teamsPerGroup}` : ''}
          </Tag>
        </Space>
      }
      size="small"
      className={`h-full ${isFull ? 'border-red-300' : 'border-blue-300'}`}
    >
      <div className="min-h-[200px]">
        {teams.length > 0 ? (
          <SortableContext items={teams.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {teams.map((team) => (
              <DraggableTeam key={team.id} team={team} />
            ))}
          </SortableContext>
        ) : (
          <div className="flex h-32 items-center justify-center rounded border-2 border-dashed border-gray-300">
            <Text className="text-gray-400">Drop teams here</Text>
          </div>
        )}
      </div>
    </Card>
  );
});

GroupContainer.displayName = 'GroupContainer';

// Main Component
const GroupAssignmentView = memo(
  ({ groups: initialGroups, unassignedTeams: initialUnassigned, onSave, onCancel, loading }: GroupAssignmentViewProps) => {
    const [groups] = useState<Group[]>(initialGroups);
    const [groupTeams, setGroupTeams] = useState<Record<number, StageTeam[]>>(() => {
      const initial: Record<number, StageTeam[]> = {};
      initialGroups.forEach((group) => {
        initial[group.id] = group.teams || [];
      });
      return initial;
    });

    const [unassignedTeams, setUnassignedTeams] = useState<StageTeam[]>(initialUnassigned);
    const [activeTeam, setActiveTeam] = useState<StageTeam | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 8,
        },
      }),
    );

    const handleDragStart = (event: DragStartEvent) => {
      const teamId = event.active.id as number;

      // Find team in groups or unassigned
      let team: StageTeam | undefined;
      for (const teams of Object.values(groupTeams)) {
        team = teams.find((t) => t.id === teamId);
        if (team) break;
      }
      if (!team) {
        team = unassignedTeams.find((t) => t.id === teamId);
      }

      setActiveTeam(team || null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTeam(null);

      if (!over) return;

      const teamId = active.id as number;
      const targetContainer = over.id as number | 'unassigned';

      // Find source container
      let sourceContainer: number | 'unassigned' = 'unassigned';
      let team: StageTeam | undefined;

      if (unassignedTeams.find((t) => t.id === teamId)) {
        sourceContainer = 'unassigned';
        team = unassignedTeams.find((t) => t.id === teamId);
      } else {
        for (const [groupId, teams] of Object.entries(groupTeams)) {
          if (teams.find((t) => t.id === teamId)) {
            sourceContainer = Number(groupId);
            team = teams.find((t) => t.id === teamId);
            break;
          }
        }
      }

      if (!team || sourceContainer === targetContainer) return;

      // Remove from source
      if (sourceContainer === 'unassigned') {
        setUnassignedTeams((prev) => prev.filter((t) => t.id !== teamId));
      } else {
        setGroupTeams((prev) => ({
          ...prev,
          [sourceContainer]: prev[sourceContainer].filter((t) => t.id !== teamId),
        }));
      }

      // Add to target
      if (targetContainer === 'unassigned') {
        setUnassignedTeams((prev) => [...prev, team]);
      } else {
        setGroupTeams((prev) => ({
          ...prev,
          [targetContainer]: [...(prev[targetContainer] || []), team],
        }));
      }

      setHasChanges(true);
    };

    const handleSave = async () => {
      try {
        setSaving(true);
        const assignments: Record<number, number[]> = {};
        Object.entries(groupTeams).forEach(([groupId, teams]) => {
          assignments[Number(groupId)] = teams.map((t) => t.id);
        });
        await onSave(assignments);
        message.success('Group assignments saved successfully');
        setHasChanges(false);
      } catch {
        message.error('Failed to save group assignments');
      } finally {
        setSaving(false);
      }
    };

    const handleReset = () => {
      const initial: Record<number, StageTeam[]> = {};
      initialGroups.forEach((group) => {
        initial[group.id] = group.teams || [];
      });
      setGroupTeams(initial);
      setUnassignedTeams(initialUnassigned);
      setHasChanges(false);
    };

    const handleRandomize = () => {
      if (groups.length === 0) {
        message.warning('No groups available');
        return;
      }

      // Collect all teams
      const allTeams: StageTeam[] = [...unassignedTeams, ...Object.values(groupTeams).flat()];

      if (allTeams.length === 0) {
        message.warning('No teams to assign');
        return;
      }

      // Shuffle teams
      const shuffled = [...allTeams].sort(() => Math.random() - 0.5);

      // Distribute evenly across groups
      const newGroupTeams: Record<number, StageTeam[]> = {};
      groups.forEach((group) => {
        newGroupTeams[group.id] = [];
      });

      shuffled.forEach((team, index) => {
        const groupIndex = index % groups.length;
        const groupId = groups[groupIndex].id;
        newGroupTeams[groupId].push(team);
      });

      setGroupTeams(newGroupTeams);
      setUnassignedTeams([]);
      setHasChanges(true);
      message.success('Teams randomly assigned to groups');
    };

    const totalTeams = Object.values(groupTeams).reduce((sum, teams) => sum + teams.length, 0) + unassignedTeams.length;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Title level={5} className="mb-1">
              Group Assignment
            </Title>
            <Text className="text-gray-600">Drag teams between groups to organize them</Text>
          </div>
          <Space wrap>
            <Tooltip title="Randomly distribute all teams across groups">
              <Button icon={<ShakeOutlined />} onClick={handleRandomize} disabled={saving || loading || groups.length === 0}>
                Randomize
              </Button>
            </Tooltip>
            {hasChanges && (
              <Button onClick={handleReset} disabled={saving || loading}>
                Reset
              </Button>
            )}
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving} disabled={!hasChanges || loading}>
              Save Assignments
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
            <Text className="text-sm text-yellow-800">⚠️ You have unsaved changes. Click "Save Assignments" to apply.</Text>
          </div>
        )}

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <Row gutter={[16, 16]}>
            {/* Groups */}
            {groups.map((group) => (
              <Col key={group.id} xs={24} sm={12} lg={8}>
                <div data-group-id={group.id}>
                  <GroupContainer group={group} teams={groupTeams[group.id] || []} teamsPerGroup={group.teams_per_group} />
                </div>
              </Col>
            ))}

            {/* Unassigned Teams */}
            {unassignedTeams.length > 0 && (
              <Col xs={24}>
                <Card
                  title={
                    <Space>
                      <TeamOutlined />
                      <Text strong>Unassigned Teams</Text>
                      <Tag color="orange">{unassignedTeams.length}</Tag>
                    </Space>
                  }
                  size="small"
                  className="border-orange-300"
                >
                  <div data-group-id="unassigned" className="min-h-[100px]">
                    {unassignedTeams.length > 0 ? (
                      <Row gutter={[8, 8]}>
                        <SortableContext items={unassignedTeams.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                          {unassignedTeams.map((team) => (
                            <Col key={team.id} xs={24} sm={12} md={8} lg={6}>
                              <DraggableTeam team={team} />
                            </Col>
                          ))}
                        </SortableContext>
                      </Row>
                    ) : (
                      <Empty description="All teams assigned" />
                    )}
                  </div>
                </Card>
              </Col>
            )}
          </Row>

          {/* Drag Overlay */}
          <DragOverlay>{activeTeam ? <DraggableTeam team={activeTeam} isDragging /> : null}</DragOverlay>
        </DndContext>

        {/* Footer Stats */}
        <div className="rounded bg-blue-50 p-3">
          <Space split="|">
            <Text className="text-sm text-gray-600">Total Teams: {totalTeams}</Text>
            <Text className="text-sm text-gray-600">Groups: {groups.length}</Text>
            <Text className="text-sm text-gray-600">Unassigned: {unassignedTeams.length}</Text>
          </Space>
        </div>
      </div>
    );
  },
);

GroupAssignmentView.displayName = 'GroupAssignmentView';

export default GroupAssignmentView;
