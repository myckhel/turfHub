import { CheckCircleOutlined, CrownOutlined, EnvironmentOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons';
import { router } from '@inertiajs/react';
import { Button, Card, Empty, Input, Skeleton, Spin, Typography, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { turfApi } from '../../../apis/turf';
import { SelectedTurfCard, TurfCard } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import { useTurfStore } from '../../../stores/turf.store';
import type { Turf } from '../../../types/turf.types';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

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
  const [searchTerm, setSearchTerm] = useState('');
  const [joinLoading, setJoinLoading] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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

  const handleSearch = async (value: string) => {
    setLoading(true);
    setSearchTerm(value);
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
  };

  const handleJoinTurf = async (turf: Turf) => {
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
  };

  const isMemberOfTurf = (turfId: number) => {
    return belongingTurfs.some((turf) => turf.id === turfId);
  };

  const isSelectedTurf = (turfId: number) => {
    return selectedTurf?.id === turfId;
  };

  const loadMore = async () => {
    if (!turfs.links?.next) return;

    setLoading(true);
    try {
      const nextPage = currentPage + 1;
      const response = await turfApi.getAll({
        search: searchTerm,
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
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    handleSearch('');
  };

  const renderTurfCard = (turf: Turf) => {
    const isMember = isMemberOfTurf(turf.id);
    const isSelected = isSelectedTurf(turf.id);
    const isOwner = turf.owner_id === user?.id;

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
          <div className="flex gap-2">
            <Button
              type="default"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                router.visit(route('web.turfs.show', { turf: turf.id }));
              }}
              className="flex-1"
            >
              View Details
            </Button>

            {!isOwner && (
              <>
                {isMember ? (
                  <Button
                    type={isSelected ? 'default' : 'primary'}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTurf(isSelected ? null : turf);
                    }}
                    className="flex-1"
                  >
                    {isSelected ? 'Deselect' : 'Select'}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size="small"
                    loading={joinLoading === turf.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinTurf(turf);
                    }}
                    disabled={!turf.is_active}
                    className="flex-1"
                  >
                    Join Turf
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </TurfCard>
    );
  };

  const renderSkeletonCards = () => {
    return Array.from({ length: 6 }, (_, index) => (
      <Card key={index} className="h-64">
        <Skeleton active avatar={false} title={{ width: '60%' }} paragraph={{ rows: 3, width: ['100%', '80%', '60%'] }} />
      </Card>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-green-900">
      <div className="container mx-auto px-4 py-6">
        {/* Current Selection Info */}
        <SelectedTurfCard buttonText="View Turf" />

        {/* Header */}
        <div className="my-6">
          <Title level={2} className="mb-2 text-white">
            Discover Turfs
          </Title>
          <Text className="text-base text-gray-300">Find and join football turfs in your area</Text>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Search
            placeholder="Search turfs by name or location..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={handleSearch}
            className="max-w-md"
          />
        </div>

        {/* Turfs Grid */}
        {loading && turfs.data.length === 0 ? (
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{renderSkeletonCards()}</div>
        ) : (
          <Spin spinning={loading && turfs.data.length > 0}>
            {turfs.data.length > 0 ? (
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{turfs.data.map(renderTurfCard)}</div>
            ) : (
              <Empty description="No turfs found" image={Empty.PRESENTED_IMAGE_SIMPLE} className="my-8">
                <Button type="primary" onClick={handleClearSearch}>
                  View All Turfs
                </Button>
              </Empty>
            )}
          </Spin>
        )}

        {/* Load More */}
        {turfs.links?.next && (
          <div className="text-center">
            <Button type="default" size="large" onClick={loadMore} loading={loading}>
              Load More Turfs
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TurfList;
