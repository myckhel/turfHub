import { PlusOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Empty, Input, Modal, Radio, Tag, Typography, message } from 'antd';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { teamApi } from '../../apis/team';
import { useTeamStore } from '../../stores/team.store';
import type { Player } from '../../types/player.types';

const { Text } = Typography;
const { Search } = Input;

// Debounce utility
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

interface AddPlayerModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  teamId: number;
  matchSessionId: number;
  currentPlayerCount: number;
  maxPlayers: number;
}

const AddPlayerModal: React.FC<AddPlayerModalProps> = memo(
  ({ open, onCancel, onSuccess, teamId, matchSessionId, currentPlayerCount, maxPlayers }) => {
    const {
      availablePlayers,
      isLoadingPlayers,
      selectedPlayers,
      searchTerm,
      filterMode,
      fetchAvailablePlayers,
      addSelectedPlayer,
      removeSelectedPlayer,
      clearSelectedPlayers,
      setSearchTerm,
      setFilterMode,
      reset,
    } = useTeamStore();

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Debounce search term for backend search
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Use available players directly since search is now handled by backend
    const filteredPlayers = availablePlayers;

    // Calculate how many more players can be added
    const remainingSlots = maxPlayers - currentPlayerCount;
    const canAddMore = selectedPlayers.length < remainingSlots;

    // Load players when modal opens
    useEffect(() => {
      if (open) {
        fetchAvailablePlayers(matchSessionId, filterMode === 'unassigned');
      }
    }, [open, matchSessionId, filterMode, fetchAvailablePlayers]);

    // Trigger backend search when debounced search term changes
    useEffect(() => {
      if (open && debouncedSearchTerm !== undefined) {
        fetchAvailablePlayers(matchSessionId, filterMode === 'unassigned', debouncedSearchTerm);
      }
    }, [debouncedSearchTerm, open, matchSessionId, filterMode, fetchAvailablePlayers]);

    // Reset state when modal closes
    useEffect(() => {
      if (!open) {
        reset();
      }
    }, [open, reset]);

    const handlePlayerSelect = useCallback(
      (player: Player) => {
        if (selectedPlayers.includes(player.id)) {
          removeSelectedPlayer(player.id);
        } else if (canAddMore) {
          addSelectedPlayer(player.id);
        }
      },
      [selectedPlayers, canAddMore, addSelectedPlayer, removeSelectedPlayer],
    );

    const handleFilterChange = useCallback(
      (mode: 'all' | 'unassigned') => {
        setFilterMode(mode);
        fetchAvailablePlayers(matchSessionId, mode === 'unassigned', searchTerm || undefined);
      },
      [setFilterMode, fetchAvailablePlayers, matchSessionId, searchTerm],
    );

    const handleSubmit = useCallback(async () => {
      if (selectedPlayers.length === 0) return;

      setIsSubmitting(true);

      try {
        // Add each selected player to the team
        for (const playerId of selectedPlayers) {
          await teamApi.addPlayerToSlot({
            team_id: teamId,
            player_id: playerId,
          });
        }

        message.success(`Successfully added ${selectedPlayers.length} player(s) to the team!`);
        onSuccess();
        onCancel();
      } catch (error) {
        console.error('Failed to add players:', error);
        message.error('Failed to add players to team. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }, [selectedPlayers, teamId, onSuccess, onCancel]);

    const handleCancel = useCallback(() => {
      clearSelectedPlayers();
      setSearchTerm('');
      onCancel();
    }, [clearSelectedPlayers, setSearchTerm, onCancel]);

    const PlayerCard = memo(({ player }: { player: Player }) => {
      const isSelected = selectedPlayers.includes(player.id);
      const isDisabled = !canAddMore && !isSelected;

      return (
        <Card
          size="small"
          className={`cursor-pointer transition-all duration-200 ${
            isSelected
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : isDisabled
                ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-50'
                : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
          }`}
          onClick={() => !isDisabled && handlePlayerSelect(player)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar size="large" src={player.user.avatar}>
                {player.user.name.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <Text strong className={isSelected ? 'text-blue-600' : ''}>
                    {player.user.name}
                  </Text>
                  {player.is_member && <Tag color="green">Member</Tag>}
                </div>
                <Text type="secondary" className="text-sm">
                  Status: {player.status}
                </Text>
              </div>
            </div>

            {isSelected && (
              <div className="flex items-center text-blue-500">
                <PlusOutlined className="text-lg" />
              </div>
            )}
          </div>
        </Card>
      );
    });

    PlayerCard.displayName = 'PlayerCard';

    return (
      <Modal
        title={
          <div className="flex items-center gap-2">
            <TeamOutlined />
            <span>Add Players to Team</span>
          </div>
        }
        open={open}
        onOk={handleSubmit}
        onCancel={handleCancel}
        confirmLoading={isSubmitting}
        okButtonProps={{
          disabled: selectedPlayers.length === 0,
        }}
        okText={`Add ${selectedPlayers.length} Player${selectedPlayers.length !== 1 ? 's' : ''}`}
        width={720}
        bodyStyle={{ maxHeight: '60vh', overflow: 'auto' }}
      >
        <div className="space-y-4">
          {/* Team Status Info */}
          <Card size="small" className="border-blue-200 bg-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserOutlined className="text-blue-500" />
                <Text>
                  Current team size:{' '}
                  <strong>
                    {currentPlayerCount} / {maxPlayers}
                  </strong>
                </Text>
              </div>
              <div className="flex items-center gap-2">
                <Text type="secondary">Remaining slots:</Text>
                <Tag color={remainingSlots > 0 ? 'green' : 'red'}>{remainingSlots}</Tag>
              </div>
            </div>
          </Card>

          {/* Search and Filter Controls */}
          <div className="space-y-3">
            <Search
              placeholder="Search players by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              size="large"
            />

            <div className="flex items-center justify-between">
              <Radio.Group value={filterMode} onChange={(e) => handleFilterChange(e.target.value)} size="small">
                <Radio.Button value="unassigned">Unassigned Players</Radio.Button>
                <Radio.Button value="all">All Available Players</Radio.Button>
              </Radio.Group>

              {selectedPlayers.length > 0 && (
                <div className="flex items-center gap-2">
                  <Text type="secondary">Selected:</Text>
                  <Tag color="blue">{selectedPlayers.length}</Tag>
                  <Button type="text" size="small" onClick={clearSelectedPlayers}>
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Players List */}
          <div className="space-y-2">
            {isLoadingPlayers ? (
              <div className="py-8 text-center">
                <Text type="secondary">Loading available players...</Text>
              </div>
            ) : filteredPlayers.length === 0 ? (
              <Empty
                description={
                  searchTerm
                    ? `No players found matching "${searchTerm}"`
                    : filterMode === 'unassigned'
                      ? 'No unassigned players available'
                      : 'No available players'
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <>
                {!canAddMore && selectedPlayers.length === 0 && (
                  <Card size="small" className="border-yellow-200 bg-yellow-50">
                    <Text type="warning">⚠️ Team is full. Remove existing players first to add new ones.</Text>
                  </Card>
                )}

                {filteredPlayers.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </>
            )}
          </div>
        </div>
      </Modal>
    );
  },
);

AddPlayerModal.displayName = 'AddPlayerModal';

export default AddPlayerModal;
