import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Radio, Select, Space, Typography } from 'antd';
import { format } from 'date-fns';
import { memo, useState } from 'react';
import type { Fixture, FixtureStatus } from '../../../types/tournament.types';
import FixtureCard from './FixtureCard';

const { Title, Text } = Typography;

interface FixtureScheduleProps {
  fixtures: Fixture[];
  onEditScore?: (fixture: Fixture) => void;
  loading?: boolean;
}

const FixtureSchedule = memo(({ fixtures, onEditScore }: FixtureScheduleProps) => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filterStatus, setFilterStatus] = useState<FixtureStatus | 'all'>('all');
  const [filterGroup, setFilterGroup] = useState<number | 'all'>('all');

  // Get unique groups
  const groups = Array.from(new Set(fixtures.filter((f) => f.group_id).map((f) => f.group_id))).map((id) => {
    const fixture = fixtures.find((f) => f.group_id === id);
    return {
      id: id!,
      name: fixture?.group?.name || `Group ${id}`,
    };
  });

  // Filter fixtures
  const filteredFixtures = fixtures.filter((fixture) => {
    if (filterStatus !== 'all' && fixture.status !== filterStatus) return false;
    if (filterGroup !== 'all' && fixture.group_id !== filterGroup) return false;
    return true;
  });

  // Group fixtures by date for calendar view
  const fixturesByDate = filteredFixtures.reduce(
    (acc, fixture) => {
      if (fixture.starts_at) {
        const date = format(new Date(fixture.starts_at), 'yyyy-MM-dd');
        if (!acc[date]) acc[date] = [];
        acc[date].push(fixture);
      }
      return acc;
    },
    {} as Record<string, Fixture[]>,
  );

  const sortedDates = Object.keys(fixturesByDate).sort();

  // Status filter options
  const statusOptions: { label: string; value: FixtureStatus | 'all' }[] = [
    { label: 'All Status', value: 'all' },
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'Ongoing', value: 'ongoing' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Postponed', value: 'postponed' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Title level={4} className="mb-1">
              <CalendarOutlined className="mr-2" />
              Fixture Schedule
            </Title>
            <Text className="text-gray-600">{fixtures.length} total fixtures</Text>
          </div>

          <Space wrap>
            {/* View Mode Toggle */}
            <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)} buttonStyle="solid">
              <Radio.Button value="list">
                <UnorderedListOutlined /> List
              </Radio.Button>
              <Radio.Button value="calendar">
                <CalendarOutlined /> Calendar
              </Radio.Button>
            </Radio.Group>

            {/* Status Filter */}
            <Select value={filterStatus} onChange={setFilterStatus} options={statusOptions} style={{ width: 150 }} placeholder="Filter by status" />

            {/* Group Filter */}
            {groups.length > 0 && (
              <Select value={filterGroup} onChange={setFilterGroup} style={{ width: 150 }} placeholder="Filter by group">
                <Select.Option value="all">All Groups</Select.Option>
                {groups.map((group) => (
                  <Select.Option key={group.id} value={group.id}>
                    {group.name}
                  </Select.Option>
                ))}
              </Select>
            )}
          </Space>
        </div>

        {/* Filter Summary */}
        {(filterStatus !== 'all' || filterGroup !== 'all') && (
          <div className="mt-3 flex items-center gap-2">
            <Text className="text-sm text-gray-500">
              Showing {filteredFixtures.length} of {fixtures.length} fixtures
            </Text>
            <Button
              type="link"
              size="small"
              onClick={() => {
                setFilterStatus('all');
                setFilterGroup('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </Card>

      {/* Content */}
      {filteredFixtures.length === 0 ? (
        <Card>
          <Empty description="No fixtures match the selected filters" />
        </Card>
      ) : viewMode === 'list' ? (
        // List View
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredFixtures.map((fixture) => (
            <FixtureCard key={fixture.id} fixture={fixture} onEditScore={onEditScore} />
          ))}
        </div>
      ) : (
        // Calendar View
        <div className="space-y-4">
          {sortedDates.map((date) => (
            <Card key={date} title={format(new Date(date), 'EEEE, MMMM dd, yyyy')} size="small">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {fixturesByDate[date]
                  .sort((a, b) => {
                    if (!a.starts_at || !b.starts_at) return 0;
                    return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
                  })
                  .map((fixture) => (
                    <FixtureCard key={fixture.id} fixture={fixture} onEditScore={onEditScore} />
                  ))}
              </div>
            </Card>
          ))}
          {sortedDates.length === 0 && (
            <Card>
              <Empty description="No scheduled fixtures with dates" />
            </Card>
          )}
        </div>
      )}
    </div>
  );
});

FixtureSchedule.displayName = 'FixtureSchedule';

export default FixtureSchedule;
