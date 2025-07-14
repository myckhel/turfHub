import {
  CheckCircleOutlined,
  CrownOutlined,
  EditOutlined,
  EnvironmentOutlined,
  FilterOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { router } from '@inertiajs/react';
import { Button, Empty, Input, Skeleton, Spin, Typography, message } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { turfApi } from '../../../apis/turf';
import SelectedTurfCard from '../../../components/Turf/SelectedTurfCard';
import Card from '../../../components/ui/Card';
import { useAuth } from '../../../hooks/useAuth';
import type { User } from '../../../stores/auth.store';
import { useTurfStore } from '../../../stores/turf.store';
import type { Turf } from '../../../types/turf.types';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

// Header Section Component
const TurfListHeader: React.FC = () => {
  const handleCreateTurf = () => {
    router.visit(route('web.turfs.create'));
  };

  return (
    <div className="my-4 sm:my-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Title level={2} className="mb-2 text-lg text-white sm:text-xl lg:text-2xl">
            Discover Turfs
          </Title>
          <Text className="text-sm text-gray-300 sm:text-base">Find and join football turfs in your area</Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleCreateTurf}
          className="border-green-600 bg-green-600 hover:border-green-700 hover:bg-green-700"
        >
          <span className="hidden sm:inline">Create Turf</span>
          <span className="sm:hidden">Create</span>
        </Button>
      </div>
    </div>
  );
};

// Search Component with encapsulated state
interface TurfSearchProps {
  onSearch: (value: string) => void;
  onFilterChange: (filter: 'all' | 'owned' | 'joined') => void;
  currentFilter: 'all' | 'owned' | 'joined';
  loading: boolean;
}

const TurfSearch: React.FC<TurfSearchProps> = ({ onSearch, onFilterChange, currentFilter, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="mb-4 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
      <Search
        placeholder="Search turfs..."
        allowClear
        enterButton={<SearchOutlined />}
        size="large"
        value={searchTerm}
        onChange={handleChange}
        onSearch={handleSearch}
        className="w-full sm:max-w-md"
        loading={loading}
      />

      <div className="flex flex-wrap gap-2 sm:gap-2">
        <Button
          type={currentFilter === 'all' ? 'primary' : 'default'}
          icon={<FilterOutlined />}
          onClick={() => onFilterChange('all')}
          className="flex-1 sm:flex-none"
        >
          <span className="hidden sm:inline">All</span>
        </Button>
        <Button
          type={currentFilter === 'owned' ? 'primary' : 'default'}
          icon={<CrownOutlined />}
          onClick={() => onFilterChange('owned')}
          className="flex-1 sm:flex-none"
        >
          <span className="hidden sm:inline">My Turfs</span>
          <span className="sm:hidden">Mine</span>
        </Button>
        <Button
          type={currentFilter === 'joined' ? 'primary' : 'default'}
          icon={<TeamOutlined />}
          onClick={() => onFilterChange('joined')}
          className="flex-1 sm:flex-none"
        >
          <span className="hidden sm:inline">Joined</span>
        </Button>
      </div>
    </div>
  );
};

// Turf Card Actions Component
interface TurfCardActionsProps {
  turf: Turf;
  isMember: boolean;
  isSelected: boolean;
  isOwner: boolean;
  joinLoading: boolean;
  onJoin: (turf: Turf) => void;
  onSelect: (turf: Turf | null) => void;
}

const TurfCardActions: React.FC<TurfCardActionsProps> = ({ turf, isMember, isSelected, isOwner, joinLoading, onJoin, onSelect }) => {
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.visit(route('web.turfs.show', { turf: turf.id }));
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.visit(route('web.turfs.edit', { turf: turf.id }));
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(isSelected ? null : turf);
  };

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onJoin(turf);
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
      <Button type="default" size="small" onClick={handleViewDetails} className="flex-1 text-xs sm:text-sm">
        <span className="hidden sm:inline">View Details</span>
        <span className="sm:hidden">View</span>
      </Button>

      {isOwner ? (
        <Button type="default" size="small" icon={<EditOutlined />} onClick={handleEdit} className="flex-1 text-xs sm:text-sm">
          <span className="hidden sm:inline">Edit</span>
        </Button>
      ) : (
        <>
          {isMember ? (
            <Button type={isSelected ? 'default' : 'primary'} size="small" onClick={handleSelect} className="flex-1 text-xs sm:text-sm">
              {isSelected ? 'Deselect' : 'Select'}
            </Button>
          ) : (
            <Button
              type="primary"
              size="small"
              loading={joinLoading}
              onClick={handleJoin}
              disabled={!turf.is_active}
              className="flex-1 text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Join Turf</span>
              <span className="sm:hidden">Join</span>
            </Button>
          )}
        </>
      )}
    </div>
  );
};

// Individual Turf Card Component
interface TurfListCardProps {
  turf: Turf;
  user: User | null;
  selectedTurf: Turf | null;
  belongingTurfs: Turf[];
  joinLoading: number | null;
  onJoin: (turf: Turf) => void;
  onSelect: (turf: Turf | null) => void;
}

const TurfListCard: React.FC<TurfListCardProps> = ({ turf, user, selectedTurf, belongingTurfs, joinLoading, onJoin, onSelect }) => {
  const isMember = belongingTurfs.some((t) => t.id === turf.id);
  const isSelected = selectedTurf?.id === turf.id;
  const isOwner = turf.owner_id === user?.id;
  const isJoinLoading = joinLoading === turf.id;

  return (
    <Card
      key={turf.id}
      variant={isSelected ? 'elevated' : 'default'}
      interactive
      className={`turf-card ${isSelected ? 'selected' : ''}`}
      onPress={() => router.visit(route('web.turfs.show', { turf: turf.id }))}
    >
      <div className="p-3 sm:p-4">
        {/* Header */}
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <Title level={4} className="mb-1 text-sm text-white sm:text-base">
              {turf.name}
              {isOwner && <CrownOutlined className="ml-1 text-yellow-400 sm:ml-2" />}
              {isSelected && <CheckCircleOutlined className="ml-1 text-green-400 sm:ml-2" />}
            </Title>
            <Text type="secondary" className="flex items-center text-xs text-gray-300 sm:text-sm">
              <EnvironmentOutlined className="mr-1" />
              {turf.location}
            </Text>
          </div>
          <div className="shrink-0">
            {turf.is_active ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">Active</span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">Inactive</span>
            )}
          </div>
        </div>

        {/* Description */}
        {turf.description && (
          <Paragraph className="mb-3 text-xs text-gray-200 sm:text-sm" ellipsis={{ rows: 2, expandable: false }}>
            {turf.description}
          </Paragraph>
        )}

        {/* Stats */}
        <div className="mb-4 flex flex-col gap-2 text-xs text-gray-300 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
          <div className="flex items-center">
            <TeamOutlined className="mr-1" />
            <span className="hidden sm:inline">Max {turf.max_players_per_team} players/team</span>
            <span className="sm:hidden">{turf.max_players_per_team} players/team</span>
          </div>
          <div className="space-y-1 sm:text-right">
            {turf.requires_membership && (
              <div>
                <div className="font-medium text-yellow-400">{turf.membership_fee ? `₦${turf.membership_fee}` : 'Membership Required'}</div>
                {turf.membership_type && <div className="text-xs text-gray-400">{turf.membership_type}</div>}
              </div>
            )}
            {turf.team_slot_fee && turf.team_slot_fee > 0 && (
              <div>
                <div className="font-medium text-blue-400">₦{turf.team_slot_fee} per slot</div>
                <div className="text-xs text-gray-400">team fee</div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <TurfCardActions
          turf={turf}
          isMember={isMember}
          isSelected={isSelected}
          isOwner={isOwner}
          joinLoading={isJoinLoading}
          onJoin={onJoin}
          onSelect={onSelect}
        />
      </div>
    </Card>
  );
};

// Loading Skeleton Component
const TurfGridSkeleton: React.FC = () => {
  const skeletonCards = Array.from({ length: 6 }, (_, index) => (
    <Card key={index} className="h-48 sm:h-64">
      <Skeleton active avatar={false} title={{ width: '60%' }} paragraph={{ rows: 3, width: ['100%', '80%', '60%'] }} />
    </Card>
  ));

  return <div className="mb-4 grid grid-cols-1 gap-3 sm:mb-6 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">{skeletonCards}</div>;
};

// Turf Grid Component
interface TurfGridProps {
  turfs: Turf[];
  loading: boolean;
  user: User | null;
  selectedTurf: Turf | null;
  belongingTurfs: Turf[];
  joinLoading: number | null;
  onJoin: (turf: Turf) => void;
  onSelect: (turf: Turf | null) => void;
  onClearSearch: () => void;
}

const TurfGrid: React.FC<TurfGridProps> = ({ turfs, loading, user, selectedTurf, belongingTurfs, joinLoading, onJoin, onSelect, onClearSearch }) => {
  if (loading && turfs.length === 0) {
    return <TurfGridSkeleton />;
  }

  return (
    <Spin spinning={loading && turfs.length > 0}>
      {turfs.length > 0 ? (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:mb-6 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {turfs.map((turf) => (
            <TurfListCard
              key={turf.id}
              turf={turf}
              user={user}
              selectedTurf={selectedTurf}
              belongingTurfs={belongingTurfs}
              joinLoading={joinLoading}
              onJoin={onJoin}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : (
        <Empty description="No turfs found" image={Empty.PRESENTED_IMAGE_SIMPLE} className="my-8">
          <Button type="primary" onClick={onClearSearch}>
            View All Turfs
          </Button>
        </Empty>
      )}
    </Spin>
  );
};

// Load More Button Component
interface LoadMoreButtonProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}

const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({ hasMore, loading, onLoadMore }) => {
  if (!hasMore) return null;

  return (
    <div className="text-center">
      <Button type="default" size="large" onClick={onLoadMore} loading={loading}>
        Load More Turfs
      </Button>
    </div>
  );
};

const TurfList: React.FC = () => {
  const { user } = useAuth();
  const { selectedTurf, setSelectedTurf, belongingTurfs, fetchBelongingTurfs } = useTurfStore();

  const [turfs, setTurfs] = useState<{
    data: Turf[];
    links: { next?: string; prev?: string };
    meta: { current_page: number; total: number; per_page: number };
  }>({
    data: [],
    links: {},
    meta: { current_page: 1, total: 0, per_page: 12 },
  });
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [currentFilter, setCurrentFilter] = useState<'all' | 'owned' | 'joined'>('all');

  // Load user's belonging turfs to check membership status
  useEffect(() => {
    if (user?.id) {
      fetchBelongingTurfs(user.id);
    }
  }, [user?.id, fetchBelongingTurfs]);

  // Filter turfs based on current filter
  const getFilteredTurfs = useCallback(
    (allTurfs: Turf[]) => {
      if (!user) return allTurfs;

      switch (currentFilter) {
        case 'owned':
          return allTurfs.filter((turf) => turf.owner_id === user.id);
        case 'joined':
          return allTurfs.filter((turf) => belongingTurfs.some((bt) => bt.id === turf.id) && turf.owner_id !== user.id);
        default:
          return allTurfs;
      }
    },
    [currentFilter, user, belongingTurfs],
  );

  const loadTurfs = useCallback(
    async (searchTerm = '', page = 1) => {
      setLoading(true);
      try {
        const response = await turfApi.getAll({
          search: searchTerm,
          per_page: 12,
          page,
          include: 'owner,players',
        });

        const filteredData = {
          ...response,
          data: getFilteredTurfs(response.data),
        };

        if (page === 1) {
          setTurfs(filteredData);
        } else {
          setTurfs((prev) => ({
            ...filteredData,
            data: [...prev.data, ...filteredData.data],
          }));
        }
        setCurrentPage(page);
      } catch (error) {
        console.error('Failed to load turfs:', error);
        message.error('Failed to load turfs');
      } finally {
        setLoading(false);
      }
    },
    [getFilteredTurfs],
  );

  // Load initial turfs on component mount
  useEffect(() => {
    loadTurfs();
  }, [loadTurfs]);

  // Reload when filter changes
  useEffect(() => {
    if (belongingTurfs.length > 0 || currentFilter === 'all') {
      // Re-filter existing data instead of making new API call for filter changes
      setTurfs((prev) => ({
        ...prev,
        data: getFilteredTurfs(prev.data),
      }));
    }
  }, [currentFilter, getFilteredTurfs, belongingTurfs]);

  const handleSearch = useCallback(
    async (value: string) => {
      setCurrentSearchTerm(value);
      await loadTurfs(value, 1);
    },
    [loadTurfs],
  );

  const handleFilterChange = useCallback((filter: 'all' | 'owned' | 'joined') => {
    setCurrentFilter(filter);
  }, []);

  const handleJoinTurf = useCallback(
    async (turf: Turf) => {
      if (!user) {
        message.error('Please login to join a turf');
        return;
      }

      setJoinLoading(turf.id);
      try {
        await turfApi.join(turf.id, {
          is_member: turf.requires_membership,
        });

        message.success(`Successfully joined ${turf.name}!`);

        // Refresh belonging turfs
        await fetchBelongingTurfs(user.id);

        // Set as selected turf
        setSelectedTurf(turf);

        // Navigate to turf detail
        router.visit(route('web.turfs.show', { turf: turf.id }));
      } catch (error) {
        console.error('Join turf failed:', error);
        message.error(error instanceof Error ? error.message : 'Failed to join turf');
      } finally {
        setJoinLoading(null);
      }
    },
    [user, fetchBelongingTurfs, setSelectedTurf],
  );

  const loadMore = useCallback(async () => {
    if (!turfs.links?.next) return;

    const nextPage = currentPage + 1;
    await loadTurfs(currentSearchTerm, nextPage);
  }, [turfs.links?.next, currentPage, currentSearchTerm, loadTurfs]);

  const handleClearSearch = useCallback(async () => {
    await handleSearch('');
  }, [handleSearch]);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6">
        {/* Current Selection Info */}
        <SelectedTurfCard buttonText="View Turf" />

        {/* Header */}
        <TurfListHeader />

        {/* Search */}
        <TurfSearch onSearch={handleSearch} onFilterChange={handleFilterChange} currentFilter={currentFilter} loading={loading} />

        {/* Turfs Grid */}
        <TurfGrid
          turfs={turfs.data}
          loading={loading}
          user={user}
          selectedTurf={selectedTurf}
          belongingTurfs={belongingTurfs}
          joinLoading={joinLoading}
          onJoin={handleJoinTurf}
          onSelect={setSelectedTurf}
          onClearSearch={handleClearSearch}
        />

        {/* Load More */}
        <LoadMoreButton hasMore={!!turfs.links?.next} loading={loading} onLoadMore={loadMore} />
      </div>
    </div>
  );
};

export default TurfList;
