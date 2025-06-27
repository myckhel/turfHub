import { Head, router } from '@inertiajs/react';
import { Button, Card, Space, Typography } from 'antd';
import React from 'react';
import { TeamDetails as TeamDetailsComponent } from '../../../components/Teams';
import type { MatchSession } from '../../../types/matchSession.types';
import type { TeamDetails } from '../../../types/team.types';
import type { Turf } from '../../../types/turf.types';

const { Title, Text } = Typography;

interface TeamShowProps {
  turf: Turf;
  matchSession: MatchSession;
  team: { data: TeamDetails };
}

const TeamShow: React.FC<TeamShowProps> = ({ turf, matchSession, team }) => {
  const handleGoBack = () => {
    router.visit(
      route('web.turfs.match-sessions.teams.index', {
        turf: turf.id,
        matchSession: matchSession.id,
      }),
    );
  };

  return (
    <>
      <Head title={`${team.data.name} - ${matchSession.name} - ${turf.name}`} />

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-green-900">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <Card className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <Button onClick={handleGoBack} className="mb-4">
                  ← Back to Teams
                </Button>

                <Title level={2} className="mb-2">
                  {team.data.name}
                </Title>

                <Space direction="vertical" size="small">
                  <Text type="secondary">
                    <strong>Match Session:</strong> {matchSession.name}
                  </Text>
                  <Text type="secondary">
                    <strong>Turf:</strong> {turf.name}
                  </Text>
                  <Text type="secondary">
                    <strong>Status:</strong> {team.data.status}
                  </Text>
                </Space>
              </div>
            </div>
          </Card>

          {/* Team Details */}
          <TeamDetailsComponent
            team={team.data}
            matchSession={matchSession}
            turf={turf}
            onUpdate={() => {
              // Refresh page
              router.reload();
            }}
          />
        </div>
      </div>
    </>
  );
};

export default TeamShow;
