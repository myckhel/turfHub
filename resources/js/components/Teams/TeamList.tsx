import { router } from '@inertiajs/react';
import { Card, Col, Empty, Row, message } from 'antd';
import React, { memo, useCallback, useState } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import type { MatchSession } from '../../types/matchSession.types';
import type { TeamDetails } from '../../types/team.types';
import type { Turf } from '../../types/turf.types';
import AddPlayerModal from './AddPlayerModal';
import JoinTeamPaymentModal from './JoinTeamPaymentModal';
import TeamCard from './TeamCard';

interface TeamListProps {
  teams: TeamDetails[];
  matchSession: MatchSession;
  turf: Turf;
  showJoinButtons?: boolean;
  onTeamUpdate?: () => void;
}

const TeamList: React.FC<TeamListProps> = memo(({ teams, matchSession, turf, showJoinButtons = true, onTeamUpdate }) => {
  const permissions = usePermissions();
  const canManageTeams = permissions.canManageTeams();
  const [addPlayerModalVisible, setAddPlayerModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamDetails | null>(null);

  const handleJoinTeam = useCallback(
    (teamId: number) => {
      const team = teams.find((t) => t.id === teamId);
      if (!team) return;

      setSelectedTeam(team);
      setJoinModalVisible(true);
    },
    [teams],
  );

  const handleJoinSuccess = useCallback(() => {
    setJoinModalVisible(false);
    setSelectedTeam(null);
    message.success('Successfully joined the team!');
    onTeamUpdate?.();
  }, [onTeamUpdate]);

  const handleViewTeam = useCallback(
    (teamId: number) => {
      router.visit(
        route('web.turfs.match-sessions.teams.show', {
          turf: turf.id,
          matchSession: matchSession.id,
          team: teamId,
        }),
      );
    },
    [turf.id, matchSession.id],
  );

  const handleAddPlayer = useCallback(
    async (teamId: number) => {
      const team = teams.find((t) => t.id === teamId);
      if (!team) return;

      setSelectedTeam(team);
      setAddPlayerModalVisible(true);
    },
    [teams],
  );

  const handleAddPlayerSuccess = useCallback(() => {
    onTeamUpdate?.();
  }, [onTeamUpdate]);

  const getTeamStatusColor = (status: string) => {
    switch (status) {
      case 'playing':
        return 'green';
      case 'next_to_play':
        return 'blue';
      case 'waiting':
        return 'orange';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  };

  if (!teams || teams.length === 0) {
    return (
      <Card>
        <Empty description="No teams available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  return (
    <>
      <Row gutter={[16, 16]}>
        {teams.map((team) => (
          <Col key={team.id} xs={24} sm={12} lg={8} xl={6}>
            <TeamCard
              team={team}
              matchSession={matchSession}
              showJoinButtons={showJoinButtons}
              canManageTeams={canManageTeams}
              onViewDetails={handleViewTeam}
              onJoinTeam={handleJoinTeam}
              onAddPlayer={handleAddPlayer}
              getTeamStatusColor={getTeamStatusColor}
            />
          </Col>
        ))}
      </Row>

      {/* Add Player Modal */}
      {selectedTeam && (
        <AddPlayerModal
          open={addPlayerModalVisible}
          onCancel={() => {
            setAddPlayerModalVisible(false);
            setSelectedTeam(null);
          }}
          onSuccess={handleAddPlayerSuccess}
          teamId={selectedTeam.id}
          matchSessionId={matchSession.id}
          currentPlayerCount={selectedTeam.teamPlayers?.length || 0}
          maxPlayers={matchSession.max_players_per_team}
        />
      )}

      {/* Join Team Payment Modal */}
      {selectedTeam && (
        <JoinTeamPaymentModal
          open={joinModalVisible}
          onCancel={() => {
            setJoinModalVisible(false);
            setSelectedTeam(null);
          }}
          onSuccess={handleJoinSuccess}
          team={selectedTeam}
          slotFee={turf?.team_slot_fee || 0}
          title={`Join ${selectedTeam.name}`}
          description={`Join ${selectedTeam.name} and start playing!`}
        />
      )}
    </>
  );
});

TeamList.displayName = 'TeamList';

export default TeamList;
