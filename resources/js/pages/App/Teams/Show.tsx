import { Head, router } from '@inertiajs/react';
import { Button, Card, Typography } from 'antd';
import React from 'react';
import { TeamDetails as TeamDetailsComponent } from '../../../components/Teams';
import type { MatchSession } from '../../../types/matchSession.types';
import type { TeamDetails } from '../../../types/team.types';
import type { Turf } from '../../../types/turf.types';

const { Title, Text } = Typography;

interface TeamShowProps {
  turf: Turf;
  matchSession: MatchSession;
  team: TeamDetails;
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
      <Head title={`${team.name} - ${matchSession.name} - ${turf.name}`} />

      <div className="min-h-screen">
        <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6">
          {/* Header */}
          <Card className="mb-4 sm:mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <Button onClick={handleGoBack} className="mb-4" size="small">
                  ← Back to Teams
                </Button>

                <Title level={2} className="mb-2 text-lg sm:text-xl lg:text-2xl">
                  {team.name}
                </Title>

                <div className="flex flex-col gap-2 sm:gap-1">
                  <Text type="secondary" className="text-sm sm:text-base">
                    <strong>Match Session:</strong> {matchSession.name}
                  </Text>
                  <Text type="secondary" className="text-sm sm:text-base">
                    <strong>Turf:</strong> {turf.name}
                  </Text>
                  <Text type="secondary" className="text-sm sm:text-base">
                    <strong>Status:</strong> {team.status}
                  </Text>
                </div>
              </div>
            </div>
          </Card>

          {/* Team Details */}
          <TeamDetailsComponent
            team={team}
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
