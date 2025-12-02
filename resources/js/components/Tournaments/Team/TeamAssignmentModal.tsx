import { SearchOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Checkbox, Empty, Input, message, Modal, Space, Spin, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTournamentStore } from '../../../stores';
import type { AssignTeamsRequest, Stage, StageTeam } from '../../../types/tournament.types';

const { Text } = Typography;

interface TeamAssignmentModalProps {
  visible: boolean;
  stage: Stage;
  onClose: () => void;
  onSuccess?: () => void;
}

const TeamAssignmentModal = memo(({ visible, stage, onClose, onSuccess }: TeamAssignmentModalProps) => {
  const { assignTeamsToStage, fetchTournamentTeams, tournamentTeams, isLoadingTournamentTeams, isLoadingStage } = useTournamentStore();
  const [searchText, setSearchText] = useState('');
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [availableTeams, setAvailableTeams] = useState<StageTeam[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch tournament teams independently using tournament_id parameter
  useEffect(() => {
    if (visible && stage.tournament?.id) {
      fetchTournamentTeams(stage.tournament.id, { include: 'captain' });
    }
  }, [visible, stage.tournament?.id, fetchTournamentTeams]);

  // Filter out already assigned teams
  useEffect(() => {
    const assignedTeamIds = new Set(stage.teams?.map((t) => t.id) || []);
    const available = tournamentTeams.filter((team) => !assignedTeamIds.has(team.id));
    setAvailableTeams(available);
  }, [tournamentTeams, stage.teams]);

  // Filter teams based on search
  const filteredTeams = availableTeams.filter(
    (team) => team.name.toLowerCase().includes(searchText.toLowerCase()) || team.captain?.name?.toLowerCase().includes(searchText.toLowerCase()),
  );

  const handleAssign = async () => {
    if (selectedTeamIds.length === 0) {
      message.warning('Please select at least one team');
      return;
    }

    try {
      setLoading(true);
      const data: AssignTeamsRequest = {
        team_ids: selectedTeamIds,
      };
      await assignTeamsToStage(stage.id, data);
      message.success(`${selectedTeamIds.length} team(s) assigned successfully`);
      setSelectedTeamIds([]);
      onSuccess?.();
      onClose();
    } catch {
      message.error('Failed to assign teams');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = useCallback(() => {
    if (selectedTeamIds.length === filteredTeams.length) {
      setSelectedTeamIds([]);
    } else {
      setSelectedTeamIds(filteredTeams.map((team) => team.id));
    }
  }, [selectedTeamIds.length, filteredTeams]);

  const columns: ColumnsType<StageTeam> = [
    {
      title: (
        <Checkbox
          checked={selectedTeamIds.length === filteredTeams.length && filteredTeams.length > 0}
          indeterminate={selectedTeamIds.length > 0 && selectedTeamIds.length < filteredTeams.length}
          onChange={handleSelectAll}
        />
      ),
      dataIndex: 'id',
      key: 'select',
      width: 50,
      render: (id: number) => (
        <Checkbox
          checked={selectedTeamIds.includes(id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedTeamIds([...selectedTeamIds, id]);
            } else {
              setSelectedTeamIds(selectedTeamIds.filter((tid) => tid !== id));
            }
          }}
        />
      ),
    },
    {
      title: 'Team Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <Space>
          <TeamOutlined className="text-blue-500" />
          <Text strong>{name}</Text>
          {record.is_guest && <Tag color="orange">Guest</Tag>}
        </Space>
      ),
    },
    {
      title: 'Captain',
      dataIndex: 'captain',
      key: 'captain',
      render: (captain) => (
        <Space>
          <UserOutlined />
          <Text>{captain?.name || 'N/A'}</Text>
        </Space>
      ),
    },
    {
      title: 'Players',
      dataIndex: 'players_count',
      key: 'players_count',
      width: 100,
      render: (count: number) => <Text>{count || 0}</Text>,
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <TeamOutlined />
          <span>Assign Teams to {stage.name}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={loading}>
          Cancel
        </Button>,
        <Button key="assign" type="primary" onClick={handleAssign} loading={loading || isLoadingStage} disabled={selectedTeamIds.length === 0}>
          Assign {selectedTeamIds.length > 0 && `(${selectedTeamIds.length})`} Team{selectedTeamIds.length !== 1 ? 's' : ''}
        </Button>,
      ]}
    >
      <div className="space-y-4">
        {/* Search */}
        <Input
          placeholder="Search teams by name or captain..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          size="large"
        />

        {/* Info */}
        <div className="rounded bg-blue-50 p-3">
          <Text className="text-sm text-gray-600">
            {availableTeams.length} available team(s) • {selectedTeamIds.length} selected
          </Text>
        </div>

        {/* Teams Table */}
        <Spin spinning={loading || isLoadingTournamentTeams}>
          {filteredTeams.length > 0 ? (
            <Table
              columns={columns}
              dataSource={filteredTeams}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} teams`,
              }}
              size="middle"
            />
          ) : (
            <Empty description={searchText ? `No teams found matching "${searchText}"` : 'No available teams to assign'} />
          )}
        </Spin>
      </div>
    </Modal>
  );
});

TeamAssignmentModal.displayName = 'TeamAssignmentModal';

export default TeamAssignmentModal;
