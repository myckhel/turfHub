import {
  CalendarOutlined,
  ClearOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  PrinterOutlined,
  SearchOutlined,
  TrophyOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Badge, Button, Card, Empty, Input, Radio, Select, Space, Statistic, Tag, Tooltip, Typography } from 'antd';
import { format, isToday, isTomorrow } from 'date-fns';
import { memo, startTransition, useMemo, useState } from 'react';
import type { Fixture } from '../../../types/tournament.types';
import FixtureCard from './FixtureCard';

const { Title, Text } = Typography;

interface FixtureScheduleProps {
  fixtures: Fixture[];
  onEditScore?: (fixture: Fixture) => void;
  loading?: boolean;
}

const FixtureSchedule = memo(({ fixtures, onEditScore, loading }: FixtureScheduleProps) => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filterStatus, setFilterStatus] = useState<Fixture['status'] | 'all'>('all');
  const [filterGroup, setFilterGroup] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique groups
  const groups = Array.from(new Set(fixtures.filter((f) => f.group_id).map((f) => f.group_id))).map((id) => {
    const fixture = fixtures.find((f) => f.group_id === id);
    return {
      id: id!,
      name: fixture?.group?.name || `Group ${id}`,
    };
  });

  // Calculate statistics
  const statistics = useMemo(
    () => ({
      total: fixtures.length,
      completed: fixtures.filter((f) => f.status === 'completed').length,
      upcoming: fixtures.filter((f) => f.status === 'upcoming').length,
      ongoing: fixtures.filter((f) => f.status === 'in_progress').length,
      today: fixtures.filter((f) => f.match_time && isToday(new Date(f.match_time))).length,
      tomorrow: fixtures.filter((f) => f.match_time && isTomorrow(new Date(f.match_time))).length,
    }),
    [fixtures],
  );

  // Filter fixtures with search
  const filteredFixtures = useMemo(() => {
    return fixtures.filter((fixture) => {
      // Status filter
      if (filterStatus !== 'all' && fixture.status !== filterStatus) return false;

      // Group filter
      if (filterGroup !== 'all' && fixture.group_id !== filterGroup) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTeam = fixture.first_team?.name?.toLowerCase().includes(query) || fixture.second_team?.name?.toLowerCase().includes(query);
        const matchesGroup = fixture.group?.name?.toLowerCase().includes(query);
        if (!matchesTeam && !matchesGroup) return false;
      }

      return true;
    });
  }, [fixtures, filterStatus, filterGroup, searchQuery]);

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

  // Status filter options with counts
  const statusOptions: { label: string; value: Fixture['status'] | 'all'; count?: number }[] = [
    { label: 'All Status', value: 'all', count: statistics.total },
    { label: 'Upcoming', value: 'upcoming', count: statistics.upcoming },
    { label: 'Ongoing', value: 'in_progress', count: statistics.ongoing },
    { label: 'Completed', value: 'completed', count: statistics.completed },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Postponed', value: 'postponed' },
  ];

  const hasActiveFilters = filterStatus !== 'all' || filterGroup !== 'all' || searchQuery.trim() !== '';

  const handleClearFilters = () => {
    startTransition(() => {
      setFilterStatus('all');
      setFilterGroup('all');
      setSearchQuery('');
    });
  };

  const handleQuickFilter = (status: Fixture['status'] | 'all') => {
    startTransition(() => {
      setFilterStatus(status);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Header with Statistics */}
      <Card className="border-l-4 border-blue-500">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Title level={4} className="mb-1">
              <TrophyOutlined className="mr-2 text-blue-500" />
              Fixture Schedule
            </Title>
            <Text className="text-gray-500">Manage and track all tournament fixtures</Text>
          </div>

          <Space wrap>
            <Tooltip title="Toggle filters">
              <Button icon={<FilterOutlined />} onClick={() => setShowFilters(!showFilters)} type={hasActiveFilters ? 'primary' : 'default'}>
                Filters{' '}
                {hasActiveFilters && (
                  <Badge count={[filterStatus !== 'all', filterGroup !== 'all', searchQuery.trim() !== ''].filter(Boolean).length} />
                )}
              </Button>
            </Tooltip>
            <Tooltip title="Print schedule">
              <Button icon={<PrinterOutlined />} onClick={handlePrint} />
            </Tooltip>
          </Space>
        </div>

        {/* Statistics Row */}
        <div className="mb-4 grid grid-cols-2 gap-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-4 md:grid-cols-6 dark:from-blue-950 dark:to-purple-950">
          <Statistic title="Total" value={statistics.total} prefix={<TrophyOutlined className="text-blue-500" />} className="text-center" />
          <Statistic title="Completed" value={statistics.completed} valueStyle={{ color: '#52c41a' }} className="text-center" />
          <Statistic title="Upcoming" value={statistics.upcoming} valueStyle={{ color: '#1890ff' }} className="text-center" />
          <Statistic
            title="Ongoing"
            value={statistics.ongoing}
            valueStyle={{ color: '#faad14' }}
            prefix={<ClockCircleOutlined />}
            className="text-center"
          />
          <Statistic title="Today" value={statistics.today} valueStyle={{ color: '#eb2f96' }} prefix={<CalendarOutlined />} className="text-center" />
          <Statistic title="Tomorrow" value={statistics.tomorrow} valueStyle={{ color: '#722ed1' }} className="text-center" />
        </div>

        {/* Quick Filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Text className="self-center text-sm font-medium text-gray-500">Quick filters:</Text>
          <Tag.CheckableTag checked={filterStatus === 'all'} onChange={() => handleQuickFilter('all')} className="cursor-pointer">
            All
          </Tag.CheckableTag>
          <Tag.CheckableTag checked={filterStatus === 'upcoming'} onChange={() => handleQuickFilter('upcoming')} className="cursor-pointer">
            Upcoming ({statistics.upcoming})
          </Tag.CheckableTag>
          <Tag.CheckableTag checked={filterStatus === 'in_progress'} onChange={() => handleQuickFilter('in_progress')} className="cursor-pointer">
            Ongoing ({statistics.ongoing})
          </Tag.CheckableTag>
          <Tag.CheckableTag checked={filterStatus === 'completed'} onChange={() => handleQuickFilter('completed')} className="cursor-pointer">
            Completed ({statistics.completed})
          </Tag.CheckableTag>
        </div>

        {/* Advanced Filters (Collapsible) */}
        {showFilters && (
          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <Space wrap className="w-full">
              {/* Search */}
              <Input
                placeholder="Search teams or groups..."
                prefix={<SearchOutlined />}
                value={searchQuery}
                onChange={(e) => startTransition(() => setSearchQuery(e.target.value))}
                allowClear
                style={{ width: 250 }}
              />

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
              <Select
                value={filterStatus}
                onChange={(value) => startTransition(() => setFilterStatus(value))}
                style={{ width: 180 }}
                placeholder="Filter by status"
              >
                {statusOptions.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label} {opt.count !== undefined && `(${opt.count})`}
                  </Select.Option>
                ))}
              </Select>

              {/* Group Filter */}
              {groups.length > 0 && (
                <Select
                  value={filterGroup}
                  onChange={(value) => startTransition(() => setFilterGroup(value))}
                  style={{ width: 180 }}
                  placeholder="Filter by group"
                >
                  <Select.Option value="all">All Groups</Select.Option>
                  {groups.map((group) => (
                    <Select.Option key={group.id} value={group.id}>
                      {group.name}
                    </Select.Option>
                  ))}
                </Select>
              )}

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Tooltip title="Clear all filters">
                  <Button icon={<ClearOutlined />} onClick={handleClearFilters}>
                    Clear
                  </Button>
                </Tooltip>
              )}
            </Space>
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
            <Text className="text-sm font-medium text-blue-700 dark:text-blue-300">
              <FilterOutlined className="mr-1" />
              Active filters:
            </Text>
            {filterStatus !== 'all' && (
              <Tag closable onClose={() => setFilterStatus('all')} color="blue">
                Status: {statusOptions.find((opt) => opt.value === filterStatus)?.label}
              </Tag>
            )}
            {filterGroup !== 'all' && (
              <Tag closable onClose={() => setFilterGroup('all')} color="purple">
                Group: {groups.find((g) => g.id === filterGroup)?.name}
              </Tag>
            )}
            {searchQuery.trim() && (
              <Tag closable onClose={() => setSearchQuery('')} color="green">
                Search: "{searchQuery}"
              </Tag>
            )}
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              ({filteredFixtures.length} of {fixtures.length} fixtures)
            </Text>
          </div>
        )}
      </Card>

      {/* Content */}
      {loading ? (
        <Card>
          <div className="py-12 text-center">
            <Space direction="vertical" size="large">
              <div className="animate-pulse">
                <TrophyOutlined className="text-6xl text-blue-500" />
              </div>
              <Text className="text-gray-500">Loading fixtures...</Text>
            </Space>
          </div>
        </Card>
      ) : filteredFixtures.length === 0 ? (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical">
                <Text className="text-gray-500">{hasActiveFilters ? 'No fixtures match your filters' : 'No fixtures available yet'}</Text>
                {hasActiveFilters && (
                  <Button type="primary" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                )}
              </Space>
            }
          />
        </Card>
      ) : viewMode === 'list' ? (
        // List View
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2 dark:bg-gray-800">
            <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Showing {filteredFixtures.length} {filteredFixtures.length === 1 ? 'fixture' : 'fixtures'}
            </Text>
            <Text className="text-xs text-gray-500">Sorted by date</Text>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredFixtures.map((fixture) => (
              <FixtureCard key={fixture.id} fixture={fixture} onEditScore={onEditScore} />
            ))}
          </div>
        </div>
      ) : (
        // Calendar View
        <div className="space-y-4">
          {sortedDates.map((date) => {
            const dateObj = new Date(date);
            const isDateToday = isToday(dateObj);
            const isDateTomorrow = isTomorrow(dateObj);
            const dateLabel = isDateToday ? 'Today' : isDateTomorrow ? 'Tomorrow' : format(dateObj, 'EEEE, MMMM dd, yyyy');

            return (
              <Card
                key={date}
                title={
                  <Space>
                    <CalendarOutlined className={isDateToday ? 'text-blue-500' : isDateTomorrow ? 'text-purple-500' : ''} />
                    <span>{dateLabel}</span>
                    {(isDateToday || isDateTomorrow) && (
                      <Badge status={isDateToday ? 'processing' : 'default'} text={format(dateObj, 'MMM dd, yyyy')} />
                    )}
                    <Tag color="blue">{fixturesByDate[date].length} fixtures</Tag>
                  </Space>
                }
                size="small"
                className={isDateToday ? 'border-l-4 border-blue-500' : isDateTomorrow ? 'border-l-4 border-purple-500' : ''}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            );
          })}
          {sortedDates.length === 0 && (
            <Card>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical">
                    <CalendarOutlined className="text-4xl text-gray-400" />
                    <Text className="text-gray-500">No scheduled fixtures with dates</Text>
                  </Space>
                }
              />
            </Card>
          )}
        </div>
      )}
    </div>
  );
});

FixtureSchedule.displayName = 'FixtureSchedule';

export default FixtureSchedule;
