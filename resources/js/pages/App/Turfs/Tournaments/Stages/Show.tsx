import {
  CalendarOutlined,
  EditOutlined,
  PlayCircleOutlined,
  RocketOutlined,
  TeamOutlined,
  TrophyOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons';
import { Head, router } from '@inertiajs/react';
import { App, Badge, Button, Card, Col, Descriptions, message, Modal, Row, Space, Statistic, Tabs, Typography } from 'antd';
import { format } from 'date-fns';
import { memo, useCallback, useEffect, useState } from 'react';
import FixtureGenerator from '../../../../../components/Tournaments/Fixture/FixtureGenerator';
import FixtureSchedule from '../../../../../components/Tournaments/Fixture/FixtureSchedule';
import FixtureSimulator from '../../../../../components/Tournaments/Fixture/FixtureSimulator';
import SubmitResultModal from '../../../../../components/Tournaments/Fixture/SubmitResultModal';
import ExecutePromotionModal from '../../../../../components/Tournaments/Promotion/ExecutePromotionModal';
import PromotedTeamsList from '../../../../../components/Tournaments/Promotion/PromotedTeamsList';
import PromotionPreview from '../../../../../components/Tournaments/Promotion/PromotionPreview';
import PromotionRuleEditModal from '../../../../../components/Tournaments/Promotion/PromotionRuleEditModal';
import PromotionRulesDisplay from '../../../../../components/Tournaments/Promotion/PromotionRulesDisplay';
import GroupStandings from '../../../../../components/Tournaments/Ranking/GroupStandings';
import OverallStandings from '../../../../../components/Tournaments/Ranking/OverallStandings';
import TieBreakersDisplay from '../../../../../components/Tournaments/Ranking/TieBreakersDisplay';
import GroupAssignmentView from '../../../../../components/Tournaments/Team/GroupAssignmentView';
import SeedingConfiguration from '../../../../../components/Tournaments/Team/SeedingConfiguration';
import TeamAssignmentModal from '../../../../../components/Tournaments/Team/TeamAssignmentModal';
import { useTournamentStore } from '../../../../../stores';
import type { Fixture, GenerateFixturesRequest, Stage } from '../../../../../types/tournament.types';

const { Text } = Typography;

const { TabPane } = Tabs;

interface ShowStageProps {
  tournamentId: number;
  stageId: number;
}

// Status badge helper
const getStatusBadge = (status: Stage['status']) => {
  const statusConfig: Record<Stage['status'], { color: 'default' | 'processing' | 'success' | 'error'; text: string }> = {
    pending: { color: 'default', text: 'Pending' },
    active: { color: 'processing', text: 'Active' },
    completed: { color: 'success', text: 'Completed' },
    cancelled: { color: 'error', text: 'Cancelled' },
  };
  const config = statusConfig[status];
  return <Badge status={config.color} text={config.text} />;
};

// Stage type badge helper
const getStageTypeBadge = (type: Stage['stage_type']) => {
  const typeColors: Record<Stage['stage_type'], string> = {
    league: 'blue',
    group: 'cyan',
    knockout: 'purple',
    swiss: 'orange',
    king_of_hill: 'gold',
    custom: 'default',
  };
  return <Badge color={typeColors[type]} text={type.toUpperCase()} />;
};

// Overview Tab
const OverviewTab = memo(({ stage }: { stage: Stage }) => {
  const { generateFixtures, simulateFixtures, simulatePromotion, executePromotion } = useTournamentStore();
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleGenerateFixtures = async () => {
    try {
      setLoading((prev) => ({ ...prev, generate: true }));
      await generateFixtures(stage.id, { mode: 'auto' });
      message.success('Fixtures generated successfully');
    } catch {
      message.error('Failed to generate fixtures');
    } finally {
      setLoading((prev) => ({ ...prev, generate: false }));
    }
  };

  const handleSimulateFixtures = async () => {
    Modal.confirm({
      title: 'Simulate Fixtures',
      content: 'This will simulate all pending fixtures in this stage. Continue?',
      onOk: async () => {
        try {
          setLoading((prev) => ({ ...prev, simulate: true }));
          await simulateFixtures(stage.id);
          message.success('Fixtures simulated successfully');
        } catch {
          message.error('Failed to simulate fixtures');
        } finally {
          setLoading((prev) => ({ ...prev, simulate: false }));
        }
      },
    });
  };

  const handleSimulatePromotion = async () => {
    try {
      setLoading((prev) => ({ ...prev, simulatePromotion: true }));
      await simulatePromotion(stage.id);
      const { promotionSimulation } = useTournamentStore.getState();
      if (promotionSimulation) {
        Modal.info({
          title: 'Promotion Simulation',
          content: (
            <div>
              <p>{promotionSimulation.promoted_teams?.length || 0} teams qualify for next stage</p>
              {promotionSimulation.promoted_teams && promotionSimulation.promoted_teams.length > 0 && (
                <ul>
                  {promotionSimulation.promoted_teams.slice(0, 5).map((team) => (
                    <li key={team.id}>{team.name}</li>
                  ))}
                  {promotionSimulation.promoted_teams.length > 5 && <li>... and {promotionSimulation.promoted_teams.length - 5} more</li>}
                </ul>
              )}
              <p className="mt-2 text-sm text-gray-600">{promotionSimulation.explanation}</p>
            </div>
          ),
        });
      }
    } catch {
      message.error('Failed to simulate promotion');
    } finally {
      setLoading((prev) => ({ ...prev, simulatePromotion: false }));
    }
  };

  const handleExecutePromotion = async () => {
    Modal.confirm({
      title: 'Execute Promotion',
      content: 'This will advance qualifying teams to the next stage. This action cannot be undone. Continue?',
      okText: 'Execute',
      okType: 'danger',
      onOk: async () => {
        try {
          setLoading((prev) => ({ ...prev, executePromotion: true }));
          await executePromotion(stage.id);
          message.success('Promotion executed successfully');
        } catch {
          message.error('Failed to execute promotion');
        } finally {
          setLoading((prev) => ({ ...prev, executePromotion: false }));
        }
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Total Teams" value={stage.total_teams || 0} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Total Fixtures" value={stage.total_fixtures || 0} prefix={<CalendarOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Completed" value={stage.completed_fixtures || 0} prefix={<TrophyOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Pending" value={(stage.total_fixtures || 0) - (stage.completed_fixtures || 0)} />
          </Card>
        </Col>
      </Row>

      {/* Details */}
      <Card title="Stage Information">
        <Descriptions column={{ xs: 1, sm: 2 }} bordered>
          <Descriptions.Item label="Stage Name">{stage.name}</Descriptions.Item>
          <Descriptions.Item label="Order">Stage {stage.order}</Descriptions.Item>
          <Descriptions.Item label="Type">{getStageTypeBadge(stage.stage_type)}</Descriptions.Item>
          <Descriptions.Item label="Status">{getStatusBadge(stage.status)}</Descriptions.Item>
          {stage.started_at && <Descriptions.Item label="Started At">{format(new Date(stage.started_at), 'PPp')}</Descriptions.Item>}
          {stage.completed_at && <Descriptions.Item label="Completed At">{format(new Date(stage.completed_at), 'PPp')}</Descriptions.Item>}
        </Descriptions>
      </Card>

      {/* Settings */}
      <Card title="Stage Settings">
        <Descriptions column={{ xs: 1, sm: 2 }} bordered>
          <Descriptions.Item label="Match Duration">{stage.settings.match_duration} minutes</Descriptions.Item>
          <Descriptions.Item label="Match Interval">{stage.settings.match_interval} minutes</Descriptions.Item>
          {stage.settings.rounds && <Descriptions.Item label="Rounds">{stage.settings.rounds}</Descriptions.Item>}
          {stage.settings.home_and_away !== undefined && (
            <Descriptions.Item label="Home & Away">{stage.settings.home_and_away ? 'Yes' : 'No'}</Descriptions.Item>
          )}
          {stage.settings.groups_count && <Descriptions.Item label="Groups">{stage.settings.groups_count}</Descriptions.Item>}
          {stage.settings.teams_per_group && <Descriptions.Item label="Teams Per Group">{stage.settings.teams_per_group}</Descriptions.Item>}
          {stage.settings.legs && <Descriptions.Item label="Legs">{stage.settings.legs}</Descriptions.Item>}
          {stage.settings.third_place_match !== undefined && (
            <Descriptions.Item label="Third Place Match">{stage.settings.third_place_match ? 'Yes' : 'No'}</Descriptions.Item>
          )}
        </Descriptions>

        {stage.settings.scoring && (
          <div className="mt-4">
            <h4 className="mb-2 font-semibold">Scoring System</h4>
            <Descriptions size="small" column={3} bordered>
              <Descriptions.Item label="Win">{stage.settings.scoring.win} points</Descriptions.Item>
              <Descriptions.Item label="Draw">{stage.settings.scoring.draw} points</Descriptions.Item>
              <Descriptions.Item label="Loss">{stage.settings.scoring.loss} points</Descriptions.Item>
            </Descriptions>
          </div>
        )}

        {stage.settings.tie_breakers && stage.settings.tie_breakers.length > 0 && (
          <div className="mt-4">
            <h4 className="mb-2 font-semibold">Tie Breakers</h4>
            <ol className="list-inside list-decimal">
              {stage.settings.tie_breakers.map((tb) => (
                <li key={tb} className="capitalize">
                  {tb.replace(/_/g, ' ')}
                </li>
              ))}
            </ol>
          </div>
        )}
      </Card>

      {/* Actions */}
      <Card title="Stage Actions">
        <div className="flex flex-wrap gap-2">
          <Button
            type="primary"
            icon={<CalendarOutlined />}
            onClick={handleGenerateFixtures}
            loading={loading.generate}
            disabled={stage.status !== 'pending' || (stage.total_fixtures || 0) > 0}
          >
            Generate Fixtures
          </Button>

          <Button
            icon={<PlayCircleOutlined />}
            onClick={handleSimulateFixtures}
            loading={loading.simulate}
            disabled={stage.status !== 'active' || (stage.completed_fixtures || 0) >= (stage.total_fixtures || 0)}
          >
            Simulate Fixtures
          </Button>

          <Button
            icon={<RocketOutlined />}
            onClick={handleSimulatePromotion}
            loading={loading.simulatePromotion}
            disabled={stage.status !== 'completed'}
          >
            Simulate Promotion
          </Button>

          <Button
            danger
            icon={<RocketOutlined />}
            onClick={handleExecutePromotion}
            loading={loading.executePromotion}
            disabled={stage.status !== 'completed'}
          >
            Execute Promotion
          </Button>

          <Button
            icon={<EditOutlined />}
            onClick={() => router.visit(route('tournaments.stages.edit', { tournament: stage.tournament_id, stage: stage.id }))}
          >
            Edit Stage
          </Button>
        </div>
      </Card>
    </div>
  );
});

OverviewTab.displayName = 'OverviewTab';

// Teams Tab
const TeamsTab = memo(({ stage }: { stage: Stage }) => {
  const { fetchStage } = useTournamentStore();
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'seeding' | 'groups'>('list');

  const handleAssignSuccess = () => {
    fetchStage(stage.id);
  };

  const handleSaveSeeding = async () => {
    // This would call an API to update team seeding order
    // For now, we'll just show a success message
    message.success('Seeding order updated');
  };

  const handleSaveGroupAssignments = async () => {
    // This would call an API to update group assignments
    // For now, we'll just show a success message
    message.success('Group assignments updated');
  };

  const isGroupStage = stage.stage_type === 'group';
  const hasTeams = (stage.teams?.length || 0) > 0;

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Space>
          <Button type={activeView === 'list' ? 'primary' : 'default'} onClick={() => setActiveView('list')}>
            Team List
          </Button>
          {hasTeams && (
            <>
              <Button type={activeView === 'seeding' ? 'primary' : 'default'} onClick={() => setActiveView('seeding')}>
                Seeding
              </Button>
              {isGroupStage && (
                <Button type={activeView === 'groups' ? 'primary' : 'default'} onClick={() => setActiveView('groups')}>
                  <UsergroupAddOutlined /> Groups
                </Button>
              )}
            </>
          )}
        </Space>
        <Button type="primary" icon={<TeamOutlined />} onClick={() => setAssignModalVisible(true)}>
          Assign Teams
        </Button>
      </div>

      {/* Content */}
      {activeView === 'list' && (
        <Card>
          {hasTeams ? (
            <div className="space-y-2">
              {stage.teams?.map((team) => (
                <Card key={team.id} size="small" className="hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <Space>
                      <TeamOutlined className="text-blue-500" />
                      <Text strong>{team.name}</Text>
                      {team.seed && <Text className="text-sm text-gray-500">Seed #{team.seed}</Text>}
                      {team.group_id && <Text className="text-sm text-gray-500">Group {team.group_id}</Text>}
                    </Space>
                    {team.captain && <Text className="text-sm text-gray-500">Captain: {team.captain.name}</Text>}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <TeamOutlined className="mb-2 text-4xl" />
              <p>No teams assigned yet</p>
              <Button type="primary" className="mt-4" onClick={() => setAssignModalVisible(true)}>
                Assign Teams
              </Button>
            </div>
          )}
        </Card>
      )}

      {activeView === 'seeding' && hasTeams && (
        <SeedingConfiguration teams={stage.teams || []} onSave={handleSaveSeeding} onCancel={() => setActiveView('list')} />
      )}

      {activeView === 'groups' && isGroupStage && hasTeams && (
        <GroupAssignmentView
          groups={stage.groups || []}
          unassignedTeams={(stage.teams || []).filter((team) => !team.group_id)}
          onSave={handleSaveGroupAssignments}
          onCancel={() => setActiveView('list')}
        />
      )}

      {/* Team Assignment Modal */}
      <TeamAssignmentModal visible={assignModalVisible} stage={stage} onClose={() => setAssignModalVisible(false)} onSuccess={handleAssignSuccess} />
    </div>
  );
});

TeamsTab.displayName = 'TeamsTab';

// Fixtures Tab
const FixturesTab = memo(({ stage }: { stage: Stage }) => {
  const { fixtures, fixtureSimulation, generateFixtures, simulateFixtures, fetchFixtures, isLoadingFixtures } = useTournamentStore();
  const [activeView, setActiveView] = useState<'schedule' | 'generate' | 'simulate'>('schedule');
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    if (stage.id) {
      fetchFixtures({ stage_id: stage.id, include: 'first_team,second_team,match_events,betting_markets' });
    }
  }, [stage.id, fetchFixtures]);

  const handleEditScore = (fixture: Fixture) => {
    setSelectedFixture(fixture);
    setScoreModalVisible(true);
  };

  const handleGenerateFixtures = async (stageId: number, data: GenerateFixturesRequest) => {
    await generateFixtures(stageId, data);
    message.success('Fixtures generated successfully');
    fetchFixtures({ stage_id: stage.id, include: 'first_team,second_team,match_events,betting_markets' });
    setActiveView('schedule');
  };

  const handleSimulateFixtures = async (stageId: number) => {
    await simulateFixtures(stageId);
    message.success('Fixtures simulated successfully');
  };

  const handleResetSimulation = () => {
    message.info('Simulation reset');
  };

  const onCloseResultModal = useCallback(() => {
    setScoreModalVisible(false);
    setSelectedFixture(null);
  }, []);

  const stageFixtures = fixtures;
  const pendingFixtures = stageFixtures.filter((f) => f.status === 'upcoming' || f.status === 'postponed');
  const hasFixtures = stageFixtures.length > 0;
  console.log({ fixtures });

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Space>
          <Button type={activeView === 'schedule' ? 'primary' : 'default'} onClick={() => setActiveView('schedule')} disabled={!hasFixtures}>
            Schedule
          </Button>
          <Button type={activeView === 'generate' ? 'primary' : 'default'} onClick={() => setActiveView('generate')}>
            Generate
          </Button>
          {hasFixtures && (
            <Button type={activeView === 'simulate' ? 'primary' : 'default'} onClick={() => setActiveView('simulate')}>
              Simulate
            </Button>
          )}
        </Space>
      </div>

      {/* Content */}
      {activeView === 'schedule' &&
        (hasFixtures ? (
          <FixtureSchedule fixtures={stageFixtures} onEditScore={handleEditScore} loading={isLoadingFixtures} />
        ) : (
          <Card>
            <div className="py-8 text-center text-gray-500">
              <CalendarOutlined className="mb-2 text-4xl" />
              <p>No fixtures generated yet</p>
              <Button type="primary" className="mt-4" onClick={() => setActiveView('generate')}>
                Generate Fixtures
              </Button>
            </div>
          </Card>
        ))}

      {activeView === 'generate' && (
        <FixtureGenerator
          stageId={stage.id}
          stageName={stage.name}
          stageType={stage.stage_type}
          onGenerate={handleGenerateFixtures}
          onCancel={() => setActiveView('schedule')}
          loading={isLoadingFixtures}
          disabled={!stage.teams || stage.teams.length < 2}
          hasExistingFixtures={hasFixtures}
        />
      )}

      {activeView === 'simulate' && (
        <FixtureSimulator
          stageId={stage.id}
          stageName={stage.name}
          pendingFixtures={pendingFixtures}
          simulation={fixtureSimulation}
          onSimulate={handleSimulateFixtures}
          onReset={handleResetSimulation}
          loading={isLoadingFixtures}
        />
      )}

      {/* Submit Score Modal */}
      {selectedFixture && <SubmitResultModal visible={scoreModalVisible} fixture={selectedFixture} onClose={onCloseResultModal} stageId={stage.id} />}
    </div>
  );
});

FixturesTab.displayName = 'FixturesTab';

// Rankings Tab
const RankingsTab = memo(({ stage }: { stage: Stage }) => {
  const [viewMode, setViewMode] = useState<'overall' | 'groups'>('overall');
  const { rankings, groups, fetchRankings, fetchGroups, isLoadingRankings, isLoadingGroups } = useTournamentStore();

  useEffect(() => {
    // Fetch rankings if not present in stage or to ensure fresh data
    if (stage.id && (!stage.rankings || stage.rankings.length === 0)) {
      fetchRankings(stage.id);
    }

    // Fetch groups if stage is a group stage and groups not present
    if (stage.id && stage.stage_type === 'group' && (!stage.groups || stage.groups.length === 0)) {
      fetchGroups(stage.id);
    }
  }, [stage.id, stage.rankings, stage.groups, stage.stage_type, fetchRankings, fetchGroups]);

  // Use fetched rankings from store if available, otherwise fall back to stage.rankings
  const currentRankings = rankings.length > 0 ? rankings : stage.rankings || [];
  // Use fetched groups from store if available, otherwise fall back to stage.groups
  const currentGroups = groups.length > 0 ? groups : stage.groups || [];
  const showGroupView = stage.stage_type === 'group' && currentGroups.length > 0;
  const tieBreakers = stage.settings.tie_breakers || [];
  const tieBreakerObjects = tieBreakers.map((type, index) => ({
    id: index + 1,
    stage_id: stage.id,
    type: type as 'head_to_head' | 'goal_difference' | 'goals_scored' | 'goals_conceded' | 'wins' | 'away_goals' | 'fair_play' | 'drawing_lots',
    priority: index + 1,
    created_at: '',
    updated_at: '',
  }));

  return (
    <div className="space-y-4">
      {/* Tie Breakers Info */}
      {tieBreakers.length > 0 && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={showGroupView ? 24 : 12}>
            <TieBreakersDisplay tieBreakers={tieBreakerObjects} />
          </Col>
        </Row>
      )}

      {/* View Mode Toggle */}
      {showGroupView && (
        <Card size="small">
          <Space>
            <Button type={viewMode === 'overall' ? 'primary' : 'default'} onClick={() => setViewMode('overall')}>
              Overall Standings
            </Button>
            <Button type={viewMode === 'groups' ? 'primary' : 'default'} onClick={() => setViewMode('groups')}>
              Group Standings
            </Button>
          </Space>
        </Card>
      )}

      {/* Rankings Display */}
      {viewMode === 'overall' ? (
        <OverallStandings rankings={currentRankings} showGroup={showGroupView} loading={isLoadingRankings} />
      ) : (
        <GroupStandings rankings={currentRankings} groups={currentGroups} loading={isLoadingRankings || isLoadingGroups} />
      )}
    </div>
  );
});

RankingsTab.displayName = 'RankingsTab';

// Promotion Tab
const PromotionTab = memo(({ stage }: { stage: Stage }) => {
  const { promotionSimulation, fetchStage } = useTournamentStore();
  const [executeModalVisible, setExecuteModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const hasPromotion = !!stage.promotion;
  const promotedTeams = stage.promotion?.next_stage?.id ? [] : []; // This would come from API in real scenario
  const canEditPromotion = stage.status === 'pending' || (stage.total_fixtures || 0) === 0;

  console.log({ editModalVisible, canEditPromotion, hasPromotion });

  const handleExecuteSuccess = () => {
    message.success('Promotion executed successfully!');
    setExecuteModalVisible(false);
  };

  const handleEditSuccess = () => {
    fetchStage(stage.id);
    message.success('Promotion rules updated successfully');
  };

  return (
    <div className="space-y-4">
      {/* Promotion Rules */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <PromotionRulesDisplay promotion={stage.promotion} stageType={stage.stage_type} />
        </div>
        {canEditPromotion && hasPromotion && (
          <Button type="primary" icon={<EditOutlined />} onClick={() => setEditModalVisible(true)}>
            Edit Rules
          </Button>
        )}
      </div>

      {!canEditPromotion && (stage.status !== 'pending' || (stage.total_fixtures || 0) > 0) && (
        <Card size="small" className="border-orange-200 bg-orange-50">
          <Text className="text-sm text-orange-700">⚠️ Promotion rules cannot be edited once fixtures are generated or the stage is active.</Text>
        </Card>
      )}

      {!hasPromotion && (
        <Card>
          <div className="py-8 text-center text-gray-500">
            <RocketOutlined className="mb-2 text-4xl" />
            <p>No promotion rules configured for this stage</p>
            <p className="text-sm">Teams from this stage will not automatically advance</p>
            {canEditPromotion && (
              <Button type="primary" className="mt-4" onClick={() => setEditModalVisible(true)}>
                Configure Promotion Rules
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Promotion Preview */}
      {stage.status === 'active' || stage.status === 'completed' ? (
        <PromotionPreview stageId={stage.id} onExecute={() => setExecuteModalVisible(true)} />
      ) : (
        <Card>
          <div className="py-4 text-center text-gray-500">
            <p>Promotion preview will be available when the stage is active or completed</p>
          </div>
        </Card>
      )}

      {/* Promoted Teams (if any) */}
      {promotedTeams.length > 0 && <PromotedTeamsList teams={promotedTeams} nextStageName={stage.promotion?.next_stage?.name} showRank />}

      {/* Execute Promotion Modal */}
      {promotionSimulation && (
        <ExecutePromotionModal
          visible={executeModalVisible}
          stageId={stage.id}
          promotedTeams={promotionSimulation.promoted_teams}
          nextStageName={promotionSimulation.next_stage.name}
          onClose={() => setExecuteModalVisible(false)}
          onSuccess={handleExecuteSuccess}
        />
      )}

      {/* Edit Promotion Rules Modal */}
      <PromotionRuleEditModal visible={editModalVisible} stage={stage} onClose={() => setEditModalVisible(false)} onSuccess={handleEditSuccess} />
    </div>
  );
});

PromotionTab.displayName = 'PromotionTab';

// Main component
const ShowStage = ({ tournamentId, stageId }: ShowStageProps) => {
  const { currentStage, fetchStage, isLoadingStage } = useTournamentStore();

  useEffect(() => {
    fetchStage(stageId);
  }, [stageId, fetchStage]);

  if (isLoadingStage || !currentStage) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2" />
          <p className="text-gray-500">Loading stage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title={`${currentStage.name}`} />
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-bold">{currentStage.name}</h1>
            <div className="flex items-center gap-2">
              {getStageTypeBadge(currentStage.stage_type)}
              {getStatusBadge(currentStage.status)}
            </div>
          </div>
          <Button onClick={() => router.visit(route('tournaments.show', { tournament: tournamentId }))}>Back to Tournament</Button>
        </div>

        {/* Tabs */}
        <Tabs defaultActiveKey="overview" type="card">
          <TabPane tab="Overview" key="overview">
            <OverviewTab stage={currentStage} />
          </TabPane>
          <TabPane tab="Teams" key="teams">
            <TeamsTab stage={currentStage} />
          </TabPane>
          <TabPane tab="Fixtures" key="fixtures">
            <FixturesTab stage={currentStage} />
          </TabPane>
          <TabPane tab="Rankings" key="rankings">
            <RankingsTab stage={currentStage} />
          </TabPane>
          <TabPane tab="Promotion" key="promotion">
            <PromotionTab stage={currentStage} />
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default ShowStage;
