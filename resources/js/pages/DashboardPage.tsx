import { CalendarOutlined, EnvironmentOutlined, PlayCircleOutlined, TrophyOutlined, UserAddOutlined } from '@ant-design/icons';
import { Badge, Typography } from 'antd';
import React from 'react';
import MobileLayout from '../components/layout/MobileLayout';
import ThemeToggle from '../components/ui/ThemeToggle';
import TurfButton from '../components/ui/TurfButton';
import TurfCard from '../components/ui/TurfCard';

const { Title, Text, Paragraph } = Typography;

// Mock data for demonstration
const upcomingMatches = [
  {
    id: 1,
    title: 'Friday Night Football',
    time: '7:00 PM',
    location: 'Green Valley Turf',
    players: 8,
    maxPlayers: 10,
    difficulty: 'Intermediate',
  },
  {
    id: 2,
    title: 'Weekend Warriors',
    time: '10:00 AM',
    location: 'City Sports Complex',
    players: 6,
    maxPlayers: 12,
    difficulty: 'Beginner',
  },
];

const recentResults = [
  {
    id: 1,
    match: 'Thursday Evening',
    result: 'W 3-1',
    goals: 2,
    assists: 1,
  },
  {
    id: 2,
    match: 'Sunday League',
    result: 'L 1-2',
    goals: 1,
    assists: 0,
  },
];

export const DashboardPage: React.FC = () => {
  return (
    <MobileLayout
      activeTab="home"
      title="Welcome back!"
      subtitle="Ready to play?"
      headerRightContent={<ThemeToggle size="small" />}
      backgroundVariant="gradient"
    >
      <div className="space-y-6">
        {/* Hero Card */}
        <TurfCard variant="hero" className="text-center">
          <div className="space-y-4">
            <Title level={2} className="!mb-2 !text-white">
              TurfMate
            </Title>
            <Paragraph className="!mb-4 !text-white/90">"Queue. Play. Win. Repeat."</Paragraph>
            <TurfButton variant="secondary" size="touch" fullWidth icon={<PlayCircleOutlined />}>
              Quick Match
            </TurfButton>
          </div>
        </TurfCard>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <TurfCard variant="elevated" className="text-center">
            <div className="space-y-2">
              <Text className="text-2xl font-bold text-turf-green">24</Text>
              <Text className="text-sm text-slate-500">Matches</Text>
            </div>
          </TurfCard>

          <TurfCard variant="elevated" className="text-center">
            <div className="space-y-2">
              <Text className="text-2xl font-bold text-sky-blue">18</Text>
              <Text className="text-sm text-slate-500">Goals</Text>
            </div>
          </TurfCard>

          <TurfCard variant="elevated" className="text-center">
            <div className="space-y-2">
              <Text className="text-2xl font-bold text-electric-yellow">12</Text>
              <Text className="text-sm text-slate-500">Assists</Text>
            </div>
          </TurfCard>
        </div>

        {/* Upcoming Matches */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Title level={3} className="!mb-0">
              Upcoming Matches
            </Title>
            <TurfButton variant="ghost" size="small">
              View All
            </TurfButton>
          </div>

          <div className="space-y-3">
            {upcomingMatches.map((match) => (
              <TurfCard key={match.id} variant="outlined" interactive springOnPress onPress={() => console.log('Navigate to match:', match.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Title level={4} className="!mb-1">
                      {match.title}
                    </Title>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <CalendarOutlined />
                        {match.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <EnvironmentOutlined />
                        {match.location}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge count={`${match.players}/${match.maxPlayers}`} style={{ backgroundColor: 'var(--color-turf-green)' }} />
                      <Text className="text-xs text-slate-500">{match.difficulty}</Text>
                    </div>
                  </div>

                  <TurfButton variant="primary" size="small" icon={<UserAddOutlined />}>
                    Join
                  </TurfButton>
                </div>
              </TurfCard>
            ))}
          </div>
        </div>

        {/* Recent Results */}
        <div className="space-y-4">
          <Title level={3} className="!mb-0">
            Recent Results
          </Title>

          <div className="space-y-3">
            {recentResults.map((result) => (
              <TurfCard key={result.id} variant="default">
                <div className="flex items-center justify-between">
                  <div>
                    <Text className="font-medium">{result.match}</Text>
                    <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
                      <span>{result.goals} goals</span>
                      <span>{result.assists} assists</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <Text className={`font-bold ${result.result.startsWith('W') ? 'text-green-500' : 'text-red-500'}`}>{result.result}</Text>
                  </div>
                </div>
              </TurfCard>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <TurfButton variant="accent" size="touch" fullWidth icon={<TrophyOutlined />}>
            Rankings
          </TurfButton>

          <TurfButton variant="secondary" size="touch" fullWidth icon={<CalendarOutlined />}>
            Schedule
          </TurfButton>
        </div>
      </div>
    </MobileLayout>
  );
};

export default DashboardPage;
