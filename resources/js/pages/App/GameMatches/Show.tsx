import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DollarCircleOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Head, router, usePage } from '@inertiajs/react';
import { Col, Descriptions, Divider, Row, Space, Tag, Timeline, Typography } from 'antd';
import { format } from 'date-fns';
import { memo } from 'react';
import { MatchEventsList, MatchScoreCard } from '../../../components/GameMatches';
import { Button, Card } from '../../../components/ui';
import { usePermissions } from '../../../hooks/usePermissions';
import type { GameMatch } from '../../../types/gameMatch.types';
import type { PageProps } from '../../../types/global.types';
import type { MatchSession } from '../../../types/matchSession.types';
import type { Tournament } from '../../../types/tournament.types';
import type { Turf } from '../../../types/turf.types';

const { Title, Text } = Typography;

interface ShowProps extends PageProps {
  turf?: Turf;
  matchSession?: MatchSession;
  tournament?: Tournament;
  gameMatch: GameMatch;
}

// Helper functions
const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'processing';
    case 'upcoming':
      return 'blue';
    case 'postponed':
      return 'warning';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const getEventIcon = (type: string) => {
  switch (type) {
    case 'goal':
      return '⚽';
    case 'yellow_card':
      return '🟨';
    case 'red_card':
      return '🟥';
    case 'substitution_in':
      return '🔄';
    case 'substitution_out':
      return '↩️';
    default:
      return '📝';
  }
};

const getEventColor = (type: string) => {
  switch (type) {
    case 'goal':
      return 'green';
    case 'yellow_card':
      return 'yellow';
    case 'red_card':
      return 'red';
    case 'substitution_in':
    case 'substitution_out':
      return 'blue';
    default:
      return 'default';
  }
};

// Team Card Component
interface TeamCardProps {
  team?: {
    id: number;
    name: string;
    color?: string;
    teamPlayers?: Array<{
      id: number;
      player?: {
        user?: {
          name: string;
        };
      };
    }>;
  };
  score: number;
  isWinner: boolean;
}

const TeamCard = memo(({ team, score, isWinner }: TeamCardProps) => (
  <div className="text-center">
    <div className="mb-3 flex items-center justify-center space-x-2">
      <div className="h-5 w-5 rounded-full border-2 shadow-sm" style={{ backgroundColor: team?.color || '#1890ff' }} />
      <Text strong className="text-lg">
        {team?.name || 'Unknown Team'}
      </Text>
      {isWinner && <TrophyOutlined className="text-yellow-500" />}
    </div>
    <div className="mb-3">
      <Text className="text-5xl font-bold">{score}</Text>
    </div>
    <div className="space-y-1">
      {team?.teamPlayers?.map((teamPlayer) => (
        <div key={teamPlayer.id} className="flex items-center justify-center space-x-2 text-sm">
          <UserOutlined className="text-gray-400" />
          <Text className="text-sm">{teamPlayer.player?.user?.name}</Text>
        </div>
      ))}
      {(!team?.teamPlayers || team.teamPlayers.length === 0) && (
        <Text type="secondary" className="text-sm">
          No players listed
        </Text>
      )}
    </div>
  </div>
));

TeamCard.displayName = 'TeamCard';

const Show: React.FC = () => {
  const { turf, matchSession, tournament, gameMatch } = usePage<ShowProps>().props;
  const permissions = usePermissions();
  const canManageSessions = permissions.canManageSessions();
  // const [matchKey, setMatchKey] = useState(0);

  // Determine context (match session, tournament, or turf)
  const contextInfo = matchSession || tournament || turf;
  const contextType = matchSession ? 'session' : tournament ? 'tournament' : 'turf';

  // Handler to refresh match data after updates
  // const handleMatchUpdate = () => {
  //   setMatchKey((prev) => prev + 1);
  //   router.reload({ only: ['gameMatch'] });
  // };

  const handleGoBack = () => {
    if (matchSession && turf) {
      router.visit(route('web.turfs.match-sessions.show', { turf: turf.id, matchSession: matchSession.id }));
    } else if (tournament && turf) {
      router.visit(route('web.turfs.tournaments.show', { turf: turf.id, tournament: tournament.id }));
    } else if (turf) {
      router.visit(route('web.turfs.show', { turf: turf.id }));
    } else {
      router.visit(route('web.dashboard'));
    }
  };

  return (
    <>
      <Head title={`${gameMatch.first_team?.name} vs ${gameMatch.second_team?.name}`} />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6 lg:px-6">
          {/* Back Button */}
          <Button icon={<ArrowLeftOutlined />} onClick={handleGoBack} className="mb-6" size="large">
            Back
          </Button>

          {/* Header Card with Score */}
          <Card className="mb-6 overflow-hidden">
            <Row gutter={[16, 16]}>
              {/* Match Info Section */}
              <Col xs={24} lg={8}>
                <div className="mb-4">
                  <Title level={3} className="mb-2">
                    Match #{gameMatch.id}
                  </Title>
                  <Space wrap className="mb-3">
                    <Tag color={getStatusColor(gameMatch.status)} className="text-sm">
                      {gameMatch.status === 'in_progress' ? 'LIVE' : gameMatch.status.toUpperCase()}
                    </Tag>
                    {gameMatch.betting_enabled && <Tag color="green">Betting Active</Tag>}
                  </Space>
                  <div className="space-y-2 text-sm">
                    <div>
                      <CalendarOutlined className="mr-2 text-gray-400" />
                      <Text>{format(new Date(gameMatch.match_time), 'MMMM dd, yyyy')}</Text>
                    </div>
                    <div>
                      <ClockCircleOutlined className="mr-2 text-gray-400" />
                      <Text>{format(new Date(gameMatch.match_time), 'HH:mm')}</Text>
                    </div>
                    {contextType === 'session' && matchSession && (
                      <div>
                        <EnvironmentOutlined className="mr-2 text-gray-400" />
                        <Text>{matchSession.name}</Text>
                      </div>
                    )}
                    {contextType === 'tournament' && tournament && (
                      <div>
                        <TrophyOutlined className="mr-2 text-gray-400" />
                        <Text>{tournament.name}</Text>
                      </div>
                    )}
                    {turf && (
                      <div>
                        <TeamOutlined className="mr-2 text-gray-400" />
                        <Text>{turf.name}</Text>
                      </div>
                    )}
                  </div>
                </div>

                {/* Betting Button */}
                {gameMatch.betting_enabled && (gameMatch.status === 'upcoming' || gameMatch.status === 'in_progress') && (
                  <Button
                    variant="primary"
                    icon={<DollarCircleOutlined />}
                    onClick={() => router.visit(route('web.betting.game-matches.show', { gameMatch: gameMatch.id }))}
                    size="large"
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  >
                    Place Bet
                  </Button>
                )}
              </Col>

              {/* Score Display */}
              <Col xs={24} lg={16}>
                <Row gutter={[24, 24]} className="h-full items-center">
                  <Col xs={24} sm={10}>
                    <TeamCard
                      team={gameMatch.first_team}
                      score={gameMatch.first_team_score}
                      isWinner={gameMatch.winning_team_id === gameMatch.first_team?.id}
                    />
                  </Col>
                  <Col xs={24} sm={4} className="text-center">
                    <Text className="text-6xl font-bold text-gray-400">VS</Text>
                  </Col>
                  <Col xs={24} sm={10}>
                    <TeamCard
                      team={gameMatch.second_team}
                      score={gameMatch.second_team_score}
                      isWinner={gameMatch.winning_team_id === gameMatch.second_team?.id}
                    />
                  </Col>
                </Row>

                {/* Winner Banner */}
                {gameMatch.winning_team && gameMatch.status === 'completed' && (
                  <div className="mt-6 text-center">
                    <Tag color="gold" icon={<TrophyOutlined />} className="px-6 py-3 text-lg">
                      Winner: {gameMatch.winning_team.name}
                    </Tag>
                  </div>
                )}
              </Col>
            </Row>
          </Card>

          {/* Context Information Card */}
          {contextInfo && (
            <Card title={contextType === 'session' ? 'Match Session' : contextType === 'tournament' ? 'Tournament' : 'Turf'} className="mb-6">
              <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} size="small">
                <Descriptions.Item label="Name">
                  <Button
                    variant="accent"
                    onClick={() => {
                      if (contextType === 'session' && matchSession && turf) {
                        router.visit(route('web.turfs.match-sessions.show', { turf: turf.id, matchSession: matchSession.id }));
                      } else if (contextType === 'tournament' && tournament && turf) {
                        router.visit(route('web.turfs.tournaments.show', { turf: turf.id, tournament: tournament.id }));
                      } else if (turf) {
                        router.visit(route('web.turfs.show', { turf: turf.id }));
                      }
                    }}
                    className="h-auto p-0"
                  >
                    {contextType === 'session' && matchSession?.name}
                    {contextType === 'tournament' && tournament?.name}
                    {contextType === 'turf' && turf?.name}
                  </Button>
                </Descriptions.Item>
                {turf && (
                  <Descriptions.Item label="Turf">
                    <Button variant="accent" onClick={() => router.visit(route('web.turfs.show', { turf: turf.id }))} className="h-auto p-0">
                      {turf.name}
                    </Button>
                  </Descriptions.Item>
                )}
                {matchSession && (
                  <>
                    <Descriptions.Item label="Status">
                      <Tag color={getStatusColor(matchSession.status)}>{matchSession.status.toUpperCase()}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Time Slot">
                      <Tag>{matchSession.time_slot}</Tag>
                    </Descriptions.Item>
                  </>
                )}
                {tournament && (
                  <Descriptions.Item label="Tournament Status">
                    <Tag color={getStatusColor(tournament.status)}>{tournament.status.toUpperCase()}</Tag>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Match Outcome">
                  {gameMatch.outcome ? (
                    <Tag color={gameMatch.outcome === 'win' ? 'green' : gameMatch.outcome === 'loss' ? 'red' : 'blue'}>
                      {gameMatch.outcome.toUpperCase()}
                    </Tag>
                  ) : (
                    <Text type="secondary">Not yet determined</Text>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {/* Admin/Manager Controls */}
          {canManageSessions && (
            <Card title="Match Management" className="mb-6">
              {/* Score Management */}
              <div className="mb-6">
                <Divider orientation="left">Score Management</Divider>
                <MatchScoreCard gameMatch={gameMatch} canManageSessions={canManageSessions} />
              </div>

              {/* Events Management */}
              <div>
                <Divider orientation="left">Match Events</Divider>
                <MatchEventsList gameMatch={gameMatch} />
              </div>
            </Card>
          )}

          {/* Match Events Timeline */}
          <Card title="Match Events Timeline">
            {gameMatch.match_events && gameMatch.match_events.length > 0 ? (
              <Timeline mode="left" className="mt-4">
                {gameMatch.match_events
                  .sort((a, b) => a.minute - b.minute)
                  .map((event) => (
                    <Timeline.Item
                      key={event.id}
                      label={
                        <Text strong className="text-blue-600">
                          {event.minute}&apos;
                        </Text>
                      }
                      dot={<div className="text-lg">{getEventIcon(event.type)}</div>}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Tag color={getEventColor(event.type)}>{event.type.replace(/_/g, ' ').toUpperCase()}</Tag>
                          <div className="flex items-center space-x-2">
                            <div className="h-3 w-3 rounded-full border" style={{ backgroundColor: event.team?.color || '#1890ff' }} />
                            <Text strong>{event.team?.name}</Text>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <UserOutlined className="text-gray-400" />
                          <Text>{event.player?.user?.name}</Text>
                        </div>
                        {event.comment && (
                          <Text type="secondary" className="text-sm">
                            {event.comment}
                          </Text>
                        )}
                      </div>
                    </Timeline.Item>
                  ))}
              </Timeline>
            ) : (
              <div className="py-12 text-center">
                <TrophyOutlined className="mb-3 text-5xl text-gray-300 dark:text-gray-600" />
                <Text type="secondary" className="block text-base">
                  No match events recorded yet
                </Text>
                <Text type="secondary" className="text-sm">
                  Goals, cards, and substitutions will appear here
                </Text>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default Show;
