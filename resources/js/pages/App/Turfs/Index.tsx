import { CheckCircleOutlined, CrownOutlined, EnvironmentOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons';
import { router } from '@inertiajs/react';
import { Button, Card, Empty, Input, Skeleton, Spin, Typography, message } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { turfApi } from '../../../apis/turf';
import { SelectedTurfCard, TurfCard } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import type { User } from '../../../stores/auth.store';
import { useTurfStore } from '../../../stores/turf.store';
import type { Turf } from '../../../types/turf.types';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

// Header Section Component
const TurfListHeader: React.FC = () => (
  <div className="my-6">
    <Title level={2} className="mb-2 text-white">
      Discover Turfs
    </Title>
    <Text className="text-base text-gray-300">Find and join football turfs in your area</Text>
  </div>
);

// Search Component with encapsulated state
interface TurfSearchProps {
  onSearch: (value: string) => void;
  loading: boolean;
}

const TurfSearch: React.FC<TurfSearchProps> = ({ onSearch, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="mb-6">
      <Search
        placeholder="Search turfs by name or location..."
        allowClear
        enterButton={<SearchOutlined />}
        size="large"
        value={searchTerm}
        onChange={handleChange}
        onSearch={handleSearch}
        className="max-w-md"
        loading={loading}
      />
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

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(isSelected ? null : turf);
  };

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onJoin(turf);
  };

  return (
    <div className="flex gap-2">
      <Button type="default" size="small" onClick={handleViewDetails} className="flex-1">
        View Details
      </Button>

      {!isOwner && (
        <>
          {isMember ? (
            <Button type={isSelected ? 'default' : 'primary'} size="small" onClick={handleSelect} className="flex-1">
              {isSelected ? 'Deselect' : 'Select'}
            </Button>
          ) : (
            <Button type="primary" size="small" loading={joinLoading} onClick={handleJoin} disabled={!turf.is_active} className="flex-1">
              Join Turf
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
    <TurfCard
      key={turf.id}
      variant={isSelected ? 'elevated' : 'default'}
      interactive
      className={`turf-card ${isSelected ? 'selected' : ''}`}
      onPress={() => router.visit(route('web.turfs.show', { turf: turf.id }))}
    >
      <div className="p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <Title level={4} className="mb-1 text-white">
              {turf.name}
              {isOwner && <CrownOutlined className="ml-2 text-yellow-400" />}
              {isSelected && <CheckCircleOutlined className="ml-2 text-green-400" />}
            </Title>
            <Text type="secondary" className="flex items-center text-gray-300">
              <EnvironmentOutlined className="mr-1" />
              {turf.location}
            </Text>
          </div>
          <div className="text-right">
            {turf.is_active ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">Active</span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">Inactive</span>
            )}
          </div>
        </div>

        {/* Description */}
        {turf.description && (
          <Paragraph className="mb-3 text-gray-200" ellipsis={{ rows: 2, expandable: false }}>
            {turf.description}
          </Paragraph>
        )}

        {/* Stats */}
        <div className="mb-4 flex items-center justify-between text-sm text-gray-300">
          <div className="flex items-center">
            <TeamOutlined className="mr-1" />
            Max {turf.max_players_per_team} players/team
          </div>
          {turf.requires_membership && (
            <div className="text-right">
              <div className="font-medium text-yellow-400">{turf.membership_fee ? `₦${turf.membership_fee}` : 'Membership Required'}</div>
              {turf.membership_type && <div className="text-xs text-gray-400">{turf.membership_type}</div>}
            </div>
          )}
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
    </TurfCard>
  );
};

// Loading Skeleton Component
const TurfGridSkeleton: React.FC = () => {
  const skeletonCards = Array.from({ length: 6 }, (_, index) => (
    <Card key={index} className="h-64">
      <Skeleton active avatar={false} title={{ width: '60%' }} paragraph={{ rows: 3, width: ['100%', '80%', '60%'] }} />
    </Card>
  ));

  return <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{skeletonCards}</div>;
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
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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

  // Load user's belonging turfs to check membership status
  useEffect(() => {
    if (user?.id) {
      fetchBelongingTurfs(user.id);
    }
  }, [user?.id, fetchBelongingTurfs]);

  // Load initial turfs on component mount
  useEffect(() => {
    const loadInitialTurfs = async () => {
      setLoading(true);
      try {
        const response = await turfApi.getAll({
          per_page: 12,
          include: 'owner,players',
        });

        setTurfs(response);
        setCurrentPage(1);
      } catch (error) {
        console.error('Failed to load turfs:', error);
        message.error('Failed to load turfs');
      } finally {
        setLoading(false);
      }
    };

    loadInitialTurfs();
  }, []);

  const handleSearch = useCallback(async (value: string) => {
    setLoading(true);
    setCurrentSearchTerm(value);
    try {
      const response = await turfApi.getAll({
        search: value,
        per_page: 12,
        include: 'owner,players',
      });

      setTurfs(response);
      setCurrentPage(1);
    } catch (error) {
      console.error('Search failed:', error);
      message.error('Failed to search turfs');
    } finally {
      setLoading(false);
    }
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

    setLoading(true);
    try {
      const nextPage = currentPage + 1;
      const response = await turfApi.getAll({
        search: currentSearchTerm,
        per_page: 12,
        page: nextPage,
        include: 'owner,players',
      });

      setTurfs((prev) => ({
        ...response,
        data: [...prev.data, ...response.data],
      }));
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Load more failed:', error);
      message.error('Failed to load more turfs');
    } finally {
      setLoading(false);
    }
  }, [turfs.links?.next, currentPage, currentSearchTerm]);

  const handleClearSearch = useCallback(() => {
    handleSearch('');
  }, [handleSearch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-green-900">
      <div className="container mx-auto px-4 py-6">
        {/* Current Selection Info */}
        <SelectedTurfCard buttonText="View Turf" />

        {/* Header */}
        <TurfListHeader />

        {/* Search */}
        <TurfSearch onSearch={handleSearch} loading={loading} />

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
