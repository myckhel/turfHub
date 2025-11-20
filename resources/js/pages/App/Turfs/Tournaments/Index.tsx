import { ExperimentOutlined, PlusOutlined, TrophyOutlined } from '@ant-design/icons';
import { Head, router } from '@inertiajs/react';
import { Alert, Button, Card, Col, Input, Row, Select, Space, Spin, Typography } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTournamentStore } from '../../../../stores';
import type { Tournament, TournamentFilters } from '../../../../types/tournament.types';
import type { Turf } from '../../../../types/turf.types';

const { Title, Text } = Typography;
const { Search } = Input;

interface IndexProps {
  turf?: Turf;
  initialTournaments?: Tournament[];
}

const Index = ({ turf }: IndexProps) => {
  const { tournaments, isLoadingTournaments, fetchTournaments } = useTournamentStore();
  const [filters, setFilters] = useState<TournamentFilters>({
    turf_id: turf?.id,
    per_page: 20,
  });

  useEffect(() => {
    fetchTournaments({
      ...filters,
      include: 'stages,teams',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleCreateTournament = useCallback(() => {
    if (turf) {
      router.visit(route('web.turfs.tournaments.create', { turf: turf.id }));
    } else {
      // For standalone view, show message or redirect to turf selection
      router.visit(route('web.turfs.index'));
    }
  }, [turf]);

  const handleFilterChange = useCallback((key: keyof TournamentFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSearch = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value || undefined }));
  }, []);

  const handleTournamentClick = useCallback(
    (tournament: Tournament) => router.visit(route('web.turfs.tournaments.show', { turf: turf?.id, tournament: tournament.id })),
    [turf],
  );

  const pageTitle = turf ? `Tournaments - ${turf.name}` : 'Tournaments';
  const pageDescription = turf ? `Manage multi-stage tournaments for ${turf.name}` : 'Browse and manage tournaments';

  return (
    <>
      <Head title={pageTitle} />
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-6">
          {/* Header Section */}
          <Card className="mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <Title level={2} className="mb-2 flex items-center gap-2">
                  <TrophyOutlined className="text-yellow-500" />
                  Tournaments
                </Title>
                <Text className="text-gray-600">{pageDescription}</Text>
              </div>

              {turf && (
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={handleCreateTournament}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Create Tournament
                </Button>
              )}
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

          {/* Filters Section */}
          <Card className="mb-6 shadow-sm">
            <Space direction="vertical" size="middle" className="w-full">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12} lg={8}>
                  <Search placeholder="Search tournaments..." allowClear onSearch={handleSearch} className="w-full" />
                </Col>
                <Col xs={12} md={6} lg={4}>
                  <Select
                    placeholder="Type"
                    allowClear
                    className="w-full"
                    onChange={(value) => handleFilterChange('type', value)}
                    options={[
                      { label: 'Single Session', value: 'single_session' },
                      { label: 'Multi-Stage', value: 'multi_stage_tournament' },
                    ]}
                  />
                </Col>
                <Col xs={12} md={6} lg={4}>
                  <Select
                    placeholder="Status"
                    allowClear
                    className="w-full"
                    onChange={(value) => handleFilterChange('status', value)}
                    options={[
                      { label: 'Pending', value: 'pending' },
                      { label: 'Active', value: 'active' },
                      { label: 'Completed', value: 'completed' },
                      { label: 'Cancelled', value: 'cancelled' },
                    ]}
                  />
                </Col>
              </Row>
            </Space>
          </Card>

          {/* Tournament List */}
          {isLoadingTournaments ? (
            <div className="flex h-64 items-center justify-center">
              <Spin size="large" />
            </div>
          ) : tournaments.length === 0 ? (
            <Card className="text-center">
              <TrophyOutlined className="mb-4 text-6xl text-gray-300" />
              <Title level={4} className="mb-2">
                No Tournaments Yet
              </Title>
              <Text className="text-gray-500">Create your first tournament to get started</Text>
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              {tournaments.map((tournament) => (
                <Col key={tournament.id} xs={24} md={12} lg={8}>
                  <TournamentCard tournament={tournament} onClick={handleTournamentClick} />
                </Col>
              ))}
            </Row>
          )}
        </div>
      </div>
    </>
  );
};

// Tournament Card Component
interface TournamentCardProps {
  tournament: Tournament;
  onClick: (tournament: Tournament) => void;
}

const TournamentCard = memo(({ tournament, onClick }: TournamentCardProps) => {
  const statusColors: Record<string, string> = {
    pending: 'text-yellow-600 bg-yellow-50',
    active: 'text-green-600 bg-green-50',
    completed: 'text-blue-600 bg-blue-50',
    cancelled: 'text-red-600 bg-red-50',
  };

  const statusColor = statusColors[tournament.status] || 'text-gray-600 bg-gray-50';

  return (
    <Card hoverable onClick={() => onClick(tournament)} className="h-full shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Title level={4} className="mb-1 line-clamp-1">
              {tournament.name}
            </Title>
            <Text className="text-sm text-gray-500">{tournament.type === 'multi_stage_tournament' ? 'Multi-Stage' : 'Single Session'}</Text>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor}`}>{tournament.status}</span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div>
              <Text className="text-xs text-gray-400">Stages</Text>
              <div className="font-medium">{tournament.stages_count || 0}</div>
            </div>
            <div>
              <Text className="text-xs text-gray-400">Teams</Text>
              <div className="font-medium">{tournament.teams_count || 0}</div>
            </div>
          </div>
        </div>

        <div className="border-t pt-2">
          <Text className="text-xs text-gray-500">
            {new Date(tournament.starts_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </div>
      </div>
    </Card>
  );
});

TournamentCard.displayName = 'TournamentCard';

export default Index;
