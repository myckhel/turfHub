import { CalendarOutlined, EditOutlined, ExperimentOutlined, PlusOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons';
import { Head, router } from '@inertiajs/react';
import { Alert, Button, Card, Col, Row, Space, Statistic, Tabs, Tag, Typography } from 'antd';
import { format } from 'date-fns';
import { memo, useCallback, useEffect, useState } from 'react';
import TeamFormModal from '../../../../components/Teams/TeamFormModal';
import StageList from '../../../../components/Tournaments/Stage/StageList';
import { useTournamentStore } from '../../../../stores';
import type { Tournament } from '../../../../types/tournament.types';
import type { Turf } from '../../../../types/turf.types';

const { Title, Text, Paragraph } = Typography;

interface ShowProps {
  turf?: Turf;
  tournamentId?: number;
  tournament?: Tournament;
}

const Show = ({ turf, tournamentId, tournament: initialTournament }: ShowProps) => {
  const { currentTournament, setCurrentTournament, fetchTournament } = useTournamentStore();

  const tournament = currentTournament || initialTournament;
  const displayTurf = turf || tournament?.turf;

  useEffect(() => {
    if (initialTournament) {
      setCurrentTournament(initialTournament);
      fetchTournament(initialTournament.id, 'stages,teams,turf,creator');
    } else if (tournamentId) {
      fetchTournament(tournamentId, 'stages,teams,turf,creator');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId, initialTournament?.id]);

  const handleEdit = useCallback(() => {
    if (!tournament) return;

    if (turf) {
      router.visit(route('web.turfs.tournaments.edit', { turf: turf.id, tournament: tournament.id }));
    } else {
      router.visit(route('web.tournaments.edit', { tournament: tournament.id }));
    }
  }, [turf, tournament]);
  console.log({ tournament, turf, tournamentId, initialTournament });

  const statusColors: Record<string, string> = {
    pending: 'warning',
    active: 'success',
    completed: 'default',
    cancelled: 'error',
  };

  if (!tournament) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <TrophyOutlined className="mb-4 text-6xl text-gray-400" />
          <Text className="text-gray-500">Loading tournament...</Text>
        </div>
      </div>
    );
  }

  const pageTitle = displayTurf ? `${tournament.name} - ${displayTurf.name}` : tournament.name;

  return (
    <>
      <Head title={pageTitle} />
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-6">
          {/* Header */}
          <Card className="mb-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <TrophyOutlined className="text-3xl text-yellow-500" />
                  <Title level={2} className="mb-0">
                    {tournament.name}
                  </Title>
                  <Tag color={statusColors[tournament.status]}>{tournament.status.toUpperCase()}</Tag>
                </div>
                <Space direction="vertical" size="small">
                  <Text className="text-gray-600">
                    {tournament.type === 'multi_stage_tournament' ? 'Multi-Stage Tournament' : 'Single Session Tournament'}
                  </Text>
                  {tournament.settings?.description && <Paragraph className="mb-0 text-gray-600">{tournament.settings.description}</Paragraph>}
                </Space>
              </div>

              <Button icon={<EditOutlined />} onClick={handleEdit} size="large">
                Edit
              </Button>
            </div>
          </Card>

          {/* Preview Notice */}
          <Alert
            message="Preview Feature"
            description="Tournament management is currently in preview. Some features may be under active development. We appreciate your feedback!"
            type="info"
            icon={<ExperimentOutlined />}
            showIcon
            closable
            className="mb-6"
          />

          {/* Stats */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} md={6}>
              <Card className="shadow-sm">
                <Statistic title="Stages" value={tournament.stages_count || 0} prefix={<TrophyOutlined />} valueStyle={{ color: '#1890ff' }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="shadow-sm">
                <Statistic title="Teams" value={tournament.teams_count || 0} prefix={<TeamOutlined />} valueStyle={{ color: '#52c41a' }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="shadow-sm">
                <Statistic title="Start Date" value={format(new Date(tournament.starts_at), 'MMM dd, yyyy')} prefix={<CalendarOutlined />} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="shadow-sm">
                <Statistic title="Location" value={tournament.settings?.location || displayTurf?.location || 'N/A'} />
              </Card>
            </Col>
          </Row>

          {/* Content Tabs */}
          <Card className="shadow-sm">
            <Tabs
              defaultActiveKey="overview"
              items={[
                {
                  key: 'overview',
                  label: 'Overview',
                  children: <OverviewTab tournament={tournament} />,
                },
                {
                  key: 'stages',
                  label: `Stages (${tournament.stages_count || 0})`,
                  children: <StagesTab tournament={tournament} />,
                },
                {
                  key: 'teams',
                  label: `Teams (${tournament.teams_count || 0})`,
                  children: <TeamsTab tournament={tournament} />,
                },
              ]}
            />
          </Card>
        </div>
      </div>
    </>
  );
};

// Overview Tab Component
interface OverviewTabProps {
  tournament: Tournament;
}

const OverviewTab = memo(({ tournament }: OverviewTabProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Title level={5}>Tournament Information</Title>
        <Space direction="vertical" className="w-full">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong>Type:</Text>
              <div>{tournament.type === 'multi_stage_tournament' ? 'Multi-Stage Tournament' : 'Single Session'}</div>
            </Col>
            <Col span={12}>
              <Text strong>Status:</Text>
              <div>{tournament.status}</div>
            </Col>
            <Col span={12}>
              <Text strong>Starts:</Text>
              <div>{format(new Date(tournament.starts_at), 'PPP')}</div>
            </Col>
            {tournament.ends_at && (
              <Col span={12}>
                <Text strong>Ends:</Text>
                <div>{format(new Date(tournament.ends_at), 'PPP')}</div>
              </Col>
            )}
          </Row>
        </Space>
      </div>

      {tournament.settings?.prize_pool && (
        <div>
          <Title level={5}>Prize Pool</Title>
          <Text>₦{tournament.settings.prize_pool.toLocaleString()}</Text>
        </div>
      )}

      {tournament.creator && (
        <div>
          <Title level={5}>Created By</Title>
          <Text>{tournament.creator.name}</Text>
        </div>
      )}
    </div>
  );
});

OverviewTab.displayName = 'OverviewTab';

// Stages Tab Component
interface StagesTabProps {
  tournament: Tournament;
}

const StagesTab = memo(({ tournament }: StagesTabProps) => {
  return (
    <div>
      <StageList
        stages={tournament.stages || []}
        tournamentId={tournament.id}
        turfId={tournament.turf?.id || 0}
        onAddStage={() => router.visit(route('web.tournaments.stages.create', { tournament: tournament.id }))}
      />
    </div>
  );
});

StagesTab.displayName = 'StagesTab';

// Teams Tab Component
const TeamsTab = memo(({ tournament }: OverviewTabProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<{ id: number; name: string } | undefined>();
  const { fetchTournament } = useTournamentStore();

  const handleCreateTeam = () => {
    setEditingTeam(undefined);
    setModalOpen(true);
  };

  const handleEditTeam = (team: { id: number; name: string }) => {
    setEditingTeam(team);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingTeam(undefined);
  };

  const handleSuccess = () => {
    fetchTournament(tournament.id, 'stages,teams,turf,creator');
  };
  console.log({ tournament });

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateTeam}>
          Create Team
        </Button>
      </div>

      {tournament.teams && tournament.teams.length > 0 ? (
        <Row gutter={[16, 16]}>
          {tournament.teams.map((team) => (
            <Col key={team.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                size="small"
                hoverable
                actions={[
                  <Button key="edit" type="link" icon={<EditOutlined />} onClick={() => handleEditTeam(team)}>
                    Edit
                  </Button>,
                ]}
              >
                <div className="text-center">
                  <TeamOutlined className="mb-2 text-2xl text-blue-500" />
                  <Title level={5} className="mb-0">
                    {team.name}
                  </Title>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <div className="py-8 text-center">
          <Text className="text-gray-500">No teams assigned yet</Text>
        </div>
      )}

      <TeamFormModal open={modalOpen} onClose={handleModalClose} onSuccess={handleSuccess} tournamentId={tournament.id} team={editingTeam} />
    </div>
  );
});

TeamsTab.displayName = 'TeamsTab';

export default Show;
