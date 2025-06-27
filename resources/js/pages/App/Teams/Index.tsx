import { Head, router } from '@inertiajs/react';
import { Button, Card, Col, Row, Space, Typography } from 'antd';
import React from 'react';
import { TeamList } from '../../../components/Teams';
import type { MatchSession } from '../../../types/matchSession.types';
import type { TeamDetails } from '../../../types/team.types';
import type { Turf } from '../../../types/turf.types';

const { Title, Text } = Typography;

interface TeamsIndexProps {
  turf: Turf;
  matchSession: MatchSession;
  teams: { data: TeamDetails[] };
}

const TeamsIndex: React.FC<TeamsIndexProps> = ({ turf, matchSession, teams }) => {
  const handleGoBack = () => {
    router.visit(
      route('web.turfs.match-sessions.show', {
        turf: turf.id,
        matchSession: matchSession.id,
      }),
    );
  };

  return (
    <>
      <Head title={`Teams - ${matchSession.name} - ${turf.name}`} />

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-green-900">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <Card className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <Button onClick={handleGoBack} className="mb-4">
                  ← Back to Match Session
                </Button>

                <Title level={2} className="mb-2">
                  Teams - {matchSession.name}
                </Title>

                <Space direction="vertical" size="small">
                  <Text type="secondary">
                    <strong>Turf:</strong> {turf.name}
                  </Text>
                  <Text type="secondary">
                    <strong>Session Date:</strong> {new Date(matchSession.session_date).toLocaleDateString()}
                  </Text>
                  <Text type="secondary">
                    <strong>Time:</strong> {matchSession.start_time} - {matchSession.end_time}
                  </Text>
                  <Text type="secondary">
                    <strong>Teams:</strong> {teams.data.length} / {matchSession.max_teams}
                  </Text>
                </Space>
              </div>
            </div>
          </Card>

          {/* Teams Grid */}
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <TeamList
                teams={teams.data}
                matchSession={matchSession}
                turf={turf}
                showJoinButtons={true}
                onTeamUpdate={() => {
                  // Refresh page
                  router.reload();
                }}
              />
            </Col>
          </Row>
        </div>
      </div>
    </>
  );
};

export default TeamsIndex;
